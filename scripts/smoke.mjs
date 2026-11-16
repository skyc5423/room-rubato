// Read-only public checks. Never sends cookies, auth headers, or logs response bodies.
import { pathToFileURL } from 'node:url';
export function validateTarget(input) {
  const url = new URL(input);
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Use a bare origin without credentials or query parameters.');
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) throw new Error('HTTPS required except for loopback.');
  return url.origin;
}
export async function smoke(origin, fetcher = fetch) {
  origin = validateTarget(origin);
  const checks = [['/', 200], ['/notes', 200], ['/explore', 200], ['/daily', 200], ['/compare', 200], ['/observe/flavor', 200], ['/compare/light-and-edges', 200], ['/compare/gaze-and-frame', 200], ['/privacy', 200], ['/account/withdrawal', 200], ['/api/health', 200], ['/api/users', 410]];
  for (const [path, expected] of checks) {
    const response = await fetcher(`${origin}${path}`, { redirect: 'manual', credentials: 'omit', signal: AbortSignal.timeout(15000), headers: { Accept: path.startsWith('/api/') ? 'application/json' : 'text/html' } });
    if (response.status !== expected) throw new Error(`${path}: expected ${expected}, got ${response.status}`);
    if (response.headers.get('x-content-type-options') !== 'nosniff') throw new Error(`${path}: nosniff header missing`);
    if (response.headers.get('x-frame-options') !== 'DENY') throw new Error(`${path}: frame protection missing`);
    const mediaType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
    const isApi = path.startsWith('/api/');
    if (mediaType !== (isApi ? 'application/json' : 'text/html')) {
      await response.body?.cancel();
      throw new Error(`${path}: unexpected response content type`);
    }
    // Bound memory use and never print page contents, even on an unexpected response.
    const reader = response.body?.getReader();
    const chunks = []; let size = 0;
    if (reader) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > 2 * 1024 * 1024) throw new Error(`${path}: response exceeded smoke-check limit`);
          chunks.push(value);
        }
      } finally { await reader.cancel(); reader.releaseLock(); }
    }
    const body = Buffer.concat(chunks).toString('utf8');
    if (isApi) {
      let result;
      try { result = JSON.parse(body); }
      catch { throw new Error(`${path}: invalid JSON response`); }
      if (path === '/api/health') {
        if (result?.status !== 'ok' || result?.check !== 'liveness' || result?.service !== 'room-rubato') throw new Error('Unexpected liveness response');
        if (!response.headers.get('cache-control')?.split(',').some(value => value.trim().toLowerCase() === 'no-store')) throw new Error('Liveness must not be cached');
      } else if (result?.error !== 'Legacy authentication is disabled. Use Supabase Auth.') {
        throw new Error('Unexpected legacy authentication response');
      }
    } else if (!/<html(?:\s|>)/i.test(body) || !/<title>[^<]*\bRoom Rubato(?:\s|—|&|<)/i.test(body) || !/<body(?:\s|>)/i.test(body)) {
      throw new Error(`${path}: expected Room Rubato document missing`);
    }
    console.log(`PASS ${path} (${expected})`);
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { await smoke(validateTarget(process.argv[2] || 'http://127.0.0.1:3000')); }
  catch (error) { console.error(error instanceof Error ? error.message : 'Smoke check failed'); process.exitCode = 1; }
}
