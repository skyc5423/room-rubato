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
        return new Response(health ? JSON.stringify({status:'ok',check:'liveness'}) : null, {
          status: url.endsWith('/api/users') ? 410 : 200,
          headers: {'x-content-type-options':'nosniff','x-frame-options':'DENY','cache-control':'no-store'},
        });
      });
      expect(requests).toContain('https://example.com/compare');
      expect(requests).toContain('https://example.com/compare/light-and-edges');
      expect(requests).toContain('https://example.com/compare/gaze-and-frame');
      expect(requests).toHaveLength(8);
    } finally { log.mockRestore(); }
  });
});
