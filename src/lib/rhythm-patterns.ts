/** Original teaching patterns. Indices are zero-based; visible slot numbers start at 1. */
export const RHYTHM_STEP_COUNT = 16;
export const RHYTHM_STEPS_PER_BEAT = 4;
export const RHYTHM_PULSE_STEPS: readonly number[] = [0, 4, 8, 12];
export const RHYTHM_PATTERN_STEPS: Record<'a' | 'b', readonly number[]> = {
  a: [0, 4, 8, 12],
  b: [0, 3, 6, 10],
};
export const RHYTHM_STEP_SECONDS = 0.15;
export const RHYTHM_REPEATS = 2;
export const RHYTHM_PLAYBACK_MS = 5000;
export type RhythmPlayback = 'pulse' | 'a' | 'b';

export function rhythmSlotNumbers(steps: readonly number[]): string {
  return steps.map(step => step + 1).join('·');
}

export const RHYTHM_GRID_EXPLANATION = '굵은 세로선 4개는 일정한 박이고, 가는 선은 박 사이를 나눈 위치입니다. 한 박을 네 칸으로 나눠 모두 16칸이며, 점은 높은 소리가 나는 위치입니다.';
export const RHYTHM_NO_SOUND_READING = `왼쪽부터 칸을 세면 낮은 기준 박은 ${rhythmSlotNumbers(RHYTHM_PULSE_STEPS)}번째 칸입니다. A의 높은 소리는 ${rhythmSlotNumbers(RHYTHM_PATTERN_STEPS.a)}번째 칸에서 박과 겹치고, B의 높은 소리는 ${rhythmSlotNumbers(RHYTHM_PATTERN_STEPS.b)}번째 칸에 놓입니다. B의 첫 소리는 박과 겹치고 나머지 세 소리는 박 사이에 있습니다.`;
