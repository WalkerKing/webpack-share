#! /usr/bin/env node

const path = require('path');

const root = process.cwd(); // 取得当前工作目录

const configPath = path.join(root, 'webpack.config.js');

const config = require(configPath);

const Compiler = require('../libs/Compiler');

const compiler = new Compiler(config);

// 触发entryOption事件
compiler.hooks.entryOption.call(config);

compiler.run();
