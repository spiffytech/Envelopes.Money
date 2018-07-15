module.exports = {
  configureWebpack: {
	devtool: 'eval-source-map',
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
