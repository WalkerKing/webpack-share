const path = require('path');
// const EntryOptionPlugin = require('./src/plugins/entry-option-plugin');

module.exports = {
    entry: './src/index.js',
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'bundle.js',
        publicPath: '',
    },
    module: {
        rules: [
            {
                test: /\.less$/,
                loader: ['style-loader', 'less-loader']
            }
        ]
    },
    plugins: [
        // new EntryOptionPlugin(),
    ]
}