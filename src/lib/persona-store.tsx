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
import { isSupabaseConfigured, supabase } from './supabase';

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

export interface AuthSessionUser {
  userUuid: string;
  maskedEmail: string;
  provider: 'google' | 'email';
}

interface PersonaContextValue {
  state: PersonaState;
  isHydrated: boolean;
  currentUserId: string;
  authUser: AuthSessionUser | null;
  loginWithEmail: (payload: {
    email: string;
    password: string;
    consentAgreed: boolean;
    demographics?: DemographicProfile;
  }) => Promise<{ ok: boolean; error?: string; isNewUser?: boolean }>;
  loginWithGoogle: (payload: {
    googleEmail?: string;
    consentAgreed: boolean;
    demographics?: DemographicProfile;
  }) => Promise<{ ok: boolean; error?: string; isNewUser?: boolean }>;
  logoutToGuest: () => Promise<void>;
  deleteAccountAndData: () => Promise<{ ok: boolean; error?: string }>;
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
const AUTH_SESSION_KEY = 'room_rubato_auth_session_v3';

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
  const [authUser, setAuthUser] = useState<AuthSessionUser | null>(null);
  const [sessionToken, setSessionToken] = useState<string>('');
  const [isHydrated, setIsHydrated] = useState(false);

  const currentUserId = authUser ? authUser.maskedEmail : '게스트';

