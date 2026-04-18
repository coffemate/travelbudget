const crypto = require('crypto');

const CACHE_TTL_MS = 5 * 60 * 1000;
const jwksCache = new Map();

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function parseJwt(token) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }
  const header = JSON.parse(base64UrlDecode(parts[0]));
  const payload = JSON.parse(base64UrlDecode(parts[1]));
  return { header, payload, signingInput: `${parts[0]}.${parts[1]}`, signature: parts[2] };
}

function getJwksUrl(payload) {
  const issuer = payload.iss;
  if (!issuer || typeof issuer !== 'string') {
    throw new Error('Missing token issuer');
  }
  return `${issuer.replace(/\/$/, '')}/.well-known/jwks.json`;
}

async function fetchJwks(jwksUrl) {
  const cached = jwksCache.get(jwksUrl);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.keys;
  }

  const response = await fetch(jwksUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch JWKS: ${response.status}`);
  }

  const data = await response.json();
  const keys = Array.isArray(data.keys) ? data.keys : [];
  jwksCache.set(jwksUrl, { keys, at: Date.now() });
  return keys;
}

function verifySignature(parsed, jwk) {
  const keyObject = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(parsed.signingInput);
  verifier.end();

  const signature = Buffer.from(parsed.signature.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  return verifier.verify(keyObject, signature);
}

async function verifyClerkJwt(token) {
  const parsed = parseJwt(token);
  if (parsed.header.alg !== 'RS256') {
    throw new Error('Unsupported JWT algorithm');
  }

  const now = Math.floor(Date.now() / 1000);
  if (parsed.payload.exp && Number(parsed.payload.exp) < now) {
    throw new Error('Token expired');
  }

  const jwksUrl = getJwksUrl(parsed.payload);
  const keys = await fetchJwks(jwksUrl);
  const jwk = keys.find((k) => k.kid === parsed.header.kid);
  if (!jwk) {
    throw new Error('Signing key not found');
  }

  const valid = verifySignature(parsed, jwk);
  if (!valid) {
    throw new Error('Invalid token signature');
  }

  return parsed.payload;
}

module.exports = {
  verifyClerkJwt,
};
