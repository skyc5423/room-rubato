import { describe, expect, it } from 'vitest';
import { ALL_MASTER_DOMAINS } from '../src/lib/domains-index';
const phenotypes = ALL_MASTER_DOMAINS.flatMap(domain => domain.phenotypes);
const curations = phenotypes.flatMap(phenotype => phenotype.curations);
const get = (id: string) => curations.find(curation => curation.id === id)!;

describe('bounded recommendation fact corrections', () => {
  it('does not equate model popularity with fault-free lifetime or unrestricted DIY repair', () => {
    const reason = get('cur-tec-6').reason;
    expect(reason).toContain('모델별 수리 설명서');
    expect(reason).toContain('제품과 경험에 따라');
    expect(reason).not.toContain('잔고장 없이');
    expect(reason).not.toContain('언제든 직접');
    const guide = phenotypes.find(p => p.curations.some(c => c.id === 'cur-tec-6'))!.decisionGuide.join(' ');
    expect(guide).toContain('모델별 보증·수리 안내');
    expect(guide).not.toContain('만족도가 가장 높습니다');
  });
  it('distinguishes lossless encoding from resolution and audible benefits', () => {
    const audio = get('cur-mus-4');
    expect(audio.title).not.toContain('고해상도');
    expect(audio.reason).toContain('입력 오디오를 손실 없이 압축');
    expect(audio.reason).toContain('파일 형식만으로');
    expect(audio.reason).toContain('볼륨을 높이지 마세요');
    expect(audio.tags).not.toContain('고해상도청음');
    const guide = phenotypes.find(p => p.curations.some(c => c.id === 'cur-mus-4'))!.decisionGuide.join(' ');
    expect(guide).toContain('모든 사람에게 정답은 아니므로');
    expect(guide).toContain('작업 공간과 착용감');
  });
  it('keeps optional observation without an instant recovery or whole-oeuvre claim', () => {
    expect(get('cur-phi-5').reason).not.toContain('즉시 회복');
    expect(get('cur-phi-5').reason).toContain('날씨와 몸 상태');
    expect(get('cur-art-6').reason).not.toContain('오직 흑백');
    expect(get('cur-art-6').reason).toContain('선택한 작품');
  });
  it('does not infer investment suitability or promise a safe return from maturity allocation', () => {
    const phenotype = phenotypes.find(item => item.curations.some(curation => curation.id === 'cur-eco-2'))!;
    const guide = phenotype.decisionGuide.join(' ');
    expect(guide).toContain('적합한 투자 상품이나 비중을 정할 수는 없습니다');
    expect(guide).toContain('채무불이행');
    expect(guide).toContain('금리 변동');
    expect(guide).not.toContain('장기 성과를 동시에 높여');
    expect(get('cur-eco-2').reason).toContain('원금 보전이나 수익을 보장하지는 않으며');
  });
  it('does not give a grouped brand recommendation a shared centuries-old history', () => {
    expect(get('cur-gas-16').reason).not.toContain('수백 년');
    expect(get('cur-gas-16').reason).toContain('피부에 쓰는 제품인지 마시는 차인지');
  });
  it('distinguishes impasto tools and avoids classifying all named artists as abstract expressionists', () => {
    expect(get('cur-art-4').reason).toContain('붓이나 팔레트 나이프');
    expect(get('cur-art-4').reason).toContain('시대와 사조가 서로 다른');
    expect(get('cur-art-4').tags).not.toContain('추상표현주의');
  });
  it('limits noise cancellation and makes edition/region availability explicit', () => {
    expect(get('cur-wrk-1').reason).toContain('모든 소리를 없애는 도구는 아닙니다');
    expect(get('cur-cin-7').reason).toContain('구성은 판본마다 다릅니다');
    expect(get('cur-cin-7').reason).toContain('지역 코드·자막·배송');
    expect(get('cur-cin-7').reason).toContain('미국과 캐나다에서만');
  });
});
