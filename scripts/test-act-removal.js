#!/usr/bin/env node
/**
 * Test the MCP server after ACT removal
 */

import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const transport = new StdioClientTransport({
  command: 'node',
  args: ['src/index.js'],
  cwd: process.cwd()
});

const client = new Client({
  name: 'test-client',
  version: '1.0.0'
}, {
  capabilities: {}
});

await client.connect(transport);

console.log('✓ Connected to WCAG MCP server\n');

// List available tools
console.log('=== Available Tools ===\n');
const tools = await client.listTools();
console.log(`Total tools: ${tools.tools.length}`);
tools.tools.forEach(tool => {
  console.log(`  - ${tool.name}`);
});

// Verify no ACT tools
const actTools = tools.tools.filter(t => t.name.includes('test-rule'));
if (actTools.length > 0) {
  console.error('\n❌ ERROR: ACT tools still present:', actTools.map(t => t.name));
  process.exit(1);
}
console.log('\n✓ No ACT tools found (expected)');

// Test get-server-info
console.log('\n=== Testing get-server-info ===\n');
const info = await client.callTool({
  name: 'get-server-info',
  arguments: {}
});
const infoText = info.content[0].text;
if (infoText.includes('ACT')) {
  console.error('❌ ERROR: Server info still mentions ACT');
  process.exit(1);
}
console.log('✓ Server info does not mention ACT');
console.log('\nServer Info:\n');
console.log(infoText.substring(0, 500) + '...\n');

// Test get-criterion with 1.4.3
console.log('=== Testing get-criterion with Understanding content ===\n');
const criterion = await client.callTool({
  name: 'get-criterion',
  arguments: { ref_id: '1.4.3' }
});
const criterionText = criterion.content[0].text;

// Check for Understanding content
const checks = [
  { label: 'Brief summary', pattern: /## In Brief/ },
  { label: 'Intent section', pattern: /## Intent/ },
  { label: 'Benefits section', pattern: /## Benefits/ },
  { label: 'Resources section', pattern: /## Resources/ }
];

let allPassed = true;
checks.forEach(({ label, pattern }) => {
  if (pattern.test(criterionText)) {
    console.log(`✓ Has ${label}`);
  } else {
    console.error(`❌ Missing ${label}`);
    allPassed = false;
  }
});

if (!allPassed) {
  process.exit(1);
}

console.log('\n=== All Tests Passed! ===\n');
console.log('✅ ACT content successfully removed');
console.log('✅ Understanding documentation intact');
console.log('✅ Server functioning correctly');
console.log(`✅ ${tools.tools.length} tools available\n`);

await client.close();
