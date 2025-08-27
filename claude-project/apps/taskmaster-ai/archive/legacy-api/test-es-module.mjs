// Test ES Module functionality
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing ES Modules...');
console.log(`Current directory: ${__dirname}`);

// Test async/await with ES modules
const testAsyncImport = async () => {
    try {
        // Read package.json to verify we're in the right place
        const packageJson = await readFile(
            path.join(__dirname, 'package.json'), 
            'utf8'
        );
        const pkg = JSON.parse(packageJson);
        console.log(`✅ Successfully read package.json: ${pkg.name} v${pkg.version}`);
        
        // Test dynamic import
        const { default: chalk } = await import('chalk');
        console.log(chalk.green('✅ Dynamic import working!'));
        
        return true;
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
};

// Test export
export const testFunction = () => {
    return 'ES Module export working';
};

// Run test
testAsyncImport().then(success => {
    if (success) {
        console.log('✅ All ES Module tests passed!');
    } else {
        console.log('❌ ES Module tests failed');
        process.exit(1);
    }
});

export default { testFunction };