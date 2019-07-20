const whitelist = (process.argv[2] || '').split(',');
const whitelistedVars: {[key: string]: string} = {};
whitelist.forEach((var_) => whitelistedVars[var_] = process.env[var_] || '');
console.log(`window._env_ = ${JSON.stringify(whitelistedVars, null, 4)};`);
