const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const HtmlWebpackPlugin = require('html-webpack-plugin');

const mode = process.env.NODE_ENV || 'development';
const prod = mode === 'production';

module.exports = {
    devServer: {
        port: 5001,
        proxy: {
            context: () => true,
            target: 'http://localhost:8001'
        }
    },
	entry: {
		bundle: ['./src/main.js']
	},
	resolve: {
		extensions: ['.mjs', '.js', '.svelte']
	},
	output: {
		path: __dirname + '/public',
		filename: '[name].[contenthash].js',
		chunkFilename: '[name].[id].js'
	},
	module: {
		rules: [
			{
				test: /\.svelte$/,
				exclude: /node_modules/,
				use: {
					loader: 'svelte-loader',
					options: {
						emitCss: true,
						hotReload: true
					}
				}
			},
			{
				test: /\.css$/,
				use: [
					/**
					 * MiniCssExtractPlugin doesn't support HMR.
					 * For developing, use 'style-loader' instead.
					 * */
					prod ? MiniCssExtractPlugin.loader : 'style-loader',
					'css-loader'
				]
			}
		]
	},
	mode,
	plugins: [
		new HtmlWebpackPlugin({title: "Envelopes.money", template: 'public/index.html'}),
		new MiniCssExtractPlugin({
			filename: '[name].css'
		}),
        ...(prod ? [] : [new BundleAnalyzerPlugin()]),
	],
    //devtool: prod ? false: 'source-map',
	devtool: 'source-map',
	optimization: {
        usedExports: true,
        minimize: true
	},
};
