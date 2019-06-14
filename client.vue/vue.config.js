// vue.config.js
module.exports = {
    devServer: {
        host: 'penguin.linux.test',
        disableHostCheck: true,
        "proxy": "http://localhost:8000"
    }
}
