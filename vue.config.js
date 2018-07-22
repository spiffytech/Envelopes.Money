const webpack = require('webpack');

module.exports = {
  configureWebpack: {
    devtool: 'eval-source-map',
    plugins: [
      //new webpack.IgnorePlugin(/.*/, /views\/.*/),
      new webpack.IgnorePlugin(/views\/lib\/.*/),
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
