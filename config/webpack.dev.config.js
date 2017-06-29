const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports =  {
    context: path.resolve(__dirname, '../www'),
    entry: ['./js/main.js', './styles/main.scss'],
    output: {
        path: path.resolve(__dirname, '../dist'),
        filename: 'js/main.js'
    },
    devServer: {
        contentBase: path.resolve(__dirname, '../dist')
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['es2015']
                    }
                }
            },
            { // sass / scss loader for webpack
                test: /\.(scss)$/,
                loader: ExtractTextPlugin.extract(['css-loader', 'sass-loader'])
            },
            {
                test: /\.svg$/,
                loader: 'file-loader',
                query: {
                    name: '/media/[name].[ext]'
                }
            }
        ]
    },
    plugins: [
        new ExtractTextPlugin({ // define where to save the file
            filename: 'styles/[name].css',
            allChunks: true,
        }),
        new HtmlWebpackPlugin({
            inject: true,
            template: 'index.html'
        })
    ]
};
