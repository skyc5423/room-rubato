import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import config from '../tailwind.config';
import { contrast, hex, over, utilityColor, type RGB } from './helpers/contrast';

const source = (path: string) => readFileSync(path, 'utf8');
const white = hex('#FFFFFF'), cream = hex('#FEF1D0'), sheet = hex('#FFF9EB'), paper = hex('#FFFDF7');
const navy = hex('#010D6E'), blue = hex('#0042AF');
const notebook = source('src/components/TasteNotebook.tsx');
const navbar = source('src/components/Navbar.tsx');
const home = source('src/app/page.tsx');
const domain = source('src/app/domain/[slug]/page.tsx');
const layout = source('src/app/layout.tsx');
const orange = hex((config.theme?.extend?.colors as Record<string, string>)['terracotta-ink']);
const inputClass = (text: string, id: string) => text.match(new RegExp(`<input\\s+id="${id}"[\\s\\S]*?className="([^"]+)"`))![1];
const memoClass = notebook.match(/<textarea id="observation-memo"[\s\S]*?className="([^"]+)"/)![1];
// A pessimistic paper-overlay bound, not a pixel measurement: the bright backdrop
// receives the darkest 4% multiply texture while the dark foreground receives none.
const darkestPaper = (color: RGB) => over(hex('#000000'), color, 0.04);

it('uses unrounded WCAG luminance after source-over alpha compositing', () => {
  expect(contrast(hex('#000000'), white)).toBe(21);
  expect(contrast(white, white)).toBe(1);
  expect(contrast(over(blue, cream, 0.7), cream)).toBeCloseTo(4.045965741490202, 5);
  expect(contrast(over(blue, cream, 0.7), cream)).toBeLessThan(4.5);
  // Passing navy captions must not be replaced just because they contain opacity.
  expect(contrast(over(navy, hex('#F2EFE7'), 0.6), hex('#F2EFE7'))).toBeGreaterThanOrEqual(4.5);
  expect(notebook).toContain('text-xs text-[#010D6E]/60');
});

describe('essential field text and identifying boundaries', () => {
  const article = over(white, cream, 0.85);
  const authBackground = over(cream, paper, 0.5);
  const fields = [
    ['observation memo', memoClass, white, article],
    ['account email', inputClass(navbar, 'account-email'), authBackground, paper],
    ['account password', inputClass(navbar, 'account-password'), authBackground, paper],
  ] as const;
  it.each(fields)('%s retains readable placeholder text and a discernible field edge', (_name, classes, background, outside) => {
    expect(contrast(utilityColor(classes, 'placeholder:text', background), background)).toBeGreaterThanOrEqual(4.5);
    const edge = utilityColor(classes, 'border', background);
    expect(contrast(edge, outside)).toBeGreaterThanOrEqual(3);
    expect(contrast(edge, darkestPaper(outside))).toBeGreaterThanOrEqual(3);
  });
  it('pins the layered surfaces used by the calculation and preserves focus styling', () => {
    expect(notebook).toContain('bg-white/85 p-5');
    expect(memoClass).toContain('bg-white');
    for (const id of ['account-email', 'account-password']) {
      const classes = inputClass(navbar, id);
      expect(classes).toContain('bg-[#FEF1D0]/50');
      expect(classes).toContain('focus:border-[#0042AF]');
    }
    expect(navbar).toContain('bg-[#FFFDF7] border');
  });
});

it('keeps active close, feedback and privacy links above the normal-text threshold', () => {
  expect(navbar).toContain('text-[12px] text-[#0042AF]/80 hover:text-[#010D6E]');
  expect(home).toContain('border-[#0042AF]/25 text-[#0042AF]/80 hover:border-[#0042AF]');
  expect(layout).toContain('text-[12px] text-[#0042AF]/80');
  expect(domain).toContain('border-[#0042AF]/30 text-[#0042AF]/80');
  expect(layout).toContain('bg-[#F6E2B3]/40');
  for (const background of [paper, over(hex('#F6E2B3'), cream, 0.4)]) {
    const foreground = over(blue, background, 0.8);
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(foreground, darkestPaper(background))).toBeGreaterThanOrEqual(4.5);
  }
});

it('uses a dedicated dark terracotta for text and text-bearing states on audited surfaces', () => {
  const resetHover = over(hex('#D4653B'), paper, 0.1);
  const summaryPaper = over(paper, sheet, 0.6);
  const backgrounds = [cream, sheet, paper, white, over(cream, sheet, 0.6), over(cream, sheet, 0.7), over(cream, summaryPaper, 0.55), resetHover];
  for (const background of backgrounds) {
    expect(contrast(orange, background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(orange, darkestPaper(background))).toBeGreaterThanOrEqual(4.5);
  }
  for (const text of [white, paper]) {
    expect(contrast(text, orange)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(darkestPaper(text), orange)).toBeGreaterThanOrEqual(4.5);
  }
  for (const text of [home, domain, navbar, source('src/app/daily/page.tsx')]) {
    expect(text).toContain('text-terracotta-ink');
    expect(text).not.toContain('text-[#D4653B]');
    expect(text).not.toContain('bg-[#D4653B] text-');
  }
  for (const text of [home, domain]) expect(text).toContain('bg-terracotta-ink text-[#FFFDF7] border-terracotta-ink');
  // This is not a global palette replacement: decorative dots, separators,
  // progress, and disabled controls remain separate from essential text.
  expect(home).toContain('h-full bg-[#D4653B]');
  expect(domain).toContain('w-5 bg-[#D4653B]');
  expect(navbar).toContain('w-2 h-2 rounded-full bg-[#D4653B]');
  expect(navbar).toContain('disabled:opacity-50');
  expect(notebook).toContain('disabled:opacity-40');
});
