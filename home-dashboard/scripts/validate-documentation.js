#!/usr/bin/env node

/**
 * @fileoverview Documentation validation script for pre-commit hooks and CI/CD
 * @author Home Dashboard Team
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

/**
 * Configuration for documentation validation
 * @typedef {Object} ValidationConfig
 * @property {number} minDocumentationRatio - Minimum documentation coverage ratio
 * @property {string[]} requiredFiles - Files that must exist
 * @property {string[]} excludePatterns - File patterns to exclude from validation
 */
const config = {
  minDocumentationRatio: 0.75, // 75% documentation coverage required
  requiredFiles: ['README.md', 'CONTRIBUTING.md', '.env.example', 'package.json'],
  excludePatterns: ['node_modules', 'dist', 'build', 'coverage', 'test-results'],
  jsdocPatterns: {
    functionDeclaration: /function\s+\w+\s*\(/g,
    arrowFunction: /const\s+\w+\s*=\s*\([^)]*\)\s*=>/g,
    method: /\w+\s*\([^)]*\)\s*{/g,
    jsdocComment: /\/\*\*[\s\S]*?\*\//g
  }
};

/**
 * Validation results accumulator
 * @typedef {Object} ValidationResults
 * @property {boolean} passed - Overall validation status
 * @property {number} score - Documentation quality score (0-100)
 * @property {string[]} errors - Critical errors
 * @property {string[]} warnings - Non-critical warnings
 * @property {Object} details - Detailed validation information
 */
let results = {
  passed: true,
  score: 0,
  errors: [],
  warnings: [],
  details: {
    filesChecked: 0,
    functionsFound: 0,
    functionsDocumented: 0,
    requiredFilesPresent: 0,
    readmeQuality: 0
  }
};

/**
 * Main documentation validation function
 * @returns {Promise<ValidationResults>} Validation results
 * @example
 * const results = await validateDocumentation();
 * if (!results.passed) {
 *   console.error('Documentation validation failed');
 *   process.exit(1);
 * }
 */
async function validateDocumentation() {
  console.log('🔍 Starting documentation validation...\n');

  try {
    validateRequiredFiles();
    await validateCodeDocumentation();
    validateReadmeQuality();
    validateEnvironmentDocumentation();
    calculateFinalScore();
    
    displayResults();
    return results;
  } catch (error) {
    results.errors.push(`Validation failed: ${error.message}`);
    results.passed = false;
    return results;
  }
}

/**
 * Validates presence of required documentation files
 * @throws {Error} When critical files are missing
 */
function validateRequiredFiles() {
  console.log('📋 Checking required documentation files...');
  
  const missingFiles = [];
  
  config.requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      results.details.requiredFilesPresent++;
      console.log(`  ✅ ${file}`);
    } else {
      missingFiles.push(file);
      console.log(`  ❌ ${file}`);
    }
  });
  
  if (missingFiles.length > 0) {
    results.errors.push(`Missing required files: ${missingFiles.join(', ')}`);
    results.passed = false;
  }
  
  console.log(`  📊 ${results.details.requiredFilesPresent}/${config.requiredFiles.length} required files present\n`);
}

/**
 * Validates JSDoc documentation coverage in source code
 * @returns {Promise<void>}
 * @throws {Error} When file reading fails
 */
async function validateCodeDocumentation() {
  console.log('🎯 Analyzing JSDoc documentation coverage...');
  
  const sourceFiles = await findSourceFiles();
  
  for (const filePath of sourceFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      analyzeFileDocumentation(filePath, content);
      results.details.filesChecked++;
    } catch (error) {
      results.warnings.push(`Could not read file ${filePath}: ${error.message}`);
    }
  }
  
  const documentationRatio = results.details.functionsFound > 0 
    ? results.details.functionsDocumented / results.details.functionsFound 
    : 1;
  
  console.log(`  📊 Functions found: ${results.details.functionsFound}`);
  console.log(`  📊 Functions documented: ${results.details.functionsDocumented}`);
  console.log(`  📊 Documentation coverage: ${(documentationRatio * 100).toFixed(1)}%`);
  
  if (documentationRatio < config.minDocumentationRatio) {
    results.warnings.push(
      `Documentation coverage ${(documentationRatio * 100).toFixed(1)}% is below minimum ${(config.minDocumentationRatio * 100)}%`
    );
  }
  
  console.log('');
}

