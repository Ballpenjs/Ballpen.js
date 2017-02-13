module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 6
  },
  // https://github.com/feross/standard/blob/master/RULES.md#javascript-standard-style
  extends: 'standard',
  // required to lint *.vue files
  plugins: [
    'html'
  ],
  // add your custom rules here
  'rules': {
    // allow paren-less arrow functions
    'arrow-parens': 0,
    // allow async-await
    'generator-star-spacing': 0,
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    'semi': ['error', 'always'],
    'no-unused-vars': 0,
    'no-multiple-empty-lines': 0,
    'no-trailing-spaces': 0,
    'space-before-function-paren': 0,
    'handle-callback-err': 0,
    'no-caller': 0,
    'no-multi-spaces': 0,
    'no-undef': 0,
    'indent': 0,
    'no-tabs': 0
  }
}
