'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  clampUnit,
  computeResponseConviction,
  INITIAL_LAYER1_VECTOR,
  INITIAL_LAYER2_VECTOR,
  INITIAL_LAYER3_VECTOR,
  matchDomainPhenotype,
} from './domains-index';
import {
  ChoiceTelemetryEntry,
  CompletedDomainResult,
  CurationFeedbackEntry,
  DailyShiftEntry,
  DemographicProfile,
  Layer1CoreVector,
  Layer2BehavioralVector,
  Layer3AestheticVector,
  MasterDomain,
} from './types';

export interface PersonaState {
  demographics?: DemographicProfile;
  layer1Vector: Layer1CoreVector;
  layer2Vector: Layer2BehavioralVector;
  layer3Vector: Layer3AestheticVector;
  completedDomains: Record<number, CompletedDomainResult>;
  choiceTelemetryLog: ChoiceTelemetryEntry[];
  dailyShiftLog: DailyShiftEntry[];
  curationFeedbackLog: CurationFeedbackEntry[];
}

interface PersonaContextValue {
  state: PersonaState;
  isHydrated: boolean;
  currentUserId: string;
  switchUser: (
    userId: string,
    pin?: string
  ) => Promise<{ ok: boolean; error?: string; isNewUser?: boolean }>;
  logoutToGuest: () => void;
  updateDemographics: (patch: Partial<DemographicProfile>) => void;
  recordQuestionChoice: (payload: {
    domain: MasterDomain;
    answers: {
      questionId: string;
      chosenOption: 'A' | 'B';
      responseTimeMs: number;
    }[];
  }) => CompletedDomainResult;
  recordDailyPulseShift: (payload: {
    pulseId: string;
    phase1Choice: 'A' | 'B';
    phase1ResponseTimeMs: number;
    phase2ChoiceAfterSocialProof: 'A' | 'B';
  }) => void;
  recordCurationFeedback: (payload: {
    curationId: string;
    domainId: number;
    phenotypeId: string;
    reaction: 'resonant' | 'not_me';
  }) => void;
  applyAnchorPresetDemo: () => void;
  resetAllData: () => void;
}

const STORAGE_KEY = 'room_rubato_persona_state_v2';
const CURRENT_USER_KEY = 'room_rubato_current_user_v2';
const CURRENT_PIN_KEY = 'room_rubato_current_pin_v2';

const INITIAL_DEMO_TIMESTAMP = '2026-11-06T09:00:00.000Z';