/**
 * Finds all source code files for documentation analysis
 * @returns {Promise<string[]>} Array of file paths
 */
async function findSourceFiles() {
  const files = [];
  const directories = ['src', 'server'];
  
  for (const dir of directories) {
    if (fs.existsSync(dir)) {
      const dirFiles = await walkDirectory(dir);
      files.push(...dirFiles.filter(file => 
        (file.endsWith('.js') || file.endsWith('.jsx')) &&
        !config.excludePatterns.some(pattern => file.includes(pattern))
      ));
    }
  }
  
  return files;
}

/**
 * Recursively walks directory to find files
 * @param {string} dir - Directory path
 * @returns {Promise<string[]>} Array of file paths
 */
async function walkDirectory(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !config.excludePatterns.some(pattern => item.includes(pattern))) {
      const subFiles = await walkDirectory(fullPath);
      files.push(...subFiles);
    } else if (stat.isFile()) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Analyzes documentation coverage for a single file
 * @param {string} filePath - Path to the file
 * @param {string} content - File content
 */
function analyzeFileDocumentation(filePath, content) {
  const functions = findFunctions(content);
  const jsdocComments = findJSDocComments(content);
  
  results.details.functionsFound += functions.length;
  
  // Simple heuristic: if there are JSDoc comments near function definitions
  const documentedFunctions = functions.filter(func => {
    return jsdocComments.some(comment => {
      const funcLine = content.substring(0, func.index).split('\n').length;
      const commentLine = content.substring(0, comment.index).split('\n').length;
      return Math.abs(funcLine - commentLine) <= 2; // JSDoc within 2 lines of function
    });
  });
  
  results.details.functionsDocumented += documentedFunctions.length;
  
  if (functions.length > 0 && documentedFunctions.length === 0) {
    results.warnings.push(`${filePath}: No documented functions found`);
  }
}

/**
 * Finds function definitions in code content
 * @param {string} content - File content
 * @returns {Array} Array of function matches
 */
function findFunctions(content) {
  const functions = [];
  
  // Find function declarations
  let match;
  while ((match = config.jsdocPatterns.functionDeclaration.exec(content)) !== null) {
    functions.push(match);
  }
  
  // Reset regex
  config.jsdocPatterns.functionDeclaration.lastIndex = 0;
  
  // Find arrow functions
  while ((match = config.jsdocPatterns.arrowFunction.exec(content)) !== null) {
    functions.push(match);
  }
  
  // Reset regex
  config.jsdocPatterns.arrowFunction.lastIndex = 0;
  
  return functions;
}

/**
 * Finds JSDoc comments in code content
 * @param {string} content - File content
 * @returns {Array} Array of JSDoc comment matches
 */
function findJSDocComments(content) {
  const comments = [];
  let match;
  
  while ((match = config.jsdocPatterns.jsdocComment.exec(content)) !== null) {
    comments.push(match);
  }
  
  // Reset regex
  config.jsdocPatterns.jsdocComment.lastIndex = 0;
  
  return comments;
}

/**
 * Validates README.md content quality
 */
function validateReadmeQuality() {
  console.log('📖 Validating README.md quality...');
  
  if (!fs.existsSync('README.md')) {
    results.errors.push('README.md is missing');
    return;
  }
  
  const content = fs.readFileSync('README.md', 'utf8');
  const lines = content.split('\n');
  
  let qualityScore = 0;
  const requiredSections = ['# ', '## Installation', '## Usage', '## Configuration'];
  const presentSections = [];
  
  requiredSections.forEach(section => {
    if (content.includes(section)) {
      presentSections.push(section);
      qualityScore += 25;
    } else {
      results.warnings.push(`README.md missing section: ${section}`);
    }
  });
  
  // Bonus points for comprehensive content
  if (lines.length > 50) qualityScore += 10;
  if (content.includes('```')) qualityScore += 10; // Code examples
  if (content.includes('http')) qualityScore += 5; // Links
  
  results.details.readmeQuality = Math.min(qualityScore, 100);
  
  console.log(`  📊 README sections: ${presentSections.length}/${requiredSections.length}`);
  console.log(`  📊 README quality score: ${results.details.readmeQuality}/100\n`);
}

