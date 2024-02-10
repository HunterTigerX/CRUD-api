import path from 'path';
import merge from 'webpack-merge';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CleanWebpackPlugin from 'clean-webpack-plugin';
import Dotenv from 'dotenv-webpack';

const baseConfig = {
    watch: true,
    entry: path.resolve(__dirname, 'src', 'server', 'server.mjs'),

    mode: 'development',
    module: {
        rules: [
            {
                test: /\.tsx?$/i,
                use: ['ts-loader'],
                exclude: /node_modules/,
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: ['babel-loader'],
            },
            {
                test: /\.gif$/,
                type: 'asset/inline',
            },
            {
                test: /\.(ttf|eot|svg)$/,
                type: 'asset/resource',
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.js', '.ts', '.json'],
        alias: {
            config$: './configs/app-config.js',
            react: './vendor/react-master',
        },
        modules: ['node_modules', 'bower_components', 'shared', '/shared/vendor/modules'],
        fallback: {
            http: false,
            https: false,
        },
    },
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, './deploy'),
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, './src/userTesting/index.html'),
            filename: 'index.html',
        }),
        new CleanWebpackPlugin(),
        new Dotenv({
            path: './.env',
        })
    ],
};

module.exports = ({ mode }) => {
    const isProductionMode = mode === 'prod';
    const envConfig = isProductionMode ? require('./webpack.prod.config') : require('./webpack.dev.config');

    return merge(baseConfig, envConfig);
};
