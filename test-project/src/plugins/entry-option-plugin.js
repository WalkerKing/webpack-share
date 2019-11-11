class EntryOptionPlugin {
    apply(compile) {
        compile.hooks.entryOption.tap('EntryOptionPlugin', function() {
            // console.log('参数解析完毕');
        });
    }
}

module.exports = EntryOptionPlugin;