const { SyncHook } = require('tapable');
const path = require('path');
const fs = require('fs');

// 
const esprima = require('esprima');
const estraverse = require('estraverse');
const escodegen = require('escodegen');

const ejs = require('ejs');

class Compiler {
    constructor(options) {
        this.options = options;
        this.hooks = {
            entryOption: new SyncHook(['config']),
            afterPlugins: new SyncHook(['config']),
            run: new SyncHook(['config']),
            compile: new SyncHook(['config']),
            afterCompile: new SyncHook(['config']),
            emit: new SyncHook(['config']),
            done: new SyncHook(['config']),
        };
        let plugins = options.plugins;
        if (plugins && plugins.length > 0) {
            plugins.forEach(plugin => {
                plugin.apply(this);
            });
        }

        // 触发插件加载完成事件
        this.hooks.afterPlugins.call(this);
    }

    // 找到入口文件,进行编译
    run() {
        // 执行并创建模块依赖关系
        let { entry, output: { path: dist, filename }, module: {rules} } = this.options;
        // 取得当前工作目录
        let root = process.cwd();
        // 获取入口路径 D:\test\webpack_share\test-project\src\index.js
        let entryPath = path.join(root, entry);
        let modules = {};
        this.hooks.compile.call(this);
        let entryId;
        parseModule(entryPath, true);
        this.hooks.afterCompile.call(this);

        let bundle = ejs.compile(fs.readFileSync(path.join(__dirname, 'main.ejs'), 'utf8'))({
            modules, entryId
        });

        this.hooks.emit.call(this);

        fs.writeFileSync(path.join(dist, filename), bundle);

        this.hooks.done.call(this);

        function parseModule(entryPath, isEntry) {
            // 读取文件内容
            let source = fs.readFileSync(entryPath, 'utf8');
            let parentPath = path.relative(root, entryPath);  // => src/index.js

            // todo 执行loader进行转换
            rules.forEach(rule => {
                let {test, loader: loaders} = rule;
                if(test.test(entryPath)) {
                    loaders.reverse().forEach(loader => {
                        loader = require(path.join(root, './src/loaders/', loader + '.js'));
                        source = loader(source);
                    })
                }
            })
            let result = parse(source, path.dirname(parentPath));

            modules[`${parentPath}`] = result.source;
            if (isEntry) {
                entryId = `${parentPath}`;
            }

            let requires = result.requires;

            if (requires && requires.length > 0) {
                requires.forEach(require => parseModule(path.join(root, require)));
            }

        }

        // 解析模块,返回依赖模块 parentPath是一个相对路径 src
        function parse(source, parentPath) {
            // 生成抽象语法树
            let ast = esprima.parse(source);
            // 遍历抽象语法树, 1. 找到依赖模块 2. 替换原来的加载路径
            let requires = [];
            estraverse.replace(ast, {
                enter(node, parent) {
                    if (node.type === 'CallExpression' && node.callee.name === 'require') {
                        let name = node.arguments[0].value; // ./components/a
                        name += (name.lastIndexOf('.') > 0 ? '' : '.js'); // 补充后缀
                        let moduleId = path.join(parentPath, name); // => src/components/a
                        requires.push(moduleId);
                        // 修改ast的路径
                        node.arguments = [{ type: 'Literal', value: moduleId }];
                        // 替换require
                        node.callee.name = '__webpack_require__';
                        return node;
                    }
                }
            });
            source = escodegen.generate(ast);
            return {
                requires,
                source,
            }
        }
    }
};

module.exports = Compiler;
