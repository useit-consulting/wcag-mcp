import crypto from 'node:crypto';

/**
 * Netlify MCP HTTP access:
 * - Claude.ai: set MCP_PATH_SECRET and use https://<site>/mcp/<MCP_PATH_SECRET> as the MCP URL.
 * - Bridge / API clients: BRIDGE_API_KEY or GATEWAY_API_KEY via Authorization Bearer or x-api-key.
 * If both env vars are set, either a matching path secret or a valid API key is accepted.
 * If neither is set, all access is denied (fail closed). Rotate MCP_PATH_SECRET by changing the value
 * and the public URL; avoid logging full request paths in application code.
 */

function getApiKeyEnv() {
  return process.env.BRIDGE_API_KEY || process.env.GATEWAY_API_KEY || '';
}

/**
 * Path segment after /mcp/ or /.netlify/functions/api/ (Netlify redirect :splat).
 */
export function getProvidedPathSecret(event) {
  const splat = event.pathParameters?.splat;
  if (typeof splat === 'string' && splat.length > 0) {
    const segment = splat.split('/')[0];
    if (segment && !segment.includes('..')) return segment.trim();
  }
  const path = event.path || event.rawPath || '';
  const m = path.match(/\/(?:mcp|\.netlify\/functions\/api)\/([^/?#]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}

function timingSafeEqualString(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function validateBearer(event, expected) {
  if (!expected) return false;
  const auth = event.headers?.authorization || event.headers?.Authorization;
  const bearer =
    typeof auth === 'string' && auth.startsWith('Bearer ')
      ? auth.slice(7).trim()
      : '';
  const apiKey =
    event.headers?.['x-api-key'] || event.headers?.['X-Api-Key'] || '';
  const provided = bearer || apiKey;
  if (!provided) return false;
  return timingSafeEqualString(provided, expected);
}

export function validateMcpAccess(event) {
  const pathSecret = process.env.MCP_PATH_SECRET || '';
  const apiKey = getApiKeyEnv();

  if (!pathSecret && !apiKey) return false;

  const pathOk = pathSecret
    ? timingSafeEqualString(getProvidedPathSecret(event), pathSecret)
    : false;
  const bearerOk = apiKey ? validateBearer(event, apiKey) : false;

  if (pathSecret && apiKey) return pathOk || bearerOk;
  if (pathSecret) return pathOk;
  return bearerOk;
}
