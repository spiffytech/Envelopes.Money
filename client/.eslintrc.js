module.exports = {
  env: {
    browser: true,
    es6: true,
    'cypress/globals': true,
  },
  plugins: ['svelte3', 'cypress'],
  extends: 'eslint:recommended',
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
    emit: 'readonly',
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
