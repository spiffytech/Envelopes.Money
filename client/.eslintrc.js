module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "cypress/globals": true
    },
    "plugins": [
        "svelte3",
        "cypress"
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
