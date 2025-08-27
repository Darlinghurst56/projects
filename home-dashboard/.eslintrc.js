module.exports = {
  root: true,
  env: { 
    browser: true, 
    es2020: true, 
    node: true 
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended'
  ],
  ignorePatterns: ['dist', '.eslintrc.js', 'node_modules'],
  parserOptions: { 
    ecmaVersion: 'latest', 
    sourceType: 'module' 
  },
  settings: { 
    react: { version: '18.2' } 
  },
  plugins: ['react-refresh'],
  rules: {
    // Documentation enforcement rules
    'require-jsdoc': ['warn', {
      require: {
        FunctionDeclaration: true,
        MethodDefinition: true,
        ClassDeclaration: true,
        ArrowFunctionExpression: false,
        FunctionExpression: false
      }
    }],
    
    // Code quality rules
    'react/prop-types': 'warn',
    'no-unused-vars': 'warn', 
    'react/no-unescaped-entities': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    'react-refresh/only-export-components': 'warn',
    
    // Keep these for basic functionality
    'no-undef': 'error',
    'react-hooks/rules-of-hooks': 'error',
    
    // Documentation quality
    'no-console': 'warn',
    'prefer-const': 'warn',
    'no-var': 'error'
  },
};