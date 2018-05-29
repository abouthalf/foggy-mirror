const webpack = require('webpack');
const {resolve, join} = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ScriptExtHtmlWebPackPlugin = require('script-ext-html-webpack-plugin');
const LessPluginAutoPrefix = require('less-plugin-autoprefix');
const CleanCSSPlugin = require('less-plugin-clean-css');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
    context: resolve(__dirname, 'src'),
    entry: {
        app: './index.js'
    },
    output: {
        filename: '[name].bundle.[hash].js',
        path: resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            {
                test: /\.less$/,
                use: [
                    {
                        loader: 'style-loader'
                    },
                    {
                        loader: 'css-loader'
                    },
                    {
                        loader: 'less-loader',
                        options: {
                            noIeCompat: true,
                            plugins: [
                                new LessPluginAutoPrefix({browsers: ["last 2 versions"]}),
                                new CleanCSSPlugin({advanced: true})
                            ]
                        }
                    }
                ]
            },
            {
                test: /\.(png|jpg|gif)$/,
                use: {
                    loader: 'file-loader',
                    options: {}
                }
            }
        ]
    },
    devServer: {
        hot: true,
        contentBase: join(__dirname, 'dist'),
        compress: true,
    },
    plugins: [
        new CleanWebpackPlugin(
            [resolve(__dirname, 'dist')],
            {
                root: __dirname,
                exclude: ['.nojekyll', 'CNAME']
            }
        ),
        new webpack.HotModuleReplacementPlugin(),
        new HtmlWebpackPlugin({
            template: resolve(__dirname, 'src/index.html')
        }),
        new ScriptExtHtmlWebPackPlugin({
            defaultAttribute: 'defer',
            module: 'app'
        }) 
    ]
}