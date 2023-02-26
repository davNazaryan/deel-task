module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: 'airbnb-base',
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'comma-dangle': ['error', {
      objects: 'always-multiline',
      arrays: 'always-multiline',
    }],
    'no-unused-vars': ['error', { argsIgnorePattern: 'next' }],
    semi: ['error', 'always'],
    'max-classes-per-file': 'off',
    'operator-linebreak': 'off',
  },
  overrides: [],
};
