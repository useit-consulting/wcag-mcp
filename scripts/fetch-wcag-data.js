#!/usr/bin/env node
/**
 * Fetches WCAG data from W3C.
 * 
 * Usage:
 *   node scripts/fetch-wcag-data.js
 * 
 * This script fetches wcag.json from W3C's published WCAG 2.2 JSON
 */

import { writeFile, mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

const WCAG_JSON_URL = 'https://www.w3.org/WAI/WCAG22/wcag.json';

async function fetchWcagJson() {
  console.log('Fetching WCAG 2.2 JSON from W3C...');
  
  const response = await fetch(WCAG_JSON_URL);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch WCAG JSON: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.text();
  const outputPath = join(DATA_DIR, 'wcag.json');
  
  await writeFile(outputPath, data, 'utf8');
  console.log(`✓ Saved wcag.json (${(data.length / 1024).toFixed(1)} KB)`);
  
  // Parse and report stats
  const wcag = JSON.parse(data);
  const scCount = wcag.principles.reduce((sum, p) => 
    sum + p.guidelines.reduce((gSum, g) => gSum + g.successcriteria.length, 0), 0);
  const termCount = wcag.terms?.length || 0;
  
  console.log(`  → ${wcag.principles.length} principles`);
  console.log(`  → ${wcag.principles.reduce((sum, p) => sum + p.guidelines.length, 0)} guidelines`);
  console.log(`  → ${scCount} success criteria`);
  console.log(`  → ${termCount} glossary terms`);
}

async function main() {
  console.log('='.repeat(50));
  console.log('WCAG MCP Data Build');
  console.log('='.repeat(50));
  console.log();
  
  try {
    await fetchWcagJson();
    
    console.log('\n' + '='.repeat(50));
    console.log('✓ Data build complete!');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('\n✗ Build failed:', error.message);
    process.exit(1);
  }
}

main();

