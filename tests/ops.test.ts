import { describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/health/route';
import config from '../next.config.mjs';
import { validateTarget, smoke } from '../scripts/smoke.mjs';
describe('operational surface', () => {
  it('liveness has no user or config detail and is uncached', async () => {
    const response = GET();
    expect(await response.json()).toEqual({ status: 'ok', service: 'room-rubato', check: 'liveness' });
    expect(response.headers.get('cache-control')).toContain('no-store');
  });
  it('sets non-invasive security headers without disabling OAuth popup communication', async () => {
    const rules = await config.headers!();
    const headers = Object.fromEntries(rules[0].headers.map((h: {key:string;value:string}) => [h.key, h.value]));
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['Cross-Origin-Opener-Policy']).toBeUndefined();
    expect(config.poweredByHeader).toBe(false);
  });
  it('rejects accidental secret-bearing targets', () => {
    expect(() => validateTarget('https://example.com/?token=secret')).toThrow();
    expect(() => validateTarget('https://user:pass@example.com')).toThrow();
    expect(() => validateTarget('http://example.com')).toThrow();
    expect(validateTarget('http://127.0.0.1:3000')).toBe('http://127.0.0.1:3000');
  });
  it('fails on redirect instead of mistaking a login screen for health', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await expect(smoke('https://example.com', async () => new Response(null, { status: 302 }))).rejects.toThrow('got 302');
    vi.restoreAllMocks();
  });
  it('checks both comparison journeys without credentials or response-body logging', async () => {
    const requests: string[] = [];
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      await smoke('https://example.com', async (input, options) => {
        const url=String(input);
        requests.push(url);
        expect(options?.credentials).toBe('omit');
        const health = url.endsWith('/api/health');
        return new Response(health ? JSON.stringify({status:'ok',check:'liveness',service:'room-rubato'}) : url.endsWith('/api/users') ? JSON.stringify({error:'Legacy authentication is disabled. Use Supabase Auth.'}) : '<html><head><title>관찰실 · 취향 노트 | Room Rubato</title></head><body>fixture</body></html>', {
          status: url.endsWith('/api/users') ? 410 : 200,
          headers: {'content-type':url.includes('/api/')?'application/json':'text/html; charset=utf-8','x-content-type-options':'nosniff','x-frame-options':'DENY','cache-control':'no-store'},
        });
      });
      expect(requests).toContain('https://example.com/compare');
      expect(requests).toContain('https://example.com/compare/light-and-edges');
      expect(requests).toContain('https://example.com/compare/gaze-and-frame');
      expect(requests).toContain('https://example.com/privacy');
      expect(requests).toContain('https://example.com/account/withdrawal');
      expect(requests).toContain('https://example.com/observe/flavor');
      expect(requests).toContain('https://example.com/explore');
      expect(requests).toContain('https://example.com/observe/fibre-weave');
      expect(requests).toHaveLength(13);
    } finally { log.mockRestore(); }
  });
});

const validHeaders = {'content-type':'text/html', 'x-content-type-options':'nosniff','x-frame-options':'DENY'};
describe('smoke response identity', () => {
  it.each(['', '<html><title>Maintenance</title><body>private unexpected content</body></html>'])('rejects empty or unrelated HTTP 200 documents', async body => {
    await expect(smoke('https://example.com', async () => new Response(body,{headers:validHeaders}))).rejects.toThrow('expected Room Rubato document missing');
  });
  it('rejects JSON posing as an HTML route', async () => {
    await expect(smoke('https://example.com', async () => new Response('{}',{headers:{...validHeaders,'content-type':'application/json'}}))).rejects.toThrow('content type');
  });
  it('bounds response body consumption', async () => {
    await expect(smoke('https://example.com', async () => new Response('x'.repeat(2*1024*1024+1),{headers:validHeaders}))).rejects.toThrow('exceeded smoke-check limit');
  });
  it('validates programmatic targets before making requests', async () => {
    const fetcher=vi.fn();
    await expect(smoke('https://example.com/?token=secret',fetcher)).rejects.toThrow('bare origin');
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each([
    ['{"status":"ok","check":"liveness","service":"other"}', 'no-store', 'Unexpected liveness'],
    ['not json with private content', 'no-store', 'invalid JSON'],
    ['null', 'no-store', 'Unexpected liveness'],
    ['{"status":"ok","check":"liveness","service":"room-rubato"}', 'x-no-store', 'must not be cached'],
  ])('rejects wrong or malformed liveness and non-token cache directives', async (body, cache, error) => {
    const log=vi.spyOn(console,'log').mockImplementation(()=>{});
    try {
      await expect(smoke('https://example.com', async input => String(input).endsWith('/api/health')
        ? new Response(body,{headers:{...validHeaders,'content-type':'application/json','cache-control':cache}})
        : new Response('<html><title>Room Rubato — fixture</title><body>fixture</body></html>',{headers:validHeaders}))).rejects.toThrow(error);
      expect(JSON.stringify(log.mock.calls)).not.toContain('private content');
    } finally {log.mockRestore();}
  });
});
