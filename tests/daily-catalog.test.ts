import { expect, it } from 'vitest';
import { ALL_MASTER_DOMAINS, DAILY_PULSE_QUESTIONS } from '../src/lib/domains-index';

it('preserves existing record identifiers and supplies eight distinct editorial situations', () => {
  expect(DAILY_PULSE_QUESTIONS.slice(0, 2).map(q => q.id)).toEqual(['daily-pulse-1', 'daily-pulse-2']);
  expect(DAILY_PULSE_QUESTIONS).toHaveLength(8);
  expect(new Set(DAILY_PULSE_QUESTIONS.map(q => q.id)).size).toBe(8);
  expect(new Set(DAILY_PULSE_QUESTIONS.map(q => q.domainId)).size).toBe(8);
  for (const question of DAILY_PULSE_QUESTIONS) {
    expect(ALL_MASTER_DOMAINS.some(d => d.id === question.domainId)).toBe(true);
    expect(question.optionA.label).not.toEqual(question.optionB.label);
    expect(question.socialProofNudge.nudgePrompt).toContain('가상의 상황');
    expect(question.yesterdayInsight.keyTakeaway).toContain('참여자 통계가 아닙니다');
    expect(question.yesterdayInsight.questionSummary.length).toBeGreaterThan(10);
  }
});
