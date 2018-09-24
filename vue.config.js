const webpack = require('webpack');

const CompressionWebpackPlugin = require('compression-webpack-plugin')
const productionGzipExtensions = ['js', 'css']

module.exports = {
  configureWebpack: {
    devtool: 'eval-source-map',
    plugins: [
      //new webpack.IgnorePlugin(/.*/, /views\/.*/),
      new webpack.IgnorePlugin(/views\/lib\/.*/),
      new CompressionWebpackPlugin({
		filename: '[path].gz[query]',
		algorithm: 'gzip',
		test: new RegExp('\\.(' + productionGzipExtensions.join('|') + ')$'),
		threshold: 10240,
		minRatio: 0.8
      }),
    ]
  },
  devServer: {
    disableHostCheck: true
  },
  pluginOptions: {
    webpackBundleAnalyzer: {
      openAnalyzer: true
    }
  }
}
