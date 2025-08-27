module.exports = {
  // Basic formatting
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  doubleQuote: false,
  
  // Indentation
  tabWidth: 2,
  useTabs: false,
  
  // Line length
  printWidth: 80,
  
  // Bracket spacing
  bracketSpacing: true,
  bracketSameLine: false,
  
  // Arrow functions
  arrowParens: 'avoid',
  
  // HTML/JSX specific
  htmlWhitespaceSensitivity: 'css',
  jsxSingleQuote: true,
  
  // Markdown
  proseWrap: 'preserve',
  
  // End of line
  endOfLine: 'lf',
  
  // File-specific overrides
  overrides: [
    {
      files: '*.json',
      options: {
        singleQuote: false,
        trailingComma: 'none'
      }
    },
    {
      files: '*.md',
      options: {
        proseWrap: 'always',
        printWidth: 100
      }
    },
    {
      files: '*.yml',
      options: {
        singleQuote: false,
        tabWidth: 2
      }
    },
    {
      files: 'dashboard/**/*.js',
      options: {
        printWidth: 100,
        tabWidth: 2
      }
    }
  ]
};