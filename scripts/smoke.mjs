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
  const checks = [['/', 200], ['/notes', 200], ['/daily', 200], ['/compare', 200], ['/compare/light-and-edges', 200], ['/compare/gaze-and-frame', 200], ['/privacy', 200], ['/account/withdrawal', 200], ['/api/health', 200], ['/api/users', 410]];
  for (const [path, expected] of checks) {
    const response = await fetcher(`${origin}${path}`, { redirect: 'manual', credentials: 'omit', signal: AbortSignal.timeout(15000), headers: { Accept: path.startsWith('/api/') ? 'application/json' : 'text/html' } });
    if (response.status !== expected) throw new Error(`${path}: expected ${expected}, got ${response.status}`);
    if (response.headers.get('x-content-type-options') !== 'nosniff') throw new Error(`${path}: nosniff header missing`);
    if (response.headers.get('x-frame-options') !== 'DENY') throw new Error(`${path}: frame protection missing`);
    if (path === '/api/health') {
      const result = await response.json();
      if (result.status !== 'ok' || result.check !== 'liveness') throw new Error('Unexpected liveness response');
      if (!response.headers.get('cache-control')?.includes('no-store')) throw new Error('Liveness must not be cached');
    } else {
      await response.body?.cancel();
    }
    console.log(`PASS ${path} (${expected})`);
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { await smoke(validateTarget(process.argv[2] || 'http://127.0.0.1:3000')); }
  catch (error) { console.error(error instanceof Error ? error.message : 'Smoke check failed'); process.exitCode = 1; }
}
