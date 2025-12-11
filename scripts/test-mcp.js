#!/usr/bin/env node
/**
 * Quick test of the enhanced WCAG MCP server
 */

import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const transport = new StdioClientTransport({
  command: 'node',
  args: ['src/index.js'],
  cwd: process.cwd()
});

const client = new Client({
  name: 'wcag-test-client',
  version: '1.0.0'
}, {
  capabilities: {}
});

await client.connect(transport);

console.log('Connected to WCAG MCP server\n');

// Test get-criterion with 1.4.3
console.log('=== Testing get-criterion with 1.4.3 ===\n');
const result = await client.callTool({
  name: 'get-criterion',
  arguments: {
    ref_id: '1.4.3'
  }
});

console.log(result.content[0].text);

await client.close();
