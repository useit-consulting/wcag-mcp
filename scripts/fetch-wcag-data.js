#!/usr/bin/env node
/**
 * Fetches WCAG data from W3C and copies ACT rules from the submodule.
 * 
 * Usage:
 *   node scripts/fetch-wcag-data.js
 * 
 * This script:
 * 1. Fetches wcag.json from W3C's published WCAG 2.2 JSON
 * 2. Copies act-mapping.json from the w3c/wcag submodule
 */

import { writeFile, copyFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const SUBMODULE_DIR = join(DATA_DIR, 'wcag');

const WCAG_JSON_URL = 'https://www.w3.org/WAI/WCAG22/wcag.json';
const ACT_RULES_SOURCE = join(SUBMODULE_DIR, 'guidelines', 'act-mapping.json');

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

async function copyActRules() {
  console.log('\nCopying ACT rules from submodule...');
  
  if (!existsSync(ACT_RULES_SOURCE)) {
    console.error(`✗ ACT rules source not found: ${ACT_RULES_SOURCE}`);
    console.error('  Make sure the w3c/wcag submodule is initialized:');
    console.error('  git submodule update --init --recursive');
    process.exit(1);
  }
  
  const outputPath = join(DATA_DIR, 'act-rules.json');
  await copyFile(ACT_RULES_SOURCE, outputPath);
  
  // Read and report stats
  const actData = await import(outputPath, { with: { type: 'json' } });
  const rules = actData.default['act-rules'] || [];
  const activeRules = rules.filter(r => !r.deprecated);
  
  console.log(`✓ Saved act-rules.json`);
  console.log(`  → ${rules.length} total rules (${activeRules.length} active, ${rules.length - activeRules.length} deprecated)`);
}

async function main() {
  console.log('='.repeat(50));
  console.log('WCAG MCP Data Build');
  console.log('='.repeat(50));
  console.log();
  
  try {
    await fetchWcagJson();
    await copyActRules();
    
    console.log('\n' + '='.repeat(50));
    console.log('✓ Data build complete!');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('\n✗ Build failed:', error.message);
    process.exit(1);
  }
}

main();

