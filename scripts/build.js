#!/usr/bin/env node
/**
 * Unified build script for WCAG MCP
 * 
 * This script:
 * 1. Updates the WCAG git submodule to latest
 * 2. Fetches wcag.json from W3C
 * 3. Parses Understanding documentation from submodule
 * 
 * Usage:
 *   npm run build
 */

import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

function run(command, description) {
  console.log(`\n${description}...`);
  try {
    execSync(command, { cwd: rootDir, stdio: 'inherit' });
    console.log(`✓ ${description} complete`);
  } catch (error) {
    console.error(`✗ ${description} failed`);
    throw error;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('WCAG MCP Build Process');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Ensure WCAG submodule is initialized and populated.
    // When cloning without --recursive, data/wcag can exist but be empty, so we
    // always run --init first; then update to latest with --remote.
    run(
      'git submodule update --init --recursive',
      'Initializing WCAG submodule'
    );
    run(
      'git submodule update --remote data/wcag',
      'Updating WCAG submodule to latest'
    );
    
    // Step 2: Fetch WCAG JSON from W3C
    run(
      'node scripts/fetch-wcag-data.js',
      'Fetching WCAG 2.2 JSON from W3C'
    );
    
    // Step 3: Parse Understanding documentation
    run(
      'node scripts/parse-understanding-docs.js',
      'Parsing Understanding documentation'
    );
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Build complete! WCAG MCP is ready to use.');
    console.log('='.repeat(60));
    console.log('\nTo start the server: npm start');
    console.log();
    
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ Build failed');
    console.error('='.repeat(60));
    console.error('\nError:', error.message);
    process.exit(1);
  }
}

main();
