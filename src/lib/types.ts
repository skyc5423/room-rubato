export interface Layer1CoreVector {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  selfTranscendenceVsEnhancement: number;
  opennessVsConservation: number;
}

export interface Layer2BehavioralVector {
  socialConformity: number;
  authoritySensitivity: number;
  riskAversion: number;
  timeDiscounting: number;
  domainConviction: Record<number, number>;
}

export interface Layer3AestheticVector {
  complexity: number;
  novelty: number;
  intensity: number;
  conceptualism: number;
  warmth: number;
}

export interface DomainAxisDefinition {
  axisKey: string;
  leftLabel: string;
  rightLabel: string;
}

export interface CurationItem {
  id: string;
  category: string;
  title: string;
  reason: string;
  tags: string[];
}

export interface DomainPhenotype {
  id: string;
  name: string;
  englishCode: string;
  axisSignature: Record<string, number>;
  layer3Signature: Partial<Layer3AestheticVector>;
  summary: string;
  deepAnalysis: string;
  decisionGuide: string[];
  curations: CurationItem[];
}

export interface ContrastOption {
  title: string;
  description: string;
  visualTone: string;
  axisWeight: number;
  axisWeights?: Record<string, number>;
  layer3Weights?: Partial<Layer3AestheticVector>;
  layer2Weights?: Partial<Omit<Layer2BehavioralVector, 'domainConviction'>>;
  layer1Weights?: Partial<Layer1CoreVector>;
}

export interface ContrastQuestion {
  id: string;
  axisKey: string;
  prompt: string;
  contextHint: string;
  optionA: ContrastOption;
  optionB: ContrastOption;
}

export interface MasterDomain {
  id: number;
  slug: string;
  pillarId: 1 | 2 | 3;
  pillarName: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  iconName: string;
  accentColor: string;
  anchorExampleForUser?: boolean;
  axes: DomainAxisDefinition[];
  questions: ContrastQuestion[];
  phenotypes: DomainPhenotype[];
}

export interface CompletedDomainResult {
  domainId: number;
  matchedPhenotypeId: string;
  axisScores: Record<string, number>;
  avgResponseTimeMs: number;
  convictionScore: number;
  completedAt: string;
}

export interface ChoiceTelemetryEntry {
  timestamp: string;
  domainId: number;
  questionId: string;
  chosenOption: 'A' | 'B';
  responseTimeMs: number;
  convictionScore: number;
}

export interface DailyShiftEntry {
  timestamp: string;
  pulseId: string;
  phase1Choice: 'A' | 'B';
  phase1ResponseTimeMs: number;
  phase2ChoiceAfterSocialProof: 'A' | 'B';
  didShift: boolean;
}

export interface CurationFeedbackEntry {
  timestamp: string;
  curationId: string;
  domainId: number;
  phenotypeId: string;
  reaction: 'resonant' | 'not_me';
}

export interface DemographicProfile {
  gender?: 'female' | 'male' | 'other' | 'unspecified';
  ageGroup?:
    | '10s'
    | '20s_early'
    | '20s_late'
    | '30s_early'
    | '30s_late'
    | '40s'
    | '50s_plus'
    | 'unspecified';
  occupation?:
    | 'tech_product'
    | 'design_art'
    | 'business_office'
    | 'research_edu'
    | 'freelance_creator'
    | 'other'
    | 'unspecified';
}

export interface DailyPulseQuestion {
  id: string;
  dayLabel: string;
  domainId: number;
  domainTitle: string;
  questionText: string;
  contextNote: string;
  optionA: {
    label: string;
    desc: string;
    layer3Weights: Partial<Layer3AestheticVector>;
    layer2Weights?: Partial<Omit<Layer2BehavioralVector, 'domainConviction'>>;
  };
  optionB: {
    label: string;
    desc: string;
    layer3Weights: Partial<Layer3AestheticVector>;
    layer2Weights?: Partial<Omit<Layer2BehavioralVector, 'domainConviction'>>;
  };
  socialProofNudge: {
    majorityOption: 'A' | 'B';
    majorityPercent: number;
    contrarianPhenotypeName: string;
    contrarianOption: 'A' | 'B';
    contrarianPercent: number;
    nudgePrompt: string;
  };
  yesterdayInsight: {
    questionSummary: string;
    crowdMajorityText: string;
    personaDivergenceText: string;
    keyTakeaway: string;
  };
}
