const globals = require('globals')
const pluginVue = require('eslint-plugin-vue')
const pluginTs = require('@typescript-eslint/eslint-plugin')
const parserTs = require('@typescript-eslint/parser')

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.eslintrc.js',
      'vite.config.ts',
      'scripts/**',
      'shims-uni.d.ts',
      'src/env.d.ts',
      '*.md',
      '*.json',
      '*.png',
      '*.jpg',
      '*.jpeg',
      '*.gif',
      '*.svg'
    ]
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        uni: true,
        getCurrentPages: true,
        uniApp: true,
        App: true,
        Page: true,
        Component: true
      },
      parser: require('vue-eslint-parser'),
      parserOptions: {
        parser: parserTs,
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue']
      }
    },
    plugins: {
      vue: pluginVue,
      '@typescript-eslint': pluginTs
    },
    rules: {
      'vue/no-unused-components': 'error',
      'vue/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      'vue/multi-word-component-names': 'off',
      'vue/html-indent': ['error', 2],
      'vue/max-attributes-per-line': ['error', {
        singleline: { max: 3 },
        multiline: { max: 1 }
      }],
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-self-closing': 'error',
      'vue/script-indent': ['error', 2, { baseIndent: 1 }],
      'vue/no-multiple-template-root': 'off',
      'quotes': ['error', 'single'],
      'semi': ['error', 'never'],
      'space-before-function-paren': ['error', 'always'],
      'no-console': ['warn', { allow: ['warn', 'error'] }]
    }
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        uni: true,
        getCurrentPages: true
      },
      parser: parserTs,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json'
      }
    },
    plugins: {
      '@typescript-eslint': pluginTs
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': 'error',
      'quotes': ['error', 'single'],
      'semi': ['error', 'never'],
      'space-before-function-paren': ['error', 'always'],
      'no-console': ['warn', { allow: ['warn', 'error'] }]
    }
  }
]
