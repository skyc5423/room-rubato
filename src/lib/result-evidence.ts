import type {DomainAxisDefinition} from './types';

/** Only recorded, valid scores may be described as this person's response summary. */
export function recordedAxisScore(scores: unknown, key: string): number | undefined {
  if (!scores || typeof scores !== 'object') return undefined;
  const value = (scores as Record<string, unknown>)[key];
  return typeof value === 'number' && Number.isFinite(value) && value >= -1 && value <= 1 ? value : undefined;
}

export function summarizeRecordedAxes(axes: DomainAxisDefinition[], scores: unknown): string {
  const recorded = axes.flatMap((axis, index) => {
    const score = recordedAxisScore(scores, axis.axisKey);
    return score === undefined ? [] : [{axis, score, index}];
  });
  if (!recorded.length) return '저장된 축 점수가 없어 답변 방향을 요약할 수 없어요. 유형 이름만으로 어떤 항목을 골랐는지 알 수는 없어요.';
  const directions = recorded.filter(item => item.score !== 0)
    .sort((a,b) => Math.abs(b.score)-Math.abs(a.score) || a.index-b.index).slice(0,2);
  if (!directions.length) return '저장된 축 점수는 모두 가운데에 있어요. 이 설문의 계산 기준으로는 어느 한쪽으로 기울지 않았어요.';
  const labels = directions.map(({axis,score}) => `‘${score < 0 ? axis.leftLabel : axis.rightLabel}’`);
  return `저장된 점수 중 가운데에서 상대적으로 더 떨어진 방향은 ${labels.join(', ')} 쪽이에요. 이는 이 설문에서 정한 가중치로 계산한 요약이며, 특정 장면을 모두 골랐다는 뜻은 아니에요.${recorded.length < axes.length ? ' 점수가 없는 축은 요약에서 제외했어요.' : ''}`;
}