const ANCHOR_PRESET_STATE: PersonaState = {
  layer1Vector: {
    openness: 0.78,
    conscientiousness: 0.56,
    extraversion: -0.32,
    agreeableness: 0.24,
    neuroticism: -0.35,
    selfTranscendenceVsEnhancement: 0.3,
    opennessVsConservation: 0.72,
  },
  layer2Vector: {
    socialConformity: -0.68,
    authoritySensitivity: -0.42,
    riskAversion: -0.45,
    timeDiscounting: -0.6,
    domainConviction: {
      5: 0.92,
      9: 0.95,
      10: 0.89,
    },
  },
  layer3Vector: {
    complexity: -0.48,
    novelty: 0.64,
    intensity: -0.35,
    conceptualism: 0.82,
    warmth: -0.38,
  },
  completedDomains: {
    5: {
      domainId: 5,
      matchedPhenotypeId: 'mus-sound-architect',
      axisScores: {
        instrumentation: 0.85,
        vocal_focus: 0.9,
        tempo_energy: -0.45,
        listening_device: 0.8,
        mood_tone: 0.85,
      },
      avgResponseTimeMs: 1180,
      convictionScore: 0.92,
      completedAt: INITIAL_DEMO_TIMESTAMP,
    },
    9: {
      domainId: 9,
      matchedPhenotypeId: 'tec-cosmic-architect',
      axisScores: {
        adoption_speed: 0.85,
        analog_digital: 0.75,
        ui_control: 0.8,
        ai_attitude: 0.9,
        curiosity_direction: 0.95,
      },
      avgResponseTimeMs: 1040,
      convictionScore: 0.95,
      completedAt: INITIAL_DEMO_TIMESTAMP,
    },
    10: {
      domainId: 10,
      matchedPhenotypeId: 'eco-intrinsic-craftsman',
      axisScores: {
        risk_return: -0.45,
        spending_value: -0.95,
        quality_frequency: -0.95,
        experience_possession: -0.85,
        planning_horizon: -0.55,
      },
      avgResponseTimeMs: 1320,
      convictionScore: 0.89,
      completedAt: INITIAL_DEMO_TIMESTAMP,
    },
  },
  choiceTelemetryLog: [
    {
      timestamp: INITIAL_DEMO_TIMESTAMP,
      domainId: 5,
      questionId: 'mus-q2',
      chosenOption: 'B',
      responseTimeMs: 1120,
      convictionScore: 0.93,
    },
    {
      timestamp: INITIAL_DEMO_TIMESTAMP,
      domainId: 9,
      questionId: 'tec-q1',
      chosenOption: 'B',
      responseTimeMs: 980,
      convictionScore: 0.95,
    },
    {
      timestamp: INITIAL_DEMO_TIMESTAMP,
      domainId: 10,
      questionId: 'eco-q3',
      chosenOption: 'B',
      responseTimeMs: 1290,
      convictionScore: 0.9,
    },
  ],
  dailyShiftLog: [],
  curationFeedbackLog: [],
};

const BLANK_ROOM_STATE: PersonaState = {
  demographics: {
    gender: 'unspecified',
    ageGroup: 'unspecified',
    occupation: 'unspecified',
  },
  layer1Vector: INITIAL_LAYER1_VECTOR,
  layer2Vector: INITIAL_LAYER2_VECTOR,
  layer3Vector: INITIAL_LAYER3_VECTOR,
  completedDomains: {},
  choiceTelemetryLog: [],
  dailyShiftLog: [],
  curationFeedbackLog: [],
};

const DEFAULT_STATE: PersonaState = BLANK_ROOM_STATE;

function sanitizePersonaState(input: Partial<PersonaState> | null | undefined): PersonaState {
  if (!input || typeof input !== 'object') return DEFAULT_STATE;
  const cleanedCompleted: Record<number, CompletedDomainResult> = {};
  if (input.completedDomains && typeof input.completedDomains === 'object') {
    for (const [k, val] of Object.entries(input.completedDomains)) {
      if (
        val &&
        val.completedAt !== INITIAL_DEMO_TIMESTAMP &&
        val.axisScores &&
        typeof val.axisScores === 'object'
      ) {
        cleanedCompleted[Number(k)] = val;
      }
    }
  }
  const cleanedLog = Array.isArray(input.choiceTelemetryLog)
    ? input.choiceTelemetryLog.filter(
        (entry) => entry && entry.timestamp !== INITIAL_DEMO_TIMESTAMP
      )
    : [];

  return {
    demographics: {
      gender: input.demographics?.gender ?? 'unspecified',
      ageGroup: input.demographics?.ageGroup ?? 'unspecified',
      occupation: input.demographics?.occupation ?? 'unspecified',
    },
    layer1Vector: { ...INITIAL_LAYER1_VECTOR, ...(input.layer1Vector || {}) },
    layer2Vector: {
      ...INITIAL_LAYER2_VECTOR,
      ...(input.layer2Vector || {}),
      domainConviction: { ...(input.layer2Vector?.domainConviction || {}) },
    },
    layer3Vector: { ...INITIAL_LAYER3_VECTOR, ...(input.layer3Vector || {}) },
    completedDomains: cleanedCompleted,
    choiceTelemetryLog: cleanedLog,
    dailyShiftLog: Array.isArray(input.dailyShiftLog) ? input.dailyShiftLog : [],
    curationFeedbackLog: Array.isArray(input.curationFeedbackLog)
      ? input.curationFeedbackLog
      : [],
  };
}

