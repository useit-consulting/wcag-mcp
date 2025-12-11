import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const wcagData = JSON.parse(readFileSync(join(__dirname, '..', 'data', 'wcag.json'), 'utf-8'));

// Check first success criterion
const sc = wcagData.principles[0].guidelines[0].successcriteria[0];
console.log('SC:', sc.num, sc.handle);
console.log('Has understanding:', !!sc.understanding);

if (sc.understanding) {
  console.log('\nUnderstanding keys:', Object.keys(sc.understanding));
  console.log('\nBrief:', JSON.stringify(sc.understanding.brief, null, 2));
  console.log('\nIntent (first 200 chars):', sc.understanding.intent?.substring(0, 200) + '...');
  console.log('\nBenefits count:', sc.understanding.benefits?.length || 0);
  console.log('\nExamples count:', sc.understanding.examples?.length || 0);
  console.log('\nResources count:', sc.understanding.resources?.length || 0);
}

// Check 1.4.3 specifically
console.log('\n\n=== Checking 1.4.3 Contrast (Minimum) ===');
for (const p of wcagData.principles) {
  for (const g of p.guidelines) {
    for (const criterion of g.successcriteria) {
      if (criterion.num === '1.4.3') {
        console.log('Found 1.4.3');
        console.log('Has understanding:', !!criterion.understanding);
        if (criterion.understanding) {
          console.log('Brief:', criterion.understanding.brief);
          console.log('Intent length:', criterion.understanding.intent?.length || 0);
          console.log('Benefits:', criterion.understanding.benefits?.length || 0);
          console.log('Resources:', criterion.understanding.resources?.length || 0);
        }
      }
    }
  }
}
