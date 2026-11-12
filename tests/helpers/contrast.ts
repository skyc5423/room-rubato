/** Test-only WCAG sRGB calculation. Composite source-over colors before linearizing. */
export type RGB = readonly [number, number, number];
export function hex(value: string): RGB {
  if (!/^#[\da-f]{6}$/i.test(value)) throw new Error(`Expected six-digit color: ${value}`);
  return [1, 3, 5].map(index => parseInt(value.slice(index, index + 2), 16)) as unknown as RGB;
}
export function over(foreground: RGB, background: RGB, alpha: number): RGB {
  return foreground.map((channel, i) => channel * alpha + background[i] * (1 - alpha)) as unknown as RGB;
}
export function contrast(foreground: RGB, background: RGB): number {
  const luminance = (color: RGB) => color.reduce((sum, channel, i) => {
    const value = channel / 255;
    const linear = value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    return sum + linear * [0.2126, 0.7152, 0.0722][i];
  }, 0);
  const [dark, light] = [luminance(foreground), luminance(background)].sort((a, b) => a - b);
  return (light + 0.05) / (dark + 0.05);
}
/** Read the audited literal Tailwind utility so tests cannot silently use a different color. */
export function utilityColor(classes: string, prefix: string, background: RGB): RGB {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = classes.match(new RegExp(`(?:^|\\s)${escaped}-\\[(#[\\da-fA-F]{6})\\](?:/(\\d+))?(?=\\s|$)`));
  if (!match) throw new Error(`Missing ${prefix} color in ${classes}`);
  return over(hex(match[1]), background, match[2] ? Number(match[2]) / 100 : 1);
}
