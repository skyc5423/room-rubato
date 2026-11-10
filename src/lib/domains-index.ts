import { PILLAR_1_DOMAINS } from './domains-pillar1';
import { PILLAR_2_DOMAINS } from './domains-pillar2';
import { PILLAR_3_DOMAINS } from './domains-pillar3';
import { getRoomObjectByDomainId } from './room-objects';
import {
  CompletedDomainResult,
  DailyPulseQuestion,
  DomainPhenotype,
  Layer1CoreVector,
  Layer2BehavioralVector,
  Layer3AestheticVector,
  MasterDomain,
} from './types';

export const ALL_MASTER_DOMAINS: MasterDomain[] = [
  ...PILLAR_1_DOMAINS,
  ...PILLAR_2_DOMAINS,
  ...PILLAR_3_DOMAINS,
];

export function getDomainById(id: number): MasterDomain | undefined {
  return ALL_MASTER_DOMAINS.find((d) => d.id === id);
}

export function getDomainBySlug(slug: string): MasterDomain | undefined {
  return ALL_MASTER_DOMAINS.find((d) => d.slug === slug);
}

export const INITIAL_LAYER1_VECTOR: Layer1CoreVector = {
  openness: 0,
  conscientiousness: 0,
  extraversion: 0,
  agreeableness: 0,
  neuroticism: 0,
  selfTranscendenceVsEnhancement: 0,
  opennessVsConservation: 0,
};

export const INITIAL_LAYER2_VECTOR: Layer2BehavioralVector = {
  socialConformity: 0,
  authoritySensitivity: 0,
  riskAversion: 0,
  timeDiscounting: 0,
  domainConviction: {},
};

export const INITIAL_LAYER3_VECTOR: Layer3AestheticVector = {
  complexity: 0,
  novelty: 0,
  intensity: 0,
  conceptualism: 0,
  warmth: 0,
};

export function clampUnit(val: number): number {
  return Math.max(-1, Math.min(1, Number(val.toFixed(3))));
}

/**
 * Legacy compatibility field, not a validated confidence measurement.
 * A fixed neutral value avoids inferring certainty from reading/device speed.
 * Historical stored records are left unchanged.
 */
export function computeResponseConviction(_responseTimeMs: number): number {
  return 0.5;
}

/**
 * 도메인 내 다차원 축 점수와 가장 가까운 취향 유형(Phenotype)을 유클리드 거리 기반으로 연결합니다. 검증된 성격 검사나 확률 모델은 아닙니다.
 */
export function matchDomainPhenotype(
  domain: MasterDomain,
  axisScores: Record<string, number>
): DomainPhenotype {
  let bestPhenotype = domain.phenotypes[0];
  let bestScore = -Infinity;

  for (const pheno of domain.phenotypes) {
    let distSq = 0;
    let dot = 0;
    for (const axis of domain.axes) {
      const userVal = axisScores[axis.axisKey] ?? 0;
      const sigVal = pheno.axisSignature[axis.axisKey] ?? 0;
      const diff = userVal - sigVal;
      distSq += diff * diff;
      dot += userVal * sigVal;
    }
    // 유클리드 거리 역수(-distSq)에 방향 일치도(dot)를 결합해 중간 성향과 극단 성향을 연결하는 수작업 휴리스틱
    const combinedScore = -distSq + dot * 0.35;
    if (combinedScore > bestScore) {
      bestScore = combinedScore;
      bestPhenotype = pheno;
    }
  }
  return bestPhenotype;
}

/**
 * 내가 잘 아는 분야에서 쌓인 감각 기준(Layer 3)을 바탕으로,
 * 아직 잘 모르는 분야에서 끌릴 가능성이 높은 취향 유형을 예측합니다.
 */
export function predictUnplayedDomainPhenotype(
  targetDomain: MasterDomain,
  userLayer3: Layer3AestheticVector,
  completedResults: Record<number, CompletedDomainResult>
): {
  predictedPhenotype: DomainPhenotype;
  heuristicScore: number;
  bridgeExplanation: string;
  sourceDomainNames: string[];
} {
  const completedIds = Object.keys(completedResults).map(Number);
  const sourceDomainNames = completedIds
    .map((id) => getDomainById(id)?.shortTitle)
    .filter((v): v is string => Boolean(v));

  let bestPheno = targetDomain.phenotypes[0];
  let bestScore = -Infinity;

  const l3Keys: (keyof Layer3AestheticVector)[] = [
    'complexity',
    'novelty',
    'intensity',
    'conceptualism',
    'warmth',
  ];

  for (const pheno of targetDomain.phenotypes) {
    let score = 0;
    for (const k of l3Keys) {
      const uVal = userLayer3[k] ?? 0;
      const pVal = pheno.layer3Signature[k] ?? 0;
      score += uVal * pVal;
    }
    if (score > bestScore) {
      bestScore = score;
      bestPheno = pheno;
    }
  }

  const traits: string[] = [];
  if (userLayer3.complexity <= -0.25) traits.push('복잡한 장식보다 깔끔하고 정돈된 것');
  else if (userLayer3.complexity >= 0.25) traits.push('디테일과 질감이 풍부한 것');

  if (userLayer3.conceptualism >= 0.25) traits.push('만들어진 원리와 배경이 분명한 것');
  else if (userLayer3.conceptualism <= -0.25) traits.push('설명 없이 직관적으로 보기 편한 것');

  if (userLayer3.novelty >= 0.25) traits.push('흔하지 않고 개성이 뚜렷한 것');
  else if (userLayer3.novelty <= -0.25) traits.push('유행을 타지 않는 기본 스타일');

  if (userLayer3.warmth >= 0.25) traits.push('부드럽고 아늑한 분위기');
  else if (userLayer3.warmth <= -0.25) traits.push('단정하고 차분한 분위기');

  const traitText =
    traits.length > 0 ? traits.slice(0, 2).join(', ') : '아직 뚜렷하게 구분되지 않은 여러 특징';

  const sourceLabel =
    sourceDomainNames.length > 0
      ? `이미 취향을 찾은 [${sourceDomainNames.slice(0, 3).join(' · ')}]에서`
      : '지금까지 고르신 항목에서';

  const bridgeExplanation = `${sourceLabel} ‘${traitText}’을 선호하셨어요. 이 특징과 연결해 [${targetDomain.shortTitle}]의 「${bestPheno.name}」를 먼저 살펴보는 건 어떨까요? 실제로 좋아할지는 직접 골라 확인해 보세요.`;

  return {
    predictedPhenotype: bestPheno,
    heuristicScore: bestScore,
    bridgeExplanation,
    sourceDomainNames,
  };
}

