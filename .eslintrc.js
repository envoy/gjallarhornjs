module.exports = {
  parser: 'typescript-eslint-parser',
  extends: ['plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: 'module',
  },
  plugins: ['prettier', 'typescript'],
  env: {
    browser: true,
  }
};