const PersonaContext = createContext<PersonaContextValue | null>(null);

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersonaState>(DEFAULT_STATE);
  const [currentUserId, setCurrentUserId] = useState<string>('게스트');
  const [currentPin, setCurrentPin] = useState<string>('');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let activeUser = '게스트';
    let savedPin = '';
    try {
      const savedUser = localStorage.getItem(CURRENT_USER_KEY)?.trim();
      savedPin = localStorage.getItem(CURRENT_PIN_KEY)?.trim() || '';
      if (savedUser) {
        activeUser = savedUser;
        setCurrentUserId(savedUser);
        setCurrentPin(savedPin);
      }
      const userStorageKey = `${STORAGE_KEY}_${activeUser}`;
      const raw =
        localStorage.getItem(userStorageKey) ??
        localStorage.getItem(STORAGE_KEY) ??
        localStorage.getItem('room_rubato_persona_state_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        setState(sanitizePersonaState(parsed));
      }
    } catch (e) {
      console.error('Failed to load persona state:', e);
    }

    if (activeUser === '게스트') {
      setIsHydrated(true);
      return;
    }

    fetch(
      `/api/users?userId=${encodeURIComponent(activeUser)}&pin=${encodeURIComponent(savedPin)}`
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user?.state) {
          setState(sanitizePersonaState(data.user.state));
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsHydrated(true);
      });
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      const userStorageKey = `${STORAGE_KEY}_${currentUserId}`;
      localStorage.setItem(userStorageKey, JSON.stringify(state));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      localStorage.setItem(CURRENT_USER_KEY, currentUserId);
      if (currentPin) {
        localStorage.setItem(CURRENT_PIN_KEY, currentPin);
      }
    } catch (e) {
      console.error('Failed to save persona state:', e);
    }

    // 게스트 모드는 브라우저 로컬에만 저장하여 타 방문자와 섞이지 않도록 보호
    if (currentUserId === '게스트') return;

    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUserId,
        pin: currentPin,
        state,
      }),
    }).catch(() => {});
  }, [state, currentUserId, currentPin, isHydrated]);

  const switchUser: PersonaContextValue['switchUser'] = async (
    nextUserId,
    pin = ''
  ) => {
    const cleanId = nextUserId.trim();
    const cleanPin = pin.trim();
    if (!cleanId) {
      return { ok: false, error: '별칭을 입력해 주세요.' };
    }
    if (cleanPin && !/^\d{4}$/.test(cleanPin)) {
      return { ok: false, error: 'PIN 번호는 숫자 4자리로 입력해 주세요.' };
    }

    try {
      const res = await fetch(
        `/api/users?userId=${encodeURIComponent(cleanId)}&pin=${encodeURIComponent(cleanPin)}`
      );
      const data = await res.json();

      if (!res.ok) {
        return {
          ok: false,
          error:
            data?.error ||
            '별칭을 불러오지 못했습니다. PIN 번호를 확인해 주세요.',
        };
      }

      setCurrentUserId(cleanId);
      setCurrentPin(cleanPin);
      localStorage.setItem(CURRENT_USER_KEY, cleanId);
      if (cleanPin) {
        localStorage.setItem(CURRENT_PIN_KEY, cleanPin);
      }

      if (data?.user?.state) {
        setState(sanitizePersonaState(data.user.state));
        return { ok: true, isNewUser: false };
      }

      // 신규 별칭인 경우: 현재 게스트 상태에서 진행하던 데이터가 있으면 그대로 이어받아 저장
      return { ok: true, isNewUser: true };
    } catch {
      return {
        ok: false,
        error: '서버 연결 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      };
    }
  };

  const logoutToGuest = () => {
    setCurrentUserId('게스트');
    setCurrentPin('');
    try {
      localStorage.setItem(CURRENT_USER_KEY, '게스트');
      localStorage.removeItem(CURRENT_PIN_KEY);
    } catch {}
  };

  const updateDemographics = (patch: Partial<DemographicProfile>) => {
    setState((prev) => ({
      ...prev,
      demographics: {
        ...(prev.demographics || {
          gender: 'unspecified',
          ageGroup: 'unspecified',
          occupation: 'unspecified',
        }),
        ...patch,
      },
    }));
  };

  const recordQuestionChoice: PersonaContextValue['recordQuestionChoice'] = ({
    domain,
    answers,
  }) => {
    const axisRawSums: Record<string, number> = {};
    const axisWeightTotals: Record<string, number> = {};
    domain.axes.forEach((ax) => {
      axisRawSums[ax.axisKey] = 0;
      axisWeightTotals[ax.axisKey] = 0;
    });

    const nextL1 = { ...state.layer1Vector };
    const nextL2 = {
      ...state.layer2Vector,
      domainConviction: { ...state.layer2Vector.domainConviction },
    };
    const nextL3 = { ...state.layer3Vector };

    const newTelemetry: ChoiceTelemetryEntry[] = [];
    let totalRt = 0;

    for (const ans of answers) {
      const q = domain.questions.find((item) => item.id === ans.questionId);
      if (!q) continue;

      const opt = ans.chosenOption === 'A' ? q.optionA : q.optionB;
      if (opt.axisWeights && Object.keys(opt.axisWeights).length > 0) {
        for (const [axKey, w] of Object.entries(opt.axisWeights)) {
          axisRawSums[axKey] = (axisRawSums[axKey] ?? 0) + w;
          axisWeightTotals[axKey] =
            (axisWeightTotals[axKey] ?? 0) + Math.abs(w);
        }
      } else {
        axisRawSums[q.axisKey] = (axisRawSums[q.axisKey] ?? 0) + opt.axisWeight;
        axisWeightTotals[q.axisKey] =
          (axisWeightTotals[q.axisKey] ?? 0) + Math.abs(opt.axisWeight);
      }

      totalRt += ans.responseTimeMs;
      const qConviction = computeResponseConviction(ans.responseTimeMs);

      const stepScale =
        (0.75 / Math.max(3, domain.questions.length)) *
        (0.5 + 0.5 * qConviction);

      if (opt.layer3Weights) {
        (Object.keys(opt.layer3Weights) as (keyof Layer3AestheticVector)[]).forEach(
          (k) => {
            const delta = opt.layer3Weights?.[k] ?? 0;
            nextL3[k] = clampUnit(nextL3[k] + delta * stepScale);
          }
        );
      }

      if (opt.layer1Weights) {
        (Object.keys(opt.layer1Weights) as (keyof Layer1CoreVector)[]).forEach(
          (k) => {
            const delta = opt.layer1Weights?.[k] ?? 0;
            nextL1[k] = clampUnit(nextL1[k] + delta * stepScale);
          }
        );
      }

      if (opt.layer2Weights) {
        (
          Object.keys(opt.layer2Weights) as (keyof Omit<
            Layer2BehavioralVector,
            'domainConviction'
          >)[]
        ).forEach((k) => {
          const delta = opt.layer2Weights?.[k] ?? 0;
          nextL2[k] = clampUnit(nextL2[k] + delta * stepScale);
        });
      }

      newTelemetry.push({
        timestamp: new Date().toISOString(),
        domainId: domain.id,
        questionId: q.id,
        chosenOption: ans.chosenOption,
        responseTimeMs: ans.responseTimeMs,
        convictionScore: qConviction,
      });
    }

    const axisScores: Record<string, number> = {};
    domain.axes.forEach((ax) => {
      const denom = axisWeightTotals[ax.axisKey] || 1;
      axisScores[ax.axisKey] = clampUnit(axisRawSums[ax.axisKey] / denom);
    });

    const avgRt =
      answers.length > 0 ? Math.round(totalRt / answers.length) : 2000;
    const domainConvictionScore = computeResponseConviction(avgRt);
    nextL2.domainConviction[domain.id] = domainConvictionScore;

    const matched = matchDomainPhenotype(domain, axisScores);

    const completedResult: CompletedDomainResult = {
      domainId: domain.id,
      matchedPhenotypeId: matched.id,
      axisScores,
      avgResponseTimeMs: avgRt,
      convictionScore: domainConvictionScore,
      completedAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      layer1Vector: nextL1,
      layer2Vector: nextL2,
      layer3Vector: nextL3,
      completedDomains: {
        ...prev.completedDomains,
        [domain.id]: completedResult,
      },
      choiceTelemetryLog: [...prev.choiceTelemetryLog, ...newTelemetry],
    }));

    return completedResult;
  };

  const recordDailyPulseShift: PersonaContextValue['recordDailyPulseShift'] = ({
    pulseId,
    phase1Choice,
    phase1ResponseTimeMs,
    phase2ChoiceAfterSocialProof,
  }) => {
    const didShift = phase1Choice !== phase2ChoiceAfterSocialProof;
    const entry: DailyShiftEntry = {
      timestamp: new Date().toISOString(),
      pulseId,
      phase1Choice,
      phase1ResponseTimeMs,
      phase2ChoiceAfterSocialProof,
      didShift,
    };

    setState((prev) => {
      const conformityDelta = didShift ? 0.25 : -0.25;
      return {
        ...prev,
        layer2Vector: {
          ...prev.layer2Vector,
          socialConformity: clampUnit(
            prev.layer2Vector.socialConformity + conformityDelta
          ),
        },
        dailyShiftLog: [...prev.dailyShiftLog, entry],
      };
    });
  };

  const recordCurationFeedback: PersonaContextValue['recordCurationFeedback'] =
    ({ curationId, domainId, phenotypeId, reaction }) => {
      const entry: CurationFeedbackEntry = {
        timestamp: new Date().toISOString(),
        curationId,
        domainId,
        phenotypeId,
        reaction,
      };
      setState((prev) => ({
        ...prev,
        curationFeedbackLog: [
          ...prev.curationFeedbackLog.filter(
            (f) => f.curationId !== curationId
          ),
          entry,
        ],
      }));
    };

  const applyAnchorPresetDemo = () => {
    const now = new Date().toISOString();
    const demoState: PersonaState = {
      ...ANCHOR_PRESET_STATE,
      demographics: state.demographics || {
        gender: 'unspecified',
        ageGroup: 'unspecified',
        occupation: 'unspecified',
      },
      completedDomains: {
        5: {
          ...ANCHOR_PRESET_STATE.completedDomains[5],
          completedAt: now,
        },
        9: {
          ...ANCHOR_PRESET_STATE.completedDomains[9],
          completedAt: now,
        },
        10: {
          ...ANCHOR_PRESET_STATE.completedDomains[10],
          completedAt: now,
        },
      },
      choiceTelemetryLog: ANCHOR_PRESET_STATE.choiceTelemetryLog.map((item) => ({
        ...item,
        timestamp: now,
      })),
    };
    setState(demoState);
  };

  const resetAllData = () => {
    setState(BLANK_ROOM_STATE);
  };

  return (
    <PersonaContext.Provider
      value={{
        state,
        isHydrated,
        currentUserId,
        switchUser,
        logoutToGuest,
        updateDemographics,
        recordQuestionChoice,
        recordDailyPulseShift,
        recordCurationFeedback,
        applyAnchorPresetDemo,
        resetAllData,
      }}
    >
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersonaStore(): PersonaContextValue {
  const ctx = useContext(PersonaContext);
  if (!ctx) {
    throw new Error('usePersonaStore must be used within PersonaProvider');
  }
  return ctx;
}
