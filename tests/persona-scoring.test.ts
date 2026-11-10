import { describe, expect, it } from 'vitest';
import { derivePersonaVectors } from '../src/lib/persona-scoring';
import { ALL_MASTER_DOMAINS } from '../src/lib/domains-index';
import type { ChoiceTelemetryEntry, CompletedDomainResult } from '../src/lib/types';
const domain = ALL_MASTER_DOMAINS[0];
const other = ALL_MASTER_DOMAINS[1];
const result = (id: number): CompletedDomainResult => ({ domainId: id, matchedPhenotypeId: 'test', axisScores: {}, avgResponseTimeMs: 2000, convictionScore: .5, completedAt: '2026-11-10T00:00:00Z' });
const answers = (id: number, choice: 'A' | 'B', day: string): ChoiceTelemetryEntry[] => ALL_MASTER_DOMAINS.find(d => d.id === id)!.questions.map(q => ({ domainId: id, questionId: q.id, chosenOption: choice, timestamp: `${day}T00:00:00Z`, responseTimeMs: 2000, convictionScore: .5 }));
describe('latest-answer persona derivation', () => {
  it('repeating identical answers does not amplify or saturate vectors', () => {
    const log = answers(domain.id, 'A', '2026-11-10');
    const completed = { [domain.id]: result(domain.id) };
    expect(derivePersonaVectors(Array.from({ length: 20 }, () => log).flat(), completed, []))
      .toEqual(derivePersonaVectors(log, completed, []));
  });
  it('changed answers replace previous contributions while preserving other domains', () => {
    const old = answers(domain.id, 'A', '2026-11-09');
    const current = answers(domain.id, 'B', '2026-11-10');
    const otherAnswers = answers(other.id, 'A', '2026-11-09');
    const completed = { [domain.id]: result(domain.id), [other.id]: result(other.id) };
    expect(derivePersonaVectors([...old, ...otherAnswers, ...current], completed, []))
      .toEqual(derivePersonaVectors([...otherAnswers, ...current], completed, []));
  });
  it('uses timestamps rather than arrival order and does not mutate historical records', () => {
    const old = answers(domain.id, 'A', '2026-11-09');
    const current = answers(domain.id, 'B', '2026-11-10');
    const log = [...current, ...old]; const before = JSON.stringify(log);
    const completed = { [domain.id]: result(domain.id) };
    expect(derivePersonaVectors(log, completed, [])).toEqual(derivePersonaVectors(current, completed, []));
    expect(JSON.stringify(log)).toBe(before);
  });
  it('does not count incomplete/unknown domains and preserves daily contributions', () => {
    const baseline = derivePersonaVectors([], {}, []);
    expect(derivePersonaVectors(answers(domain.id, 'A', '2026-11-10'), {}, [])).toEqual(baseline);
    const daily = { timestamp: '2026-11-10T00:00:00Z', pulseId: 'test', phase1Choice: 'A' as const, phase2ChoiceAfterSocialProof: 'B' as const, phase1ResponseTimeMs: 2000, didShift: true };
    expect(derivePersonaVectors([], {}, [daily]).layer2Vector.socialConformity).toBe(.25);
  });
});
