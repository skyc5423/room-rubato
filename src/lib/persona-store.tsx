'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { isEmailSignupEnabled, EMAIL_SIGNUP_PAUSED_MESSAGE } from './auth-availability';
import { derivePersonaVectors } from './persona-scoring';
import { saveProfileCAS, type ProfileWrite } from './profile-cas';

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
  syncError: string | null;
  retrySync: () => void;
  reloadServerProfile: () => Promise<void>;
  syncConflict: boolean;
  recoveryDraft: PersonaState | null;
  clearRecoveryDraft: () => void;
  authUser: AuthSessionUser | null;
  loginWithEmail: (payload: {
    email: string;
    password: string;
    mode?: 'signin' | 'signup';
    consentAgreed: boolean;
    demographics?: DemographicProfile;
  }) => Promise<{ ok: boolean; error?: string; isNewUser?: boolean; needsEmailConfirmation?: boolean }>;
  loginWithGoogle: (payload: {
    googleEmail?: string;
    consentAgreed: boolean;
    demographics?: DemographicProfile;
  }) => Promise<{ ok: boolean; error?: string; isNewUser?: boolean; needsEmailConfirmation?: boolean }>;
  logoutToGuest: () => Promise<{ ok: boolean; error?: string }>;
  deletePersonaData: () => Promise<{ ok: boolean; error?: string }>;
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