/**
 * Validates environment configuration documentation
 */
function validateEnvironmentDocumentation() {
  console.log('🔧 Validating environment documentation...');
  
  if (!fs.existsSync('.env.example')) {
    results.warnings.push('.env.example is missing');
    return;
  }
  
  const content = fs.readFileSync('.env.example', 'utf8');
  const lines = content.split('\n');
  const commentLines = lines.filter(line => line.trim().startsWith('#')).length;
  const totalLines = lines.filter(line => line.trim().length > 0).length;
  
  const commentRatio = totalLines > 0 ? commentLines / totalLines : 0;
  
  console.log(`  📊 Comment coverage: ${(commentRatio * 100).toFixed(1)}%`);
  
  if (commentRatio < 0.3) {
    results.warnings.push('.env.example needs more documentation comments');
  }
  
  console.log('');
}

/**
 * Calculates final documentation quality score
 */
function calculateFinalScore() {
  const weights = {
    requiredFiles: 30,
    documentation: 40,
    readme: 20,
    environment: 10
  };
  
  let score = 0;
  
  // Required files score
  const filesScore = (results.details.requiredFilesPresent / config.requiredFiles.length) * weights.requiredFiles;
  score += filesScore;
  
  // Documentation coverage score
  const docRatio = results.details.functionsFound > 0 
    ? results.details.functionsDocumented / results.details.functionsFound 
    : 1;
  const docScore = docRatio * weights.documentation;
  score += docScore;
  
  // README quality score
  const readmeScore = (results.details.readmeQuality / 100) * weights.readme;
  score += readmeScore;
  
  // Environment documentation score (simplified)
  const envScore = fs.existsSync('.env.example') ? weights.environment : 0;
  score += envScore;
  
  results.score = Math.round(score);
}

/**
 * Displays validation results to console
 */
function displayResults() {
  console.log('🎯 =================================');
  console.log('🎯 DOCUMENTATION VALIDATION RESULTS');
  console.log('🎯 =================================\n');
  
  console.log(`📊 Overall Score: ${results.score}/100`);
  console.log(`📁 Files Checked: ${results.details.filesChecked}`);
  console.log(`🔍 Functions Found: ${results.details.functionsFound}`);
  console.log(`📝 Functions Documented: ${results.details.functionsDocumented}`);
  
  if (results.score >= 90) {
    console.log('🎉 Excellent documentation quality!');
  } else if (results.score >= 75) {
    console.log('👍 Good documentation quality');
  } else if (results.score >= 50) {
    console.log('⚠️  Documentation needs improvement');
  } else {
    console.log('❌ Poor documentation quality - significant work needed');
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    results.errors.forEach(error => console.log(`   ${error}`));
  }
  
  if (results.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    results.warnings.forEach(warning => console.log(`   ${warning}`));
  }
  
  console.log('\n📋 RECOMMENDATIONS:');
  if (results.score < 75) {
    console.log('   • Add JSDoc comments to undocumented functions');
    console.log('   • Improve README.md with missing sections');
    console.log('   • Ensure all required files are present');
  }
  if (results.warnings.some(w => w.includes('README'))) {
    console.log('   • Add missing README sections (Installation, Usage, Configuration)');
  }
  if (results.warnings.some(w => w.includes('.env.example'))) {
    console.log('   • Add more comments to .env.example explaining variables');
  }
  
  console.log('');
}

// Command line execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const threshold = args.includes('--threshold') 
    ? parseInt(args[args.indexOf('--threshold') + 1]) 
    : 75;
  
  validateDocumentation().then(results => {
    if (!results.passed || results.score < threshold) {
      console.log(`💥 Documentation validation failed (score: ${results.score}, threshold: ${threshold})`);
      process.exit(1);
    } else {
      console.log(`✅ Documentation validation passed (score: ${results.score})`);
      process.exit(0);
    }
  }).catch(error => {
    console.error('💥 Validation script error:', error);
    process.exit(1);
  });
}

module.exports = { validateDocumentation };