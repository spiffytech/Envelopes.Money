const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');
const dotenv = require('dotenv');
dotenv.config();

const mode = process.env.NODE_ENV || 'development';
const prod = mode === 'production';

module.exports = {
  devServer: {
    port: 8080,
    // So we can test on phones
    allowedHosts: ['.ngrok.io', '.localhost.run'],
    proxy: {
        context: ['/api', '/auth'],
        target: `http://${process.env.HOST || 'localhost'}:8001`
    }
  },
  entry: {
    bundle: ['./src/main.js'],
  },
  resolve: {
    extensions: ['.mjs', '.js', '.svelte'],
  },
  output: {
    path: __dirname + '/public',
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[id].js',
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        use: 'babel-loader'
      },
      {
        test: /\.svelte$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          },
          {
            loader: 'svelte-loader',
            options: {
              emitCss: true,
              hotReload: true,
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          /**
           * MiniCssExtractPlugin doesn't support HMR.
           * For developing, use 'style-loader' instead.
           * */
          prod ? MiniCssExtractPlugin.loader : 'style-loader',
          'css-loader',
        ],
      },
    ],
  },
  mode,
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Envelopes.money',
      template: 'public/index.tpl.html',
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
    ...(prod ? [] : [new BundleAnalyzerPlugin()]),
    new WorkboxPlugin.GenerateSW({
      // these options encourage the ServiceWorkers to get in there fast
      // and not allow any straggling "old" SWs to hang around
      clientsClaim: true,
      skipWaiting: true,
      runtimeCaching: [
        {
          urlPattern: /(.*env\.js|global.css|bundle.css|index.html)/,
          handler: 'NetworkFirst',
          options: {
            networkTimeoutSeconds: 2,
            backgroundSync: {
              name: 'env-js-queue',
            },
          },
        },
      ],
    }),
  ],
  //devtool: prod ? false: 'source-map',
  devtool: 'source-map',
  optimization: {
    usedExports: prod,
    minimize: prod,
  },
};
