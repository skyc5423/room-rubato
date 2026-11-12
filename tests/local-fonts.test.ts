import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
const css = readFileSync('src/app/globals.css', 'utf8');
const manifest = JSON.parse(readFileSync('public/fonts/manifest.json', 'utf8')) as {
  assets: {path: string; source: string; bytes: number; sha256: string}[];
};
describe('same-origin licensed fonts', () => {
  it('has no remote stylesheet or font requests in global CSS', () => {
    expect(css).not.toMatch(/@import\s/);
    for (const [, url] of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
      expect(url).toMatch(/^\/fonts\//);
      expect(existsSync(`public${url}`)).toBe(true);
    }
    for (const family of ['Wanted Sans Variable', 'MaruBuriSemiBold', 'MaruBuri', 'Cormorant Garamond']) {
      expect(css).toContain(family);
    }
  });
  it('retains original binary hashes and valid WOFF2 headers for every asset', () => {
    expect(manifest.assets.length).toBeGreaterThan(100);
    for (const asset of manifest.assets) {
      const data = readFileSync(asset.path);
      expect(data.subarray(0, 4).toString()).toBe('wOF2');
      expect(data.length).toBe(asset.bytes);
      expect(createHash('sha256').update(data).digest('hex')).toBe(asset.sha256);
    }
    expect(manifest.assets.reduce((total, asset) => total + asset.bytes, 0)).toBeLessThan(5_000_000);
  });
  it('includes publisher copyright and redistribution licenses for each family', () => {
    for (const file of ['wanted-sans/OFL.txt', 'cormorant-garamond/OFL.txt', 'maruburi/LICENSE.txt']) {
      const license = readFileSync(`public/fonts/${file}`, 'utf8');
      expect(license).toContain('Copyright');
      expect(license).toContain('Version 1.1');
      expect(license).toContain('redistributed');
    }
    expect(readFileSync('public/fonts/maruburi/LICENSE.txt', 'utf8')).toContain('MaruBuri');
  });
  it('retains Wanted variable range, Google weight/style coverage and swap rendering', () => {
    expect(css).toContain('font-weight: 400 1000');
    expect(css).toContain('unicode-range:');
    for (const style of ['normal', 'italic']) for (const weight of (style === 'normal' ? [500,600,700] : [500,600])) {
      expect(css).toMatch(new RegExp(`font-family: 'Cormorant Garamond';\\s+font-style: ${style};\\s+font-weight: ${weight};`));
    }
    const faces = css.match(/@font-face\s*\{[^}]+\}/g)!;
    for (const face of faces) expect(face).toContain('font-display: swap');
  });
});
