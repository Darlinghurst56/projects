module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    'security',
    'promise',
  ],
  rules: {
    // Security rules
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'warn',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-non-literal-require': 'warn',
    'security/detect-possible-timing-attacks': 'warn',
    'security/detect-pseudoRandomBytes': 'error',
    
    // Code quality rules
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-template': 'error',
    'template-curly-spacing': 'error',
    'object-shorthand': 'error',
    'prefer-arrow-callback': 'error',
    'arrow-spacing': 'error',
    'no-duplicate-imports': 'error',
    'no-useless-rename': 'error',
    
    // Promise rules
    'promise/always-return': 'error',
    'promise/no-return-wrap': 'error',
    'promise/param-names': 'error',
    'promise/catch-or-return': 'error',
    'promise/no-native': 'off',
    'promise/no-nesting': 'warn',
    'promise/no-promise-in-callback': 'warn',
    'promise/no-callback-in-promise': 'warn',
    'promise/avoid-new': 'warn',
    'promise/no-return-in-finally': 'warn',
    
    // Node.js specific rules
    'no-path-concat': 'error',
    'no-process-exit': 'error',
    'no-sync': 'warn',
    
    // Best practices
    'curly': 'error',
    'dot-notation': 'error',
    'eqeqeq': 'error',
    'no-caller': 'error',
    'no-else-return': 'error',
    'no-eval': 'error',
    'no-extend-native': 'error',
    'no-extra-bind': 'error',
    'no-implied-eval': 'error',
    'no-iterator': 'error',
    'no-lone-blocks': 'error',
    'no-loop-func': 'error',
    'no-multi-spaces': 'error',
    'no-new': 'error',
    'no-new-func': 'error',
    'no-new-wrappers': 'error',
    'no-octal-escape': 'error',
    'no-proto': 'error',
    'no-return-assign': 'error',
    'no-script-url': 'error',
    'no-self-compare': 'error',
    'no-sequences': 'error',
    'no-throw-literal': 'error',
    'no-unmodified-loop-condition': 'error',
    'no-unused-expressions': 'error',
    'no-useless-call': 'error',
    'no-useless-concat': 'error',
    'no-void': 'error',
    'no-warning-comments': 'warn',
    'no-with': 'error',
    'radix': 'error',
    'wrap-iife': ['error', 'inside'],
    'yoda': 'error',
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/*.spec.js', '**/tests/**/*.js'],
      env: {
        jest: true,
        mocha: true,
      },
      rules: {
        'no-unused-expressions': 'off',
        'security/detect-non-literal-fs-filename': 'off',
      },
    },
    {
      files: ['dashboard/**/*.js'],
      env: {
        browser: true,
        es2021: true,
      },
      rules: {
        'no-console': 'off', // Allow console in dashboard for debugging
      },
    },
    {
      files: ['scripts/**/*.js'],
      env: {
        node: true,
      },
      rules: {
        'no-console': 'off', // Allow console in scripts
        'security/detect-child-process': 'off', // Scripts may need child_process
      },
    },
  ],
};