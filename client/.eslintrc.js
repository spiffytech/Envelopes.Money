module.exports = {
    "env": {
        "browser": true,
        "es6": true
    },
    "plugins": [
        "svelte3"
    ],
    "extends": "eslint:recommended",
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parserOptions": {
        "ecmaVersion": 2018,
        "sourceType": "module"
    },
    "rules": {
    }
};
