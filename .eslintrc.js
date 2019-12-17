module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true
  },
  extends: [
    'standard',
    'plugin:prettier/recommended'
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
    '__webpack_require__': 'readonly'
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error'
  },
  ignorePatterns: ['dist/']
}
