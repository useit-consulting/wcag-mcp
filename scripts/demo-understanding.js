#!/usr/bin/env node
/**
 * Demonstrate the enhanced Understanding content
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const wcagData = JSON.parse(readFileSync(join(__dirname, '..', 'data', 'wcag.json'), 'utf-8'));

console.log('=== WCAG MCP Server Enhancement Demonstration ===\n');

// Find 2.4.7 Focus Visible
let sc247 = null;
for (const p of wcagData.principles) {
  for (const g of p.guidelines) {
    for (const sc of g.successcriteria) {
      if (sc.num === '2.4.7') {
        sc247 = sc;
        break;
      }
    }
  }
}

if (sc247) {
  console.log(`Success Criterion: ${sc247.num} ${sc247.handle}`);
  console.log(`Level: ${sc247.level}`);
  console.log('\n--- Understanding Content Available ---\n');
  
  if (sc247.understanding?.brief) {
    console.log('✓ Brief Summary');
    console.log(`  Goal: ${sc247.understanding.brief.goal}`);
    console.log(`  What to do: ${sc247.understanding.brief['what to do']}`);
    console.log(`  Why it's important: ${sc247.understanding.brief["why it's important"]}`);
  }
  
  if (sc247.understanding?.intent) {
    console.log('\n✓ Intent');
    console.log(`  ${sc247.understanding.intent.substring(0, 150)}...`);
    console.log(`  (${sc247.understanding.intent.length} characters total)`);
  }
  
  if (sc247.understanding?.benefits) {
    console.log('\n✓ Benefits');
    console.log(`  ${sc247.understanding.benefits.length} benefit(s) listed`);
    console.log(`  First: ${sc247.understanding.benefits[0].substring(0, 100)}...`);
  }
  
  if (sc247.understanding?.examples) {
    console.log('\n✓ Examples');
    console.log(`  ${sc247.understanding.examples.length} example(s) provided`);
  }
  
  if (sc247.understanding?.resources) {
    console.log('\n✓ Resources');
    console.log(`  ${sc247.understanding.resources.length} resource(s) linked`);
    console.log(`  Sample: ${sc247.understanding.resources[0].title}`);
  }
}

console.log('\n\n=== Summary ===\n');
let totalWithUnderstanding = 0;
let totalBrief = 0;
let totalIntent = 0;
let totalBenefits = 0;
let totalExamples = 0;
let totalResources = 0;

for (const p of wcagData.principles) {
  for (const g of p.guidelines) {
    for (const sc of g.successcriteria) {
      if (sc.understanding) {
        totalWithUnderstanding++;
        if (sc.understanding.brief) totalBrief++;
        if (sc.understanding.intent) totalIntent++;
        if (sc.understanding.benefits) totalBenefits++;
        if (sc.understanding.examples) totalExamples++;
        if (sc.understanding.resources) totalResources++;
      }
    }
  }
}

console.log(`Success Criteria with Understanding content: ${totalWithUnderstanding} / 87`);
console.log(`  - Brief summaries: ${totalBrief}`);
console.log(`  - Intent sections: ${totalIntent}`);
console.log(`  - Benefits: ${totalBenefits}`);
console.log(`  - Examples: ${totalExamples}`);
console.log(`  - Resources: ${totalResources}`);
console.log('\n✅ Full Understanding documentation is now integrated into the MCP server!');