/**
 * 편집된 질문과 가상 상황. 실제 이용자 집계나 연구 결과가 아닙니다.
 */
export const DAILY_PULSE_QUESTIONS: DailyPulseQuestion[] = [
  {
    id: 'daily-pulse-1',
    dayLabel: '오늘의 질문 · 옷과 첫인상',
    domainId: 1,
    domainTitle: '패션 · 스타일',
    questionText:
      '중요한 첫 만남이 있는 날 아침, 옷장 앞에서 결국 손이 가는 옷은 어느 쪽인가요?',
    contextNote:
      '실전 상황에서 안전함을 택하는지, 나만의 인상을 남기는 쪽을 택하는지 알아봅니다.',
    optionA: {
      label: '어디서나 실패하지 않는 단정하고 깔끔한 기본 셔츠와 재킷',
      desc: '튀지 않으면서 누구에게나 깔끔하고 신뢰감 있는 인상을 주는 옷',
      layer3Weights: { novelty: -0.4, complexity: -0.5 },
      layer2Weights: { riskAversion: 0.4, socialConformity: 0.3 },
    },
    optionB: {
      label: '내 취향이 은근하게 드러나는 독특한 핏이나 포인트가 있는 옷',
      desc: '무난함보다는 나라는 사람의 분위기를 자연스럽게 보여주는 옷',
      layer3Weights: { novelty: 0.6, conceptualism: 0.5 },
      layer2Weights: { riskAversion: -0.4, socialConformity: -0.6 },
    },
    socialProofNudge: {
      nudgePrompt:
        '가상의 상황입니다. 주변 사람들이 "첫 만남에서는 무조건 튀지 않는 기본 정석 스타일(A)이 훨씬 호감 간다"고 말한다면, 처음 고른 선택을 그대로 유지하시겠어요?',
    },
    yesterdayInsight: {
      questionSummary:
        '생각해 볼 질문: "내가 입을 옷과 볼 영화를 AI가 내 취향에 맞춰 99% 정확도로 대신 골라준다면 맡기시겠어요?"',
      crowdMajorityText:
        '고르는 시간을 줄이고 싶을 때는 추천을 맡기는 쪽이 편할 수 있습니다.',
      personaDivergenceText:
        '반대로 고르는 과정 자체를 즐긴다면 추천을 참고하되 직접 결정하고 싶을 수 있습니다.',
      keyTakeaway:
        '어떤 선택은 맡기고, 어떤 선택은 직접 하고 싶나요? 위 내용은 편집자의 질문이며 참여자 통계가 아닙니다.',
    },
  },
  {
    id: 'daily-pulse-2',
    dayLabel: '오늘의 질문 · 영화와 금요일 밤',
    domainId: 6,
    domainTitle: '영화 · 드라마',
    questionText:
      '금요일 밤, 평점이 극단적으로 갈리는 독특한 신작과 모두가 칭찬하는 대중 명작 중 무엇을 틀까요?',
    contextNote:
      '내 소중한 2시간을 쓸 때 새로운 자극과 보장된 재미 중 어디에 끌리는지 봅니다.',
    optionA: {
      label: '호불호는 갈리지만 지금껏 본 적 없는 연출이라는 독창적인 화제작',
      desc: '취향에 안 맞을 수도 있지만 새로운 감각을 경험해 보고 싶다',
      layer3Weights: { novelty: 0.8, conceptualism: 0.7 },
      layer2Weights: { riskAversion: -0.6, socialConformity: -0.7 },
    },
    optionB: {
      label: '관객 평점 9.5점으로 이미 재미와 감동이 검증된 웰메이드 명작',
      desc: '모처럼 쉬는 금요일 밤, 실패 없는 확실한 재미와 감동을 원한다',
      layer3Weights: { novelty: -0.5, warmth: 0.4 },
      layer2Weights: { riskAversion: 0.6, socialConformity: 0.5 },
    },
    socialProofNudge: {
      nudgePrompt:
        '가상의 상황입니다. 영화 평론가들은 A를 올해 최고의 작품으로 꼽았지만, 친한 친구들은 "보다가 잠들었다, 무조건 B를 봐라"고 말린다면 어느 쪽을 보시겠어요?',
    },
    yesterdayInsight: {
      questionSummary:
        '생각해 볼 질문: "요즘 제일 유행하는 1시간 대기 맛집 vs 손님은 없지만 조용하고 정갈한 동네 식당"',
      crowdMajorityText:
        '유명한 메뉴를 먹어보고 싶다면 기다리는 시간도 경험의 일부일 수 있습니다.',
      personaDivergenceText:
        '조용히 쉬는 것이 목적이라면 대기 없는 식당이 더 맞을 수도 있습니다.',
      keyTakeaway:
        '오늘 외식에서 가장 원하는 것은 무엇인가요? 위 내용은 편집자의 질문이며 참여자 통계가 아닙니다.',
    },
  },
];