// Never reuse the legacy shared key: it may contain another account's data.
const STORAGE_KEY = 'room_rubato_guest_state_v4';
const CONSENT_KEY = 'room_rubato_pending_consent_v1';
const CONSENT_VERSION = '2026-11-10';
const AUTH_SESSION_KEY = 'room_rubato_auth_session_v3';
// Enable only after CAS schema + permission cutover have been verified.
const CAS_ENABLED = process.env.NEXT_PUBLIC_PERSONA_CAS_ENABLED === 'true';
const draftKey = (uid: string) => `room_rubato_unsaved_profile_v1:${uid}`;

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
  const [isHydrated, setIsHydrated] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncConflict, setSyncConflict] = useState(false);
  const [recoveryDraft, setRecoveryDraft] = useState<PersonaState | null>(null);
  const revision = useRef<string | null>(null);
  const pendingWrite = useRef<{ write: ProfileWrite; serialized: string; reset?: boolean } | null>(null);
  const blocked = useRef(false);
  const [reloadToken, setReloadToken] = useState(0);
  const owner = useRef<string | null>(null);
  const generation = useRef(0);
  const lastSaved = useRef('');
  const writes = useRef<Promise<void>>(Promise.resolve());
  const paused = useRef(false);
  const consent = useRef<string | null>(null);
  const currentUserId = authUser ? authUser.maskedEmail : '게스트';

  const loadGuest = () => {
    try {
      return sanitizePersonaState(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'));
    } catch { return DEFAULT_STATE; }
  };

  useEffect(() => {
    let alive = true;
    const sb = supabase;
    // Old demo sessions are not proof of authentication.
    try { localStorage.removeItem(AUTH_SESSION_KEY); } catch { /* Storage may be unavailable. */ }
    const hydrate = async (session: Session | null) => {
      const id = ++generation.current;
      owner.current = null;
      consent.current = null;
      revision.current = null; pendingWrite.current = null; blocked.current = false;
      setSyncConflict(false); setRecoveryDraft(null);
      setIsHydrated(false);
      setAuthUser(null);
      setState(DEFAULT_STATE);
      setSyncError(null);
      if (!session?.user || !sb) {
        if (alive) {
          const guest = loadGuest();
          lastSaved.current = JSON.stringify(guest);
          setState(guest);
          setIsHydrated(true);
        }
        return;
      }
      const user = session.user;
      try {
        const { data: row, error } = await sb.from('persona_profiles')
          .select('*').eq('user_id', user.id).maybeSingle();
        if (error) throw error;
        if (!alive || id !== generation.current) return;
        let agreedAt = row?.consent_agreed_at || user.user_metadata?.consent_agreed_at;
        if (!agreedAt) {
          try {
            const pending = JSON.parse(sessionStorage.getItem(CONSENT_KEY) || 'null');
            if (pending?.version === CONSENT_VERSION && Date.now() - Date.parse(pending.at) < 15 * 60 * 1000) agreedAt = pending.at;
          } catch { /* No valid pending consent. */ }
        }
        if (!agreedAt) throw new Error('동의 기록을 확인할 수 없습니다. 로그아웃 후 동의하고 다시 로그인해 주세요.');
        // OAuth accounts need a durable consent record even before their first
        // response and after profile reset. This metadata is NOT authorization.
        if (!user.user_metadata?.consent_agreed_at) {
          const { error: consentError } = await sb.auth.updateUser({ data: {
            consent_agreed_at: agreedAt, consent_version: CONSENT_VERSION,
          } });
          if (consentError) throw consentError;
          if (!alive || id !== generation.current) return;
        }
        try { sessionStorage.removeItem(CONSENT_KEY); } catch { /* Optional storage. */ }
        consent.current = agreedAt;
        // Never silently migrate a shared browser's guest profile into an account.
        const loaded = sanitizePersonaState(row?.state);
        lastSaved.current = JSON.stringify(loaded);
        owner.current = user.id;
        revision.current = row?.revision || null;
        if (CAS_ENABLED) {
          try {
            const draft = localStorage.getItem(draftKey(user.id));
            if (draft && draft !== lastSaved.current) setRecoveryDraft(sanitizePersonaState(JSON.parse(draft)));
            else if (draft) localStorage.removeItem(draftKey(user.id));
          } catch { /* Recovery is best effort, never replaces the server profile. */ }
        }
        setState(loaded);
        const [local, domain] = (user.email || 'user@auth').split('@');
        setAuth…93 tokens truncated…main] = (user.email || 'user@auth').split('@');
        setAuthUser({ userUuid: user.id, maskedEmail: `${local.slice(0, 2)}***@${domain}`, provider: user.app_metadata?.provider === 'google' ? 'google' : 'email' });
        setSyncError(error instanceof Error ? error.message : '프로필을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.');
        // Fail closed: no writes after failed profile loading.
        setIsHydrated(false);
      }
    };
    if (!sb) { void hydrate(null); return () => { alive = false; }; }
    // The callback must remain synchronous: Supabase calls here can deadlock.
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      if (event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED' || (event === 'SIGNED_IN' && session?.user.id === owner.current)) return;
      owner.current = null;
      ++generation.current;
      setRecoveryDraft(null); setSyncConflict(false); setSyncError(null);
      setIsHydrated(false);
      setAuthUser(null);
      setState(DEFAULT_STATE);
      setTimeout(() => { if (alive) void hydrate(session); }, 0);
    });
    return () => { alive = false; ++generation.current; subscription.unsubscribe(); };
  }, [reloadToken]);

  useEffect(() => {
    if (!isHydrated || paused.current) return;
    if (!authUser) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
      catch { setSyncError('브라우저 저장 공간에 저장하지 못했습니다.'); }
      return;
    }
    const sb = supabase;
    const uid = authUser.userUuid;
    const serialized = JSON.stringify(state);
    if (!sb || owner.current !== uid || serialized === lastSaved.current) return;
    const id = generation.current;
    const agreedAt = consent.current;
    if (CAS_ENABLED) {
      try { localStorage.setItem(draftKey(uid), serialized); } catch { /* Export remains available in memory. */ }
    }
    // Serialize writes so a slow earlier request cannot overwrite a newer state.
    writes.current = writes.current.then(async () => {
      if (id !== generation.current || owner.current !== uid) return;
      if (CAS_ENABLED) {
        if (blocked.current) return;
        const write: ProfileWrite = { ownerId: uid!, expectedRevision: revision.current, writeId: crypto.randomUUID(), state: state as unknown as Record<string, unknown>, consentAgreedAt: agreedAt!, consentVersion: CONSENT_VERSION };
        pendingWrite.current = { write, serialized };
        const result = await saveProfileCAS((name, args) => sb.rpc(name, args), write);
        if (id !== generation.current || owner.current !== uid) return;
        if (result.status === 'saved') {
          revision.current = result.revision; pendingWrite.current = null;
          lastSaved.current = serialized; setSyncError(null);
          try { if (localStorage.getItem(draftKey(uid)) === serialized) localStorage.removeItem(draftKey(uid)); } catch { /* Optional recovery cache. */ }
        } else {
          blocked.current = true; setSyncConflict(result.status === 'conflict');
          setSyncError(result.status === 'conflict' ? '다른 기기에서 기록이 바뀌었어요. 덮어쓰지 않고 저장을 멈췄어요. 이 기기의 기록을 내려받은 뒤 서버 기록을 불러와 주세요.' : '서버 저장 실패: ' + result.message);
        }
        return;
      }
      const { error } = await sb.from('persona_profiles').upsert({
        user_id: uid, state,
        gender: state.demographics?.gender || 'unspecified',
        age_group: state.demographics?.ageGroup || 'unspecified',
        occupation: state.demographics?.occupation || 'unspecified',
        completed_count: Object.keys(state.completedDomains).length,
        consent_agreed_at: agreedAt, consent_version: CONSENT_VERSION,
        updated_at: new Date().toISOString(),
      });
      if (id !== generation.current) return;
      if (error) setSyncError('서버 저장 실패: ' + error.message);
      else { lastSaved.current = serialized; setSyncError(null); }
    }).catch(() => { setSyncError('서버 연결에 실패해 변경 내용을 저장하지 못했습니다.'); });
  }, [state, authUser, isHydrated]);

  const loginWithEmail: PersonaContextValue['loginWithEmail'] = async ({ email, password, consentAgreed, mode = 'signin' }) => {
    if (!supabase) return { ok: false, error: '로그인 서비스가 아직 설정되지 않았습니다. 게스트 모드만 이용할 수 있습니다.' };
    try {
      if (mode === 'signup') {
        if (!isEmailSignupEnabled()) return { ok: false, error: EMAIL_SIGNUP_PAUSED_MESSAGE };
        if (!consentAgreed) return { ok: false, error: '신규 가입에는 개인정보 수집·이용 동의가 필요합니다.' };
        const { data, error } = await supabase.auth.signUp({ email, password, options: {
          emailRedirectTo: window.location.origin,
          data: { consent_agreed_at: new Date().toISOString(), consent_version: CONSENT_VERSION },
        } });
        if (error) return { ok: false, error: error.message };
        // A user without a session is NOT logged in (email verification enabled).
        return { ok: true, isNewUser: true, needsEmailConfirmation: !data.session };
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? { ok: false, error: error.message } : { ok: true };
    } catch { return { ok: false, error: '인증 서버에 연결하지 못했습니다.' }; }
  };

  const loginWithGoogle: PersonaContextValue['loginWithGoogle'] = async ({ consentAgreed }) => {
    if (!supabase) return { ok: false, error: '로그인 서비스가 아직 설정되지 않았습니다.' };
    if (!consentAgreed) return { ok: false, error: '개인정보 수집·이용에 동의해 주세요.' };
    try {
      sessionStorage.setItem(CONSENT_KEY, JSON.stringify({ version: CONSENT_VERSION, at: new Date().toISOString() }));
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
      if (error) { sessionStorage.removeItem(CONSENT_KEY); return { ok: false, error: error.message }; }
      return { ok: true };
    } catch { return { ok: false, error: 'Google 인증을 시작하지 못했습니다.' }; }
  };

  const logoutToGuest: PersonaContextValue['logoutToGuest'] = async () => {
    const id = generation.current;
    paused.current = true;
    await writes.current;
    try {
      if (id !== generation.current) return { ok: false, error: '계정이 변경되어 로그아웃을 취소했습니다.' };
      if (supabase) {
        const { error } = await supabase.auth.signOut({ scope: 'local' });
        if (error) return { ok: false, error: error.message };
      }
      ++generation.current;
      owner.current = null;
      setRecoveryDraft(null); setSyncConflict(false); setSyncError(null);
      setAuthUser(null);
      setState(loadGuest());
      setIsHydrated(true);
      return { ok: true };
    } catch { return { ok: false, error: '로그아웃하지 못했습니다. 다시 시도해 주세요.' }; }
    finally { paused.current = false; setState((previous) => ({ ...previous })); }
  };

  // This resets persona data only. Supabase Auth account deletion is an admin operation.
  const deletePersonaData: PersonaContextValue['deletePersonaData'] = async () => {
    const id = generation.current;
    const uid = owner.current;
    paused.current = true;
    await writes.current;
    try {
      if (id !== generation.current || uid !== owner.current) return { ok: false, error: '계정이 변경되어 삭제를 취소했습니다.' };
      if (authUser && supabase && CAS_ENABLED) {
        if (blocked.current) return { ok: false, error: '저장 오류를 해결한 뒤 초기화해 주세요. 다른 기기 기록은 덮어쓰지 않습니다.' };
        const write: ProfileWrite = { ownerId: uid!, expectedRevision: revision.current, writeId: crypto.randomUUID(), state: BLANK_ROOM_STATE as unknown as Record<string, unknown>, consentAgreedAt: consent.current!, consentVersion: CONSENT_VERSION };
        const result = await saveProfileCAS((name, args) => supabase!.rpc(name, args), write);
        if (id !== generation.current || uid !== owner.current) return { ok: false, error: '계정이 변경되어 초기화를 마무리하지 않았습니다.' };
        if (result.status !== 'saved') {
          pendingWrite.current = { write, serialized: JSON.stringify(BLANK_ROOM_STATE), reset: true };
          blocked.current = true; setSyncConflict(result.status === 'conflict');
          try { localStorage.setItem(draftKey(authUser.userUuid), JSON.stringify(state)); } catch { /* Keep in-memory state. */ }
          const message = result.status === 'conflict' ? '다른 기기 기록이 바뀌었어요. 서버 기록을 먼저 불러와 주세요.' : '초기화 결과를 확인하지 못했어요. 다시 시도로 같은 요청의 결과를 확인해 주세요.';
          setSyncError(message); return { ok: false, error: message };
        }
        revision.current = result.revision;
        try { localStorage.removeItem(draftKey(authUser.userUuid)); } catch { /* Optional cache. */ }
        setRecoveryDraft(null);
      } else if (authUser && supabase) {
        const { error } = await supabase.from('persona_profiles').delete().eq('user_id', authUser.userUuid);
        if (error) return { ok: false, error: error.message };
      } else localStorage.removeItem(STORAGE_KEY);
      if (id !== generation.current || uid !== owner.current) return { ok: false, error: '삭제 중 계정이 변경되었습니다. 현재 계정의 데이터는 유지됩니다.' };
      lastSaved.current = JSON.stringify(BLANK_ROOM_STATE);
      setState(BLANK_ROOM_STATE);
      return { ok: true };
    } catch { return { ok: false, error: '취향 데이터 삭제에 실패했습니다.' }; }
    finally { paused.current = false; setState((previous) => ({ ...previous })); }
  };

  const retrySync = () => {
    if (!isHydrated) { setReloadToken(v => v + 1); return; }
    if (!CAS_ENABLED) { setState(previous => ({ ...previous })); return; }
    if (syncConflict || !supabase || !authUser) return;
    const pending = pendingWrite.current;
    if (!pending) { blocked.current = false; setState(previous => ({ ...previous })); return; }
    const id = generation.current; const uid = authUser.userUuid;
    writes.current = writes.current.then(async () => {
      if (id !== generation.current || owner.current !== uid) return;
      const result = await saveProfileCAS((name, args) => supabase!.rpc(name, args), pending.write);
      if (id !== generation.current || owner.current !== uid) return;
      if (result.status === 'saved') {
        revision.current = result.revision; lastSaved.current = pending.serialized;
        pendingWrite.current = null; blocked.current = false; setSyncError(null);
        if (pending.reset) {
          // Do not re-upload the pre-reset state after an ambiguous reset succeeds.
          // Preserve any local edits made while its response was unknown as a recovery copy.
          try { const raw = localStorage.getItem(draftKey(uid)); if (raw) setRecoveryDraft(sanitizePersonaState(JSON.parse(raw))); } catch { /* Optional cache. */ }
          setState(BLANK_ROOM_STATE);
        } else {
          try { if (localStorage.getItem(draftKey(uid)) === pending.serialized) localStorage.removeItem(draftKey(uid)); } catch { /* Optional cache. */ }
          setState(previous => ({ ...previous }));
        }
      } else {
        setSyncConflict(result.status === 'conflict');
        setSyncError(result.status === 'conflict' ? '다른 기기에서 기록이 바뀌었어요. 이 기기 기록을 내려받은 뒤 서버 기록을 불러와 주세요.' : '서버 저장 실패: ' + result.message);
      }
    });
  };
  const reloadServerProfile = async () => {
    // Caller confirms replacement. Never auto-merge or discard local drafts.
    await writes.current;
    setReloadToken(v => v + 1);
  };
  const clearRecoveryDraft = () => {
    if (authUser) { try { localStorage.removeItem(draftKey(authUser.userUuid)); } catch { return; } }
    setRecoveryDraft(null);
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

    const matched = matchDomainPhenotype(domain, axisScores);

    const completedResult: CompletedDomainResult = {
      domainId: domain.id,
      matchedPhenotypeId: matched.id,
      axisScores,
      avgResponseTimeMs: avgRt,
      convictionScore: domainConvictionScore,
      completedAt: new Date().toISOString(),
    };

    setState((prev) => {
      const completedDomains = { ...prev.completedDomains, [domain.id]: completedResult };
      const choiceTelemetryLog = [...prev.choiceTelemetryLog, ...newTelemetry];
      return {
        ...prev,
        ...derivePersonaVectors(choiceTelemetryLog, completedDomains, prev.dailyShiftLog),
        completedDomains,
        choiceTelemetryLog,
      };
    });

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
        syncError,
        retrySync,
        reloadServerProfile,
        syncConflict,
        recoveryDraft,
        clearRecoveryDraft,
        authUser,
        loginWithEmail,
        loginWithGoogle,
        logoutToGuest,
        deletePersonaData,
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
