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

  const bridgeExplanation = completedIds.length === 0 ? `아직 응답이 없어 개인화하지 않았습니다. [${targetDomain.shortTitle}] 질문부터 시작해 보세요.` : `${sourceLabel} ‘${traitText}’을 선호하셨어요. 이 특징과 연결해 [${targetDomain.shortTitle}]의 「${bestPheno.name}」를 먼저 살펴보는 건 어떨까요? 실제로 좋아할지는 직접 골라 확인해 보세요.`;

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
  ...[
  {
    "id": "daily-pulse-3",
    "dayLabel": "오늘의 질문 · 방의 빈자리",
    "domainId": 2,
    "domainTitle": "공간",
    "questionText": "쉬는 날 방 한쪽을 바꾼다면, 무엇을 먼저 하고 싶나요?",
    "contextNote": "일상 속 가상 상황을 비교하는 편집 질문입니다. 성격 검사나 실제 참여자 통계가 아닙니다.",
    "optionA": {
      "label": "물건을 덜어내고 넓은 여백 만들기",
      "desc": "시선이 머물 곳을 줄여 편하게 쉬고 싶어요.",
      "layer3Weights": {}
    },
    "optionB": {
      "label": "사진과 작은 물건으로 이야기 있는 자리 만들기",
      "desc": "좋아하는 기억을 눈에 보이는 곳에 두고 싶어요.",
      "layer3Weights": {}
    },
    "socialProofNudge": {
      "nudgePrompt": "가상의 상황입니다. 함께 사는 사람이 B처럼 사진이 있는 방이 더 따뜻하다고 말한다면, 무엇을 선택할까요?"
    },
    "yesterdayInsight": {
      "questionSummary": "편안한 방과 나다운 방은 같은 모습일까요?",
      "crowdMajorityText": "비어 있는 공간이 휴식에 도움이 되는 날도 있습니다.",
      "personaDivergenceText": "기억이 담긴 물건이 있어야 편안한 사람도 있습니다.",
      "keyTakeaway": "다른 사람이 보는 모습과 내가 매일 지내는 감각을 나눠 생각해 보세요. 위 내용은 편집자의 질문이며 참여자 통계가 아닙니다."
    }
  },
  {
    "id": "daily-pulse-4",
    "dayLabel": "오늘의 질문 · 익숙한 한 끼",
    "domainId": 3,
    "domainTitle": "미식 · 향",
    "questionText": "오랜만에 혼자 여유롭게 식사한다면 어떤 메뉴를 고를까요?",
    "contextNote": "일상 속 가상 상황을 비교하는 편집 질문입니다. 성격 검사나 실제 참여자 통계가 아닙니다.",
    "optionA": {
      "label": "기억에 남아 있는 익숙한 메뉴",
      "desc": "맛을 예상할 수 있는 한 끼에서 편안함을 얻고 싶어요.",
      "layer3Weights": {}
    },
    "optionB": {
      "label": "아직 먹어보지 않은 새로운 메뉴",
      "desc": "낯선 향과 식감을 천천히 알아보고 싶어요.",
      "layer3Weights": {}
    },
    "socialProofNudge": {
      "nudgePrompt": "가상의 상황입니다. 친구가 오늘은 새로운 메뉴 B를 꼭 먹어보라고 추천한다면, 어떻게 고를까요?"
    },
    "yesterdayInsight": {
      "questionSummary": "새로운 맛을 찾는 날과 익숙한 맛이 필요한 날",
      "crowdMajorityText": "낯선 메뉴를 선택하지 않는다고 호기심이 없는 것은 아닙니다.",
      "personaDivergenceText": "그날의 컨디션과 식사 목적이 같은 사람의 선택도 바꿀 수 있습니다.",
      "keyTakeaway": "오늘 식사에서 가장 원하는 것이 휴식인지 발견인지 적어 보세요. 위 내용은 편집자의 질문이며 참여자 통계가 아닙니다."
    }
  },
  {
    "id": "daily-pulse-5",
    "dayLabel": "오늘의 질문 · 그림 앞의 시간",
    "domainId": 4,
    "domainTitle": "미술 · 디자인",
    "questionText": "전시장에서 남은 시간이 20분이라면 어떻게 보고 싶나요?",
    "contextNote": "일상 속 가상 상황을 비교하는 편집 질문입니다. 성격 검사나 실제 참여자 통계가 아닙니다.",
    "optionA": {
      "label": "마음에 드는 한 작품 앞에서 오래 머물기",
      "desc": "색과 붓질, 거리를 바꾸며 처음 놓친 것을 찾아요.",
      "layer3Weights": {}
    },
    "optionB": {
      "label": "여러 작품을 비교하며 전시 전체 둘러보기",
      "desc": "반복되는 형태와 차이를 따라 전시의 흐름을 살펴요.",
      "layer3Weights": {}
    },
    "socialProofNudge": {
      "nudgePrompt": "가상의 상황입니다. 함께 온 친구가 전체를 봐야 전시가 이해된다며 B를 권한다면, 어떻게 할까요?"
    },
    "yesterdayInsight": {
      "questionSummary": "작품 한 점의 깊이와 여러 작품 사이의 연결",
      "crowdMajorityText": "한 점에 오래 머무르면 처음 보이지 않던 세부를 발견할 수 있습니다.",
      "personaDivergenceText": "여러 점을 비교하면 한 작품만으로 알기 어려운 차이를 볼 수도 있습니다.",
      "keyTakeaway": "관찰실에서 색·빛·구도를 따로 비교한 뒤 내 관람 방식과 연결해 보세요. 위 내용은 편집자의 질문이며 참여자 통계가 아닙니다."
    }
  },
  {
    "id": "daily-pulse-6",
    "dayLabel": "오늘의 질문 · 같은 곡 다른 해석",
    "domainId": 5,
    "domainTitle": "음악",
    "questionText": "좋아하는 곡의 두 연주 중 지금 듣고 싶은 쪽은 무엇인가요?",
    "contextNote": "일상 속 가상 상황을 비교하는 편집 질문입니다. 성격 검사나 실제 참여자 통계가 아닙니다.",
    "optionA": {
      "label": "박자가 안정적이고 흐름을 예상하기 쉬운 연주",
      "desc": "반복되는 박을 따라 편안하게 듣고 싶어요.",
      "layer3Weights": {}
    },
    "optionB": {
      "label": "강약과 타이밍 변화가 크게 느껴지는 연주",
      "desc": "익숙한 곡에서도 새로운 긴장과 풀림을 듣고 싶어요.",
      "layer3Weights": {}
    },
    "socialProofNudge": {
      "nudgePrompt": "가상의 상황입니다. 음악을 잘 아는 지인이 변화가 많은 B가 더 좋은 해석이라고 말한다면, 무엇을 들을까요?"
    },
    "yesterdayInsight": {
      "questionSummary": "좋은 연주라는 평가와 지금 듣고 싶은 연주",
      "crowdMajorityText": "전문가의 설명은 놓친 특징을 듣는 데 도움이 될 수 있습니다.",
      "personaDivergenceText": "그 설명을 이해하는 것과 지금 그 연주를 좋아하는 것은 별개의 선택입니다.",
      "keyTakeaway": "관찰실 리듬 실험에서 강조만 바꾼 뒤에도 같은 선택을 하는지 들어 보세요. 위 내용은 편집자의 질문이며 참여자 통계가 아닙니다."
    }
  },
  {
    "id": "daily-pulse-7",
    "dayLabel": "오늘의 질문 · 이야기의 마지막",
    "domainId": 7,
    "domainTitle": "문학",
    "questionText": "소설의 마지막 장을 덮을 때 어떤 여운을 더 좋아하나요?",
    "contextNote": "일상 속 가상 상황을 비교하는 편집 질문입니다. 성격 검사나 실제 참여자 통계가 아닙니다.",
    "optionA": {
      "label": "인물의 선택과 사건이 분명하게 정리되는 결말",
      "desc": "이야기가 어디에 도착했는지 알고 차분하게 마무리하고 싶어요.",
      "layer3Weights": {}
    },
    "optionB": {
      "label": "답을 남겨 두고 여러 해석이 가능한 결말",
      "desc": "책을 덮은 뒤에도 가능한 이야기를 이어 생각하고 싶어요.",
      "layer3Weights": {}
    },
    "socialProofNudge": {
      "nudgePrompt": "가상의 상황입니다. 독서 모임 사람들이 열린 결말 B가 더 깊이 있다고 말한다면, 처음 선택을 유지할까요?"
    },
    "yesterdayInsight": {
      "questionSummary": "해석할 여백과 충분한 설명 사이",
      "crowdMajorityText": "명확한 결말도 인물의 감정을 오래 생각하게 만들 수 있습니다.",
      "personaDivergenceText": "열린 결말은 흥미로울 수도, 아직 필요한 설명이 빠진 것처럼 느껴질 수도 있습니다.",
      "keyTakeaway": "결말 형식만으로 작품의 수준이나 독자의 깊이를 판단하지 말고 실제 경험을 떠올려 보세요. 위 내용은 편집자의 질문이며 참여자 통계가 아닙니다."
    }
  },
  {
    "id": "daily-pulse-8",
    "dayLabel": "오늘의 질문 · 비어 있는 오후",
    "domainId": 8,
    "domainTitle": "여행",
    "questionText": "여행지에서 오후 세 시간이 비었다면 어떻게 보내고 싶나요?",
    "contextNote": "일상 속 가상 상황을 비교하는 편집 질문입니다. 성격 검사나 실제 참여자 통계가 아닙니다.",
    "optionA": {
      "label": "꼭 보고 싶던 장소의 동선과 시간을 정해 방문하기",
      "desc": "짧은 시간 안에 놓치고 싶지 않은 경험을 챙겨요.",
      "layer3Weights": {}
    },
    "optionB": {
      "label": "골목을 걷다가 눈길 가는 곳에 들어가기",
      "desc": "계획하지 않은 장면을 만날 여지를 남겨요.",
      "layer3Weights": {}
    },
    "socialProofNudge": {
      "nudgePrompt": "가상의 상황입니다. 동행이 우연히 찾는 재미가 더 좋다며 B를 권한다면, 어떻게 조율할까요?"
    },
    "yesterdayInsight": {
      "questionSummary": "계획과 우연을 함께 담는 방법",
      "crowdMajorityText": "동선이 정해져 있으면 시간과 체력을 다른 경험에 쓸 수 있습니다.",
      "personaDivergenceText": "빈 시간이 있으면 그날 발견한 관심사를 따라갈 수 있습니다.",
      "keyTakeaway": "반드시 할 한 가지와 비워 둘 시간을 나누면 두 선택을 함께 사용할 수도 있습니다. 위 내용은 편집자의 질문이며 참여자 통계가 아닙니다."
    }
  }
],
];
