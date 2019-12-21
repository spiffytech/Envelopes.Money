var HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

const mode = process.env.NODE_ENV || 'development';
const prod = mode === 'production';

module.exports = {
  entry: './src/index.ts',
  devServer: {
    port: 8080,
    // So we can test on phones
    allowedHosts: ['.ngrok.io', '.localhost.run'],
    proxy: {
        context: ['/api', '/auth'],
        target: `http://${process.env.HOST || 'localhost'}:8000`
    },
    contentBase: path.resolve(__dirname, 'public'),
    // Allow us to use HTML5 history push routing
    historyApiFallback: true
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Envelopes.money',
      template: 'public/index.tpl.html',
    }),
  ],
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[id].js',
    // Necessary to make historyApiFallback work with page reloads
    publicPath: '/'
  },
  devtool: 'source-map',
  optimization: {
    usedExports: prod,
    minimize: prod,
    concatenateModules: false,
    namedModules: true,
    namedChunks: true,
  },
};
