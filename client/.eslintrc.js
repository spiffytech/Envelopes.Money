module.exports = {
  extends: 'eslint:recommended',
  plugins: ['svelte3', 'cypress'],
  env: {
    browser: true,
    es6: true,
    'cypress/globals': true,
  },
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
    emit: 'readonly',
    __COMMIT_HASH__: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  overrides: [
    {
      files: ['**/*.svelte'],
      processor: 'svelte3/svelte3'
    }
  ],
  rules: {
    'no-console': ["error", { allow: ["warn", "error"] }],
    'no-unused-vars': ["error", {varsIgnorePattern: "[iI]gnored"}]
  },
};
