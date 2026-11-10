import { expect, it } from 'vitest';
import { koreanDay } from '../src/lib/daily-date';

it('changes service date at Korean midnight rather than UTC midnight', () => {
  expect(koreanDay('2026-11-10T14:59:59.999Z')).toBe('2026-11-10');
  expect(koreanDay('2026-11-10T15:00:00.000Z')).toBe('2026-11-11');
});
it('handles year boundary and equivalent timezone offsets', () => {
  expect(koreanDay('2026-12-31T15:00:00Z')).toBe('2027-01-01');
  expect(koreanDay('2027-01-01T00:00:00+09:00')).toBe('2027-01-01');
  expect(koreanDay('invalid')).toBe('');
});
