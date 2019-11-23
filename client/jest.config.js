module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.svelte$': 'jest-transform-svelte'
  },
    transformIgnorePatterns: [
      "/node_modules/(?!ramda).+\\.js$"
    ]
};
