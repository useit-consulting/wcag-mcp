import { tools } from '../../src/tools.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, x-api-key',
};

/**
 * Build OpenAPI 3.1 spec from tools. Paths: POST /bridge/tools/{toolName}.
 * ChatGPT Custom GPT only supports OpenAPI 3.1.x, a single security scheme, and components.schemas.
 * @param {string} baseUrl - e.g. https://site.netlify.app
 */
function buildOpenApiSpec(baseUrl) {
  const paths = {};
  for (const tool of tools) {
    const pathKey = `/bridge/tools/${tool.name}`;
    paths[pathKey] = {
      post: {
        operationId: tool.name.replace(/-/g, '_'),
        summary: tool.name,
        description: tool.description,
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: tool.inputSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Tool result (MCP text content)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { content: { type: 'string', description: 'Tool output text' } },
                  required: ['content'],
                },
              },
            },
          },
          '400': { description: 'Invalid request body or parameters' },
          '401': { description: 'Missing or invalid API key' },
          '502': { description: 'Upstream MCP error' },
        },
      },
    };
  }

  return {
    openapi: '3.1.0',
    info: {
      title: 'WCAG MCP API',
      description: 'REST bridge for WCAG MCP tools. Query WCAG 2.2 guidelines, success criteria, techniques, glossary terms, and Understanding documentation.',
      version: '2.0.0',
    },
    servers: [{ url: baseUrl }],
    paths,
    components: {
      schemas: {},
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'API Key',
          description: 'Set BRIDGE_API_KEY in Netlify; use as Bearer token in Custom GPT.',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  };
}

/**
 * Validate API key from Authorization Bearer or x-api-key. If BRIDGE_API_KEY is set, key is required.
 */
function validateAuth(event) {
  const expected = process.env.BRIDGE_API_KEY;
  if (!expected) return true;
  const auth = event.headers?.authorization || event.headers?.Authorization;
  const bearer = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const apiKey = event.headers?.['x-api-key'] || event.headers?.['X-Api-Key'] || '';
  const provided = bearer || apiKey;
  return provided && provided === expected;
}

/**
 * Call the MCP backend (same site) with tools/call, return parsed result or throw.
 */
async function callMcpBackend(toolName, args, event) {
  const host = event.headers?.host || event.headers?.Host;
  const url = process.env.URL || process.env.NETLIFY_URL || `https://${host}`;
  const base = url.replace(/\/$/, '');
  const mcpUrl = `${base}/.netlify/functions/api`;

  const res = await fetch(mcpUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { name: toolName, arguments: args || {} },
      id: 1,
    }),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`MCP backend returned non-JSON: ${res.status}`);
  }

  if (!res.ok) {
    const msg = data?.error?.message || data?.message || res.statusText;
    const err = new Error(msg);
    err.status = res.status >= 400 && res.status < 500 ? 400 : 502;
    throw err;
  }

  if (data.error) {
    const err = new Error(data.error.message || 'MCP error');
    err.status = 400;
    throw err;
  }

  const content = data.result?.content;
  if (!Array.isArray(content) || content.length === 0) {
    return { content: '' };
  }
  const textPart = content.find((c) => c.type === 'text');
  return { content: textPart?.text ?? '' };
}

/**
 * Netlify function handler. Route by path:
 * - GET .../openapi.json -> OpenAPI spec
 * - POST .../tools/:toolName -> call MCP, return { content }
 */
export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  // Path: either event.path (e.g. /bridge/openapi.json) or from :splat
  const path = event.path || '';
  const splat = event.pathParameters?.splat || '';
  const pathSegment = splat || path.replace(/^.*\/bridge\/?/, '').replace(/^\//, '');

  // GET openapi.json
  if (event.httpMethod === 'GET' && (pathSegment === 'openapi.json' || path.endsWith('openapi.json'))) {
    const host = event.headers?.host || event.headers?.Host;
    const protocol = event.headers?.['x-forwarded-proto'] === 'https' ? 'https' : 'https';
    const baseUrl = `${protocol}://${host}`;
    const spec = buildOpenApiSpec(baseUrl);
    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify(spec),
    };
  }

  // POST /bridge/tools/:toolName
  if (event.httpMethod === 'POST' && pathSegment.startsWith('tools/')) {
    const toolName = pathSegment.replace(/^tools\/?/, '').trim();
    if (!toolName) {
      return {
        statusCode: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Tool name missing' }),
      };
    }

    const known = tools.find((t) => t.name === toolName);
    if (!known) {
      return {
        statusCode: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `Unknown tool: ${toolName}` }),
      };
    }

    if (!validateAuth(event)) {
      return {
        statusCode: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing or invalid API key' }),
      };
    }

    let args = {};
    if (event.body) {
      try {
        args = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      } catch {
        return {
          statusCode: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Invalid JSON body' }),
        };
      }
    }

    try {
      const result = await callMcpBackend(toolName, args, event);
      return {
        statusCode: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      };
    } catch (err) {
      const status = err.status || 502;
      return {
        statusCode: status,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: err.message || 'Upstream error' }),
      };
    }
  }

  return {
    statusCode: 404,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Not found' }),
  };
};
