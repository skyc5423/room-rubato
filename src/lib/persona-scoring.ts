import { ALL_MASTER_DOMAINS, clampUnit, computeResponseConviction, INITIAL_LAYER1_VECTOR, INITIAL_LAYER2_VECTOR, INITIAL_LAYER3_VECTOR } from './domains-index';
import type { ChoiceTelemetryEntry, CompletedDomainResult, DailyShiftEntry, Layer1CoreVector, Layer2BehavioralVector, Layer3AestheticVector } from './types';

/** Derived, experimental scores. Keep raw history; count only the latest answer
 * to each question so repeating a questionnaire cannot amplify its influence.
 * Daily fictional-situation answers are records only, never trait evidence.
 */
export function derivePersonaVectors(
  telemetry: ChoiceTelemetryEntry[],
  completedDomains: Record<number, CompletedDomainResult>,
  _dailyShifts: DailyShiftEntry[],
) {
  const layer1Vector = { ...INITIAL_LAYER1_VECTOR };
  const layer2Vector = { ...INITIAL_LAYER2_VECTOR, domainConviction: {} as Record<number, number> };
  const layer3Vector = { ...INITIAL_LAYER3_VECTOR };
  const latest = new Map<string, ChoiceTelemetryEntry>();
  for (const entry of telemetry) {
    if (!completedDomains[entry.domainId]) continue;
    const key = `${entry.domainId}:${entry.questionId}`;
    const prior = latest.get(key);
    // Array order breaks equal timestamp ties (e.g. rapid repeated submissions).
    if (!prior || entry.timestamp >= prior.timestamp) latest.set(key, entry);
  }
  for (const [, entry] of [...latest.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const domain = ALL_MASTER_DOMAINS.find(d => d.id === entry.domainId);
    const question = domain?.questions.find(q => q.id === entry.questionId);
    if (!domain || !question) continue;
    const option = entry.chosenOption === 'A' ? question.optionA : question.optionB;
    const scale = (0.75 / Math.max(3, domain.questions.length)) *
      (0.5 + 0.5 * computeResponseConviction(entry.responseTimeMs));
    for (const [key, value] of Object.entries(option.layer1Weights ?? {})) {
      layer1Vector[key as keyof Layer1CoreVector] += value * scale;
    }
    for (const [key, value] of Object.entries(option.layer2Weights ?? {})) {
      layer2Vector[key as keyof Omit<Layer2BehavioralVector, 'domainConviction'>] += value * scale;
    }
    for (const [key, value] of Object.entries(option.layer3Weights ?? {})) {
      layer3Vector[key as keyof Layer3AestheticVector] += value * scale;
    }
  }
  for (const [id, result] of Object.entries(completedDomains)) {
    layer2Vector.domainConviction[Number(id)] = result.convictionScore;
  }
  for (const key of Object.keys(layer1Vector) as (keyof Layer1CoreVector)[]) layer1Vector[key] = clampUnit(layer1Vector[key]);
  for (const key of Object.keys(layer3Vector) as (keyof Layer3AestheticVector)[]) layer3Vector[key] = clampUnit(layer3Vector[key]);
  for (const key of ['socialConformity', 'authoritySensitivity', 'riskAversion', 'timeDiscounting'] as const) layer2Vector[key] = clampUnit(layer2Vector[key]);
  return { layer1Vector, layer2Vector, layer3Vector };
}
