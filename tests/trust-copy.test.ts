import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { ALL_MASTER_DOMAINS, computeResponseConviction, DAILY_PULSE_QUESTIONS, INITIAL_LAYER3_VECTOR, predictUnplayedDomainPhenotype } from '../src/lib/domains-index';

it('does not infer confidence from reading time', () => {
  expect(computeResponseConviction(200)).toBe(computeResponseConviction(20000));
});
it('returns a heuristic rank rather than a made-up probability', () => {
  const prediction = predictUnplayedDomainPhenotype(ALL_MASTER_DOMAINS[0], INITIAL_LAYER3_VECTOR, {});
  expect(prediction).not.toHaveProperty('matchProbability');
  expect(prediction).toHaveProperty('heuristicScore');
  expect(prediction.bridgeExplanation).not.toContain('만족도가 높습니다');
});
it('labels fictional scenarios and removes fabricated participant statistics', () => {
  for (const question of DAILY_PULSE_QUESTIONS) {
    expect(question.socialProofNudge.nudgePrompt).toContain('가상의 상황');
    expect(question.yesterdayInsight.keyTakeaway).toContain('참여자 통계가 아닙니다');
    expect(question.yesterdayInsight.crowdMajorityText).not.toMatch(/전체 참여자|%/);
    expect(question.yesterdayInsight.personaDivergenceText).not.toMatch(/%/);
  }
});
it('does not expose destructive demo injection and guards profile resets', () => {
  expect(readFileSync('src/components/SurveyResetControl.tsx', 'utf8')).toContain('window.confirm');
  for (const file of ['src/app/page.tsx', 'src/app/research/page.tsx']) {
    const source = readFileSync(file, 'utf8');
    expect(source).not.toContain('onClick={applyAnchorPresetDemo}');
    expect(source).not.toContain('onClick={resetAllData}');
    expect(source).toContain('<SurveyResetControl');
  }
});
