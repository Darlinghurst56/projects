#!/usr/bin/env node

/**
 * Tailwind CSS Build Script for Dashboard
 * Builds optimized CSS for production and development
 */

import { spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Ensure dist directory exists
const distDir = path.join(__dirname, 'dist');
if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
}

/**
 * Build Tailwind CSS
 * @param {boolean} production - Whether to build for production
 */
function buildTailwind(production = false) {
    const args = [
        'tailwindcss',
        '--input', 'dashboard/styles/base.css',
        '--output', 'dashboard/dist/tailwind.css',
        '--config', 'dashboard/tailwind.config.js'
    ];

    if (production) {
        args.push('--minify');
    }

    console.log(`🏗️  Building Tailwind CSS${production ? ' (production)' : ' (development)'}...`);
    
    const process = spawn('npx', args, {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
    });

    process.on('close', (code) => {
        if (code === 0) {
            console.log(`✅ Tailwind CSS built successfully!`);
            console.log(`📁 Output: dashboard/dist/tailwind.css`);
        } else {
            console.error(`❌ Build failed with exit code ${code}`);
            process.exit(1);
        }
    });

    process.on('error', (err) => {
        console.error('❌ Build error:', err);
        process.exit(1);
    });
}

// Parse command line arguments
const args = process.argv.slice(2);
const production = args.includes('--production') || args.includes('-p');

buildTailwind(production);