  useEffect(() => {
    let savedSession: {
      userUuid: string;
      maskedEmail: string;
      provider: 'google' | 'email';
      sessionToken: string;
    } | null = null;

    try {
      const rawSession = localStorage.getItem(AUTH_SESSION_KEY);
      if (rawSession) {
        savedSession = JSON.parse(rawSession);
        if (savedSession?.userUuid && savedSession?.sessionToken) {
          setAuthUser({
            userUuid: savedSession.userUuid,
            maskedEmail: savedSession.maskedEmail,
            provider: savedSession.provider,
          });
          setSessionToken(savedSession.sessionToken);
        }
      }

      const storageKey = savedSession?.userUuid
        ? `${STORAGE_KEY}_${savedSession.userUuid}`
        : STORAGE_KEY;
      const rawState =
        localStorage.getItem(storageKey) ??
        localStorage.getItem(STORAGE_KEY) ??
        localStorage.getItem('room_rubato_persona_state_v1');
      if (rawState) {
        setState(sanitizePersonaState(JSON.parse(rawState)));
      }
    } catch (e) {
      console.error('Failed to load persona state:', e);
    }

    // Supabase Auth 세션 확인 (설정된 경우)
    const sb = supabase;
    if (isSupabaseConfigured && sb) {
      sb.auth
        .getSession()
        .then(async ({ data: { session } }) => {
          if (session?.user) {
            const uid = session.user.id;
            const email = session.user.email || 'user@google.com';
            const [local, domain] = email.split('@');
            const masked = `${(local || 'u').slice(0, 2)}***@${domain || 'auth'}`;
            const prov =
              session.user.app_metadata?.provider === 'google'
                ? 'google'
                : 'email';
            setAuthUser({ userUuid: uid, maskedEmail: masked, provider: prov });

            const { data: row } = await sb
              .from('persona_profiles')
              .select('state')
              .eq('user_id', uid)
              .single();
            if (row?.state) {
              setState(sanitizePersonaState(row.state as Partial<PersonaState>));
            }
          }
        })
        .catch(() => {})
        .finally(() => setIsHydrated(true));
      return;
    }

    if (!savedSession?.userUuid || !savedSession?.sessionToken) {
      setIsHydrated(true);
      return;
    }

    fetch(
      `/api/users?userUuid=${encodeURIComponent(savedSession.userUuid)}`,
      {
        headers: {
          'x-session-token': savedSession.sessionToken,
        },
      }
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
      const storageKey = authUser?.userUuid
        ? `${STORAGE_KEY}_${authUser.userUuid}`
        : STORAGE_KEY;
      localStorage.setItem(storageKey, JSON.stringify(state));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save persona state:', e);
    }

    // 비로그인 게스트 모드는 브라우저 로컬에만 저장
    if (!authUser?.userUuid) return;

    // 1) Supabase 연동 시 public.persona_profiles 테이블에 익명 UUID로만 저장
    if (isSupabaseConfigured && supabase) {
      const completedCount = Object.keys(state.completedDomains).length;
      supabase
        .from('persona_profiles')
        .upsert({
          user_id: authUser.userUuid,
          gender: state.demographics?.gender || 'unspecified',
          age_group: state.demographics?.ageGroup || 'unspecified',
          occupation: state.demographics?.occupation || 'unspecified',
          completed_count: completedCount,
          state,
          updated_at: new Date().toISOString(),
        })
        .then(() => {});
      return;
    }

    // 2) 기본 서버 Vault 모드: 이메일 없이 오직 userUuid + sessionToken으로만 취향 프로필 동기화
    if (!sessionToken) return;
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sync',
        userUuid: authUser.userUuid,
        sessionToken,
        state,
      }),
    }).catch(() => {});
  }, [state, authUser, sessionToken, isHydrated]);

  const loginWithEmail: PersonaContextValue['loginWithEmail'] = async ({
    email,
    password,
    consentAgreed,
    demographics,
  }) => {
    const nextState: PersonaState = demographics
      ? {
          ...state,
          demographics: {
            ...(state.demographics || {}),
            ...demographics,
          },
        }
      : state;

    if (isSupabaseConfigured && supabase) {
      // 먼저 로그인 시도 후 계정이 없으면 회원가입 진행
      const signInRes = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInRes.error) {
        if (!consentAgreed) {
          return {
            ok: false,
            error:
              '신규 가입 시 [필수] 개인정보 및 비식별 취향 데이터 수집·이용에 동의해 주세요.',
          };
        }
        const signUpRes = await supabase.auth.signUp({ email, password });
        if (signUpRes.error || !signUpRes.data.user) {
          return {
            ok: false,
            error: signUpRes.error?.message || '회원가입에 실패했습니다.',
          };
        }
        const uid = signUpRes.data.user.id;
        const [local, domain] = email.split('@');
        const masked = `${(local || 'u').slice(0, 2)}***@${domain || 'auth'}`;
        setAuthUser({ userUuid: uid, maskedEmail: masked, provider: 'email' });
        setState(nextState);
        return { ok: true, isNewUser: true };
      }

      const uid = signInRes.data.user.id;
      const [local, domain] = email.split('@');
      const masked = `${(local || 'u').slice(0, 2)}***@${domain || 'auth'}`;
      setAuthUser({ userUuid: uid, maskedEmail: masked, provider: 'email' });
      const { data: row } = await supabase
        .from('persona_profiles')
        .select('state')
        .eq('user_id', uid)
        .single();
      if (row?.state) {
        setState(sanitizePersonaState(row.state as Partial<PersonaState>));
      } else {
        setState(nextState);
      }
      return { ok: true, isNewUser: false };
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'auth',
          provider: 'email',
          email,
          password,
          consentAgreed,
          state: nextState,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          ok: false,
          error: data?.error || '로그인에 실패했습니다.',
        };
      }

      const sessionObj = {
        userUuid: data.userUuid,
        maskedEmail: data.maskedEmail,
        provider: 'email' as const,
        sessionToken: data.sessionToken,
      };
      setAuthUser({
        userUuid: sessionObj.userUuid,
        maskedEmail: sessionObj.maskedEmail,
        provider: 'email',
      });
      setSessionToken(sessionObj.sessionToken);
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionObj));

      if (data?.state) {
        setState(sanitizePersonaState(data.state));
      } else {
        setState(nextState);
      }

      return { ok: true, isNewUser: Boolean(data.isNewUser) };
    } catch {
      return { ok: false, error: '서버 연결 중 오류가 발생했습니다.' };
    }
  };

  const loginWithGoogle: PersonaContextValue['loginWithGoogle'] = async ({
    googleEmail,
    consentAgreed,
    demographics,
  }) => {
    const nextState: PersonaState = demographics
      ? {
          ...state,
          demographics: {
            ...(state.demographics || {}),
            ...demographics,
          },
        }
      : state;

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo:
            typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });
      if (error) {
        return { ok: false, error: error.message };
      }
      return { ok: true };
    }

    const emailToUse = (googleEmail || '').trim().toLowerCase();
    if (!emailToUse || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToUse)) {
      return {
        ok: false,
        error: '연결할 Google 계정 이메일 주소를 입력해 주세요.',
      };
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'auth',
          provider: 'google',
          email: emailToUse,
          consentAgreed,
          state: nextState,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          ok: false,
          error: data?.error || 'Google 로그인 처리에 실패했습니다.',
        };
      }

      const sessionObj = {
        userUuid: data.userUuid,
        maskedEmail: data.maskedEmail,
        provider: 'google' as const,
        sessionToken: data.sessionToken,
      };
      setAuthUser({
        userUuid: sessionObj.userUuid,
        maskedEmail: sessionObj.maskedEmail,
        provider: 'google',
      });
      setSessionToken(sessionObj.sessionToken);
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionObj));

      if (data?.state) {
        setState(sanitizePersonaState(data.state));
      } else {
        setState(nextState);
      }

      return { ok: true, isNewUser: Boolean(data.isNewUser) };
    } catch {
      return { ok: false, error: '서버 연결 중 오류가 발생했습니다.' };
    }
  };

  const logoutToGuest = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    setAuthUser(null);
    setSessionToken('');
    try {
      localStorage.removeItem(AUTH_SESSION_KEY);
    } catch {}
  };

  const deleteAccountAndData: PersonaContextValue['deleteAccountAndData'] =
    async () => {
      if (!authUser) {
        setState(BLANK_ROOM_STATE);
        return { ok: true };
      }

      try {
        if (isSupabaseConfigured && supabase) {
          await supabase
            .from('persona_profiles')
            .delete()
            .eq('user_id', authUser.userUuid);
          await supabase.auth.signOut();
        } else if (sessionToken) {
          const res = await fetch('/api/users', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userUuid: authUser.userUuid,
              sessionToken,
            }),
          });
          if (!res.ok) {
            return { ok: false, error: '데이터 파기 요청에 실패했습니다.' };
          }
        }

        localStorage.removeItem(`${STORAGE_KEY}_${authUser.userUuid}`);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(AUTH_SESSION_KEY);
        setAuthUser(null);
        setSessionToken('');
        setState(BLANK_ROOM_STATE);
        return { ok: true };
      } catch {
        return { ok: false, error: '삭제 중 오류가 발생했습니다.' };
      }
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
        authUser,
        loginWithEmail,
        loginWithGoogle,
        logoutToGuest,
        deleteAccountAndData,
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
