import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { ALL_MASTER_DOMAINS } from '../src/lib/domains-index';

// Preserve every numeric value (weights/signatures included), domain/question/type IDs,
// axis keys and array order from the pre-edit catalogue. No response fixtures are used.
function mechanics(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(mechanics);
  if (value && typeof value === 'object') return Object.fromEntries(
    Object.entries(value).filter(([key, item]) => typeof item === 'number' || ['id', 'slug', 'axisKey'].includes(key) || (item !== null && typeof item === 'object'))
      .map(([key, item]) => [key, typeof item === 'object' ? mechanics(item) : item]),
  );
  return typeof value === 'number' ? value : null;
}
const types = ALL_MASTER_DOMAINS.flatMap(domain => domain.phenotypes);
const curation = (id: string) => types.flatMap(type => type.curations).find(item => item.id === id)!;

describe('bounded catalogue copy calibration', () => {
  it('preserves IDs, axis keys, all scoring numbers and catalogue order', () => {
    expect(createHash('sha256').update(JSON.stringify(mechanics(ALL_MASTER_DOMAINS))).digest('hex')).toBe('c25fca1732e8e6aa80adc5263c4f07a8718760e9e76cb25b22a5fbf21022b3be');
  });
  it('describes twelve choice activities without promising validated analysis or personalization', () => {
    expect(ALL_MASTER_DOMAINS).toHaveLength(12);
    for (const domain of ALL_MASTER_DOMAINS) {
      expect(domain.subtitle).not.toMatch(/분석|맞춤|안목|기술 수용도/);
      expect(domain.subtitle).toContain(String(domain.questions.length));
    }
    expect(ALL_MASTER_DOMAINS.find(d => d.slug === 'music')!.subtitle).toContain('실제 청음 없이');
    expect(ALL_MASTER_DOMAINS.find(d => d.id === 3)!.subtitle).toContain('직접 평가하는 검사가 아니라');
    expect(ALL_MASTER_DOMAINS.find(d => d.id === 10)!.subtitle).toContain('투자 적합성을 평가하지 않습니다');
  });
  it('does not classify navy as achromatic or predict wardrobe use', () => {
    const fashion = ALL_MASTER_DOMAINS[0];
    expect(fashion.axes.find(axis => axis.axisKey === 'color_tone')!.leftLabel).toBe('검정 · 회색 · 남색');
    const type = types.find(type => type.id === 'fas-clean-minimal')!;
    expect(type.name).toBe('검정·회색·네이비의 정핏 미니멀형');
    expect(type.summary).not.toContain('무채색');
    expect(type.summary).toContain('스타일 제안');
    expect(type.decisionGuide.join(' ')).not.toContain('확률이 높습니다');
    expect(type.decisionGuide.join(' ')).toContain('함께 입어보세요');
  });
  it('replaces universal fashion and asset protection promises with concrete comparisons', () => {
    for (const id of ['cur-fas-2', 'cur-fas-7', 'cur-fas-8', 'cur-fas-9']) {
      expect(curation(id).reason).not.toMatch(/가장 잘|호불호 없이|가장 탄탄|100%/);
      expect(curation(id).reason).toMatch(/비교|확인|바꾸며/);
    }
    expect(curation('cur-eco-2').tags).toContain('만기분산');
    expect(curation('cur-eco-2').tags).not.toContain('계단식복리');
    expect(types.find(type => type.curations.some(item => item.id === 'cur-eco-2'))!.name).toBe('금고와 장부로 살펴보는 계획적 자산 관리');
  });
});
