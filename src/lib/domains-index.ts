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
 * 응답 시간(ms)을 바탕으로 해당 선택의 확신도(0~1)를 계산합니다.
 * 빠르게 고를수록(<1.5초) 평소 취향이 뚜렷한 영역이고, 오래 고민할수록(>4.5초) 아직 기준이 낯선 영역임을 뜻합니다.
 */
export function computeResponseConviction(responseTimeMs: number): number {
  if (responseTimeMs <= 1200) return 0.95;
  if (responseTimeMs >= 6000) return 0.25;
  const ratio = (6000 - responseTimeMs) / (6000 - 1200);
  return Number((0.25 + ratio * 0.7).toFixed(2));
}

/**
 * 도메인 내 다차원 축 점수와 가장 가까운 취향 유형(Phenotype)을 유클리드 거리 기반으로 정밀 매칭합니다.
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
    // 유클리드 거리 역수(-distSq)에 방향 일치도(dot)를 결합해 중간 성향과 극단 성향을 모두 정확히 분류
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
  matchProbability: number;
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

  const normalizedProb = Math.min(
    94,
    Math.max(68, Math.round(74 + bestScore * 12))
  );

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
    traits.length > 0 ? traits.slice(0, 2).join(', ') : '깔끔하고 균형 잡힌 스타일';

  const sourceLabel =
    sourceDomainNames.length > 0
      ? `이미 취향을 찾은 [${sourceDomainNames.slice(0, 3).join(' · ')}]에서`
      : '지금까지 고르신 항목에서';

  const bridgeExplanation = `${sourceLabel} ‘${traitText}’을 선호하셨어요. 이런 분들은 [${targetDomain.shortTitle}]에서도 「${bestPheno.name}」 쪽을 골랐을 때 가장 만족도가 높습니다.`;

  return {
    predictedPhenotype: bestPheno,
    matchProbability: normalizedProb,
    bridgeExplanation,
    sourceDomainNames,
  };
}

/**
 * 오늘의 질문 & 어제 다른 성향의 사람들은 어떻게 답했는지 보여주는 리포트 데이터
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
      majorityOption: 'A',
      majorityPercent: 76,
      contrarianPhenotypeName: '원리와 미래 구조를 파고드는 탐구자 (AI·우주)',
      contrarianOption: 'B',
      contrarianPercent: 68,
      nudgePrompt:
        '만약 주변 사람들의 78%가 "첫 만남에서는 무조건 튀지 않는 기본 정석 스타일(A)이 훨씬 호감 간다"고 말한다면, 처음 고른 선택을 그대로 유지하시겠어요?',
    },
    yesterdayInsight: {
      questionSummary:
        '어제의 질문: "내가 입을 옷과 볼 영화를 AI가 내 취향에 맞춰 99% 정확도로 대신 골라준다면 맡기시겠어요?"',
      crowdMajorityText:
        '전체 참여자의 67.4%는 "고민할 시간이 줄어든다며 기꺼이 AI에게 선택을 맡긴다"를 골랐습니다.',
      personaDivergenceText:
        '반면 AI·우주와 음악 분야에서 자기 취향이 뚜렷한 사람들과 ‘핏과 소재 중심의 미니멀형’ 그룹은 81.2%가 "조금 헤매더라도 내가 직접 고르는 과정 자체가 내 삶이다"라며 반대로 답했습니다.',
      keyTakeaway:
        '내가 좋아하는 분야가 하나라도 분명한 사람일수록, 편리함보다 ‘내가 직접 고르는 주체성’을 훨씬 더 소중하게 여깁니다.',
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
      majorityOption: 'B',
      majorityPercent: 82,
      contrarianPhenotypeName: '사운드의 결과 구조를 듣는 리스너 (음악)',
      contrarianOption: 'A',
      contrarianPercent: 74,
      nudgePrompt:
        '만약 영화 평론가들은 A를 올해 최고의 작품으로 꼽았지만, 내 친한 친구들 85%는 "보다가 잠들었다, 무조건 B를 봐라"고 말린다면 어느 쪽을 보시겠어요?',
    },
    yesterdayInsight: {
      questionSummary:
        '어제의 질문: "요즘 제일 유행하는 1시간 대기 맛집 vs 손님은 없지만 조용하고 정갈한 동네 식당"',
      crowdMajorityText:
        '전체 참여자의 54%는 "그래도 왜 유명한지 한 번쯤은 줄 서서 먹어보고 싶다"고 답했습니다.',
      personaDivergenceText:
        '하지만 ‘자율적인 몰입을 아끼는 사람’과 ‘조용한 자연에 머무는 여행자’ 유형은 무려 89.4%가 평균 1.1초 만에 "줄을 서는 순간 그 공간의 매력은 사라진다"며 조용한 동네 식당을 택했습니다.',
      keyTakeaway:
        '공간과 시간의 밀도를 중시하는 사람들에게는 ‘남들이 줄 서는 인기’가 매력이 아니라 오히려 피하고 싶은 소음으로 작동합니다.',
    },
  },
];
