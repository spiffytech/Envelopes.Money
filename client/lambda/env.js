module.exports.handler = function(event, context, cb) {
    const whitelist = [
        "GRAPHQL_HTTP_HOST",
        "GRAPHQL_WSS_HOST",
        "LOGROCKET_APP",
        "USE_POUCH",
        "COUCHDB",
        "POUCH_ONLY",
        "ALERT_ON_ERROR",
        "DISABLE_SERVICE_WORKER",
    ]
    const whitelistedVars = {};
    whitelist.forEach((var_) => whitelistedVars[var_] = process.env[var_] || '');
    cb(null, {
      statusCode: 200,
      body: `window._env_ = ${JSON.stringify(whitelistedVars, null, 4)};`
    });
}
