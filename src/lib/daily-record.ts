import { koreanDay } from './daily-date';

export function dailyChoice(value: unknown): 'A' | 'B' | null {
  return value === 'A' || value === 'B' ? value : null;
}

/** Read the latest identifiable record without repairing or dropping the original log.
 * Invalid choices still represent an existing response, not permission to overwrite it.
 */
export function latestDailyRecord(log: readonly unknown[], pulseId: string, day: string) {
  for (let index = log.length - 1; index >= 0; index--) {
    const entry = log[index];
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const value = entry as Record<string, unknown>;
    if (value.pulseId !== pulseId || typeof value.timestamp !== 'string' || koreanDay(value.timestamp) !== day) continue;
    return {
      timestamp: value.timestamp,
      phase1Choice: dailyChoice(value.phase1Choice),
      phase2ChoiceAfterSocialProof: dailyChoice(value.phase2ChoiceAfterSocialProof),
      phase1ResponseTimeMs: value.phase1ResponseTimeMs,
    };
  }
  return null;
}
