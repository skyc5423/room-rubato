import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { ALL_MASTER_DOMAINS } from '../src/lib/domains-index';
import { PersonaProvider, usePersonaStore } from '../src/lib/persona-store';

const mock = vi.hoisted(() => { process.env.NEXT_PUBLIC_PERSONA_CAS_ENABLED = 'false'; return ({ callback: null as any, read: vi.fn(), save: vi.fn(), remove: vi.fn(), signin: vi.fn(), signup: vi.fn(), signout: vi.fn(), updateUser: vi.fn() }); });
vi.mock('../src/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: (cb: any) => { mock.callback = cb; return { data: { subscription: { unsubscribe: vi.fn() } } }; },
      signInWithPassword: (...args: any[]) => mock.signin(...args),
      signUp: (...args: any[]) => mock.signup(...args),
      signOut: (...args: any[]) => mock.signout(...args),
      updateUser: (...args: any[]) => mock.updateUser(...args),
    },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => mock.read() }) }), upsert: (...args: any[]) => mock.save(...args), delete: () => ({ eq: () => mock.remove() }) }),
  },
}));
let store: ReturnType<typeof usePersonaStore>;
let root: ReactTestRenderer;
function Probe() { store = usePersonaStore(); return null; }
const session = (id: string) => ({ user: { id, email: `${id}@test.example`, app_metadata: {}, user_metadata: { consent_agreed_at: '2026-11-10T00:00:00Z' } } });
const memory = () => { const map = new Map<string,string>(); return { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string,v: string) => map.set(k,v), removeItem: (k: string) => map.delete(k) }; };
const tick = async () => { await act(async () => { await new Promise(r => setTimeout(r, 10)); }); };
const emit = async (s: any) => { act(() => mock.callback(s ? 'SIGNED_IN' : 'SIGNED_OUT', s)); await tick(); };
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('NEXT_PUBLIC_EMAIL_SIGNUP_ENABLED', 'true');
  vi.stubGlobal('localStorage', memory()); vi.stubGlobal('sessionStorage', memory()); vi.stubGlobal('window', { location: { origin: 'https://room.example' } });
  mock.read.mockResolvedValue({ data: null, error: null }); mock.save.mockResolvedValue({ error: null }); mock.remove.mockResolvedValue({ error: null }); mock.signout.mockResolvedValue({ error: null }); mock.updateUser.mockResolvedValue({ error: null });
  act(() => { root = create(<PersonaProvider><Probe /></PersonaProvider>); });
});
afterEach(() => { act(() => root.unmount()); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe('account isolation and persistence', () => {
  it('durably records OAuth consent before clearing pending callback storage', async () => {
    const oauth = session('alice'); oauth.user.user_metadata = {} as any;
    sessionStorage.setItem('room_rubato_pending_consent_v1', JSON.stringify({ version: '2026-11-10', at: new Date().toISOString() }));
    await emit(oauth);
    expect(mock.updateUser).toHaveBeenCalledTimes(1);
    expect(mock.updateUser.mock.calls[0][0].data.consent_version).toBe('2026-11-10');
    expect(store.authUser?.userUuid).toBe('alice');
  });
  it('does not clear a newer account when an old account deletion finishes', async () => {
    await emit(session('alice'));
    let resolve: any; mock.remove.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
    let deletion: any; await act(async () => { deletion = store.deletePersonaData(); });
    mock.read.mockResolvedValueOnce({ data: { state: { demographics: { occupation: 'research_edu' } } }, error: null });
    await emit(session('bob'));
    await act(async () => { resolve({ error: null }); await deletion; });
    expect(store.authUser?.userUuid).toBe('bob'); expect(store.state.demographics?.occupation).toBe('research_edu');
  });
  it('never copies previous account state while next account is loading', async () => {
    await emit(session('alice'));
    act(() => store.updateDemographics({ occupation: 'research_edu' })); await tick();
    expect(mock.save).toHaveBeenCalledTimes(1);
    let resolve: any; mock.read.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
    await emit(session('bob'));
    expect(store.isHydrated).toBe(false); expect(store.state.demographics?.occupation).toBe('unspecified');
    expect(mock.save).toHaveBeenCalledTimes(1);
    await act(async () => resolve({ data: null, error: null }));
    expect(store.authUser?.userUuid).toBe('bob'); expect(mock.save).toHaveBeenCalledTimes(1);
  });
  it('ignores stale account loads and does not leak state into guest storage', async () => {
    let resolve: any; mock.read.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
    await emit(session('alice')); await emit(null);
    await act(async () => resolve({ data: { state: { demographics: { occupation: 'research_edu' } } }, error: null }));
    expect(store.authUser).toBeNull(); expect(store.state.demographics?.occupation).toBe('unspecified');
    expect(mock.save).not.toHaveBeenCalled();
  });
  it('fails closed on profile read errors', async () => {
    mock.read.mockResolvedValueOnce({ error: new Error('network') }); await emit(session('alice'));
    expect(store.isHydrated).toBe(false); expect(store.syncError).toBe('network'); expect(mock.save).not.toHaveBeenCalled();
  });
  it('blocks email signup until the delivery and recovery launch gate is enabled', async () => {
    vi.stubEnv('NEXT_PUBLIC_EMAIL_SIGNUP_ENABLED', 'false');
    const result = await store.loginWithEmail({ email: 'alice@test.example', password: 'test-password', consentAgreed: true, mode: 'signup' });
    expect(result.ok).toBe(false); expect(result.error).toContain('준비 중'); expect(mock.signup).not.toHaveBeenCalled();
  });
  it('does not authenticate a signup without an actual session', async () => {
    await emit(null); mock.signup.mockResolvedValue({ data: { user: { id: 'alice' }, session: null }, error: null });
    const result = await store.loginWithEmail({ email: 'alice@test.example', password: 'test-password', consentAgreed: true, mode: 'signup' });
    expect(result.needsEmailConfirmation).toBe(true); expect(store.authUser).toBeNull(); expect(mock.save).not.toHaveBeenCalled();
  });
  it('does not turn incorrect-password login into signup', async () => {
    mock.signin.mockResolvedValue({ error: { message: 'invalid credentials' } });
    expect((await store.loginWithEmail({ email: 'alice@test.example', password: 'wrong', consentAgreed: true })).ok).toBe(false);
    expect(mock.signup).not.toHaveBeenCalled();
  });
  it('surfaces server save and delete errors', async () => {
    await emit(session('alice')); mock.save.mockResolvedValueOnce({ error: { message: 'offline' } });
    act(() => store.updateDemographics({ occupation: 'research_edu' })); await tick(); expect(store.syncError).toContain('offline');
    act(() => store.retrySync()); await tick(); expect(store.syncError).toBeNull();
    mock.remove.mockResolvedValueOnce({ error: { message: 'denied' } });
    expect((await store.deletePersonaData()).ok).toBe(false); expect(store.state.demographics?.occupation).toBe('research_edu');
  });
  it('waits for saves before deleting, without recreating deleted profiles', async () => {
    await emit(session('alice')); let resolve: any; mock.save.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
    act(() => store.updateDemographics({ occupation: 'research_edu' })); await tick();
    let deletion: any; act(() => { deletion = store.deletePersonaData(); }); expect(mock.remove).not.toHaveBeenCalled();
    await act(async () => { resolve({ error: null }); await deletion; }); await tick();
    expect(mock.remove).toHaveBeenCalledTimes(1); expect(mock.save).toHaveBeenCalledTimes(1); expect(store.state.demographics?.occupation).toBe('unspecified');
  });
});

describe('daily answers are reflection records only', () => {
  const daily = { pulseId: 'daily-pulse-1', phase1Choice: 'A' as const, phase1ResponseTimeMs: 2100, phase2ChoiceAfterSocialProof: 'B' as const };
  it('keeps all vectors unchanged for both kept and changed answers, including survey recomputation', async () => {
    await emit(null);
    const domain = ALL_MASTER_DOMAINS[0];
    const submission = { domain, answers: domain.questions.map(q => ({ questionId: q.id, chosenOption: 'A' as const, responseTimeMs: 2000 })) };
    act(() => { store.recordQuestionChoice(submission); });
    const before = structuredClone(store.state);
    act(() => store.recordDailyPulseShift(daily));
    act(() => store.recordDailyPulseShift({ ...daily, phase2ChoiceAfterSocialProof: 'A' }));
    for (const key of ['layer1Vector', 'layer2Vector', 'layer3Vector'] as const) expect(store.state[key]).toEqual(before[key]);
    const history = structuredClone(store.state.dailyShiftLog);
    expect(history.map(entry => entry.didShift)).toEqual([true, false]);
    act(() => { store.recordQuestionChoice(submission); });
    for (const key of ['layer1Vector', 'layer2Vector', 'layer3Vector'] as const) expect(store.state[key]).toEqual(before[key]);
    expect(store.state.dailyShiftLog).toEqual(history);
  });
  it.each(['guest', 'account'])('preserves historical aggregates on %s hydration and reload', async (mode) => {
    const dailyShiftLog = [{ ...daily, timestamp: '2026-11-10T00:00:00Z', didShift: true }];
    const legacy = {
      layer1Vector: { openness: .8 },
      layer2Vector: { socialConformity: .75, riskAversion: -.5 },
      layer3Vector: { novelty: .6 },
      dailyShiftLog,
    };
    const load = async () => {
      if (mode === 'guest') { localStorage.setItem('room_rubato_guest_state_v4', JSON.stringify(legacy)); await emit(null); }
      else { mock.read.mockResolvedValue({ data: { state: legacy }, error: null }); await act(async () => store.reloadServerProfile()); await emit(session('alice')); }
    };
    await load();
    const original = structuredClone(store.state);
    expect(original.layer2Vector.socialConformity).toBe(.75);
    expect(original.layer1Vector.openness).toBe(.8);
    expect(original.layer3Vector.novelty).toBe(.6);
    expect(original.dailyShiftLog).toEqual(dailyShiftLog);
    await load();
    expect(store.state).toEqual(original);
    expect(mock.save).not.toHaveBeenCalled();
  });
});

it.each([
  ['explicit empty history', { completedDomains: {}, choiceTelemetryLog: [] }],
  ['orphan known answers', { completedDomains: {}, choiceTelemetryLog: [{ domainId: ALL_MASTER_DOMAINS[0].id, questionId: ALL_MASTER_DOMAINS[0].questions[0].id, chosenOption: 'A', responseTimeMs: 1000, timestamp: '2026-11-10T00:00:00Z' }] }],
  ['orphan unknown answers', { completedDomains: {}, choiceTelemetryLog: [{ domainId: 999, questionId: 'unknown', chosenOption: 'A', responseTimeMs: 1000, timestamp: '2026-11-10T00:00:00Z' }] }],
  ['filtered completion', { completedDomains: { 1: { domainId: 1, completedAt: '2026-11-10T00:00:00Z' } }, choiceTelemetryLog: [] }],
  ['missing telemetry', { completedDomains: {} }],
  ['missing completed domains', { choiceTelemetryLog: [] }],
  ['malformed telemetry', { completedDomains: {}, choiceTelemetryLog: {} }],
  ['malformed completed domains', { completedDomains: [], choiceTelemetryLog: [] }],
])('preserves legacy aggregates with %s through a daily answer and reload', async (_label, survey) => {
  const legacy = { ...survey, layer2Vector: { socialConformity: .75 }, dailyShiftLog: [] };
  localStorage.setItem('room_rubato_guest_state_v4', JSON.stringify(legacy));
  await emit(null);
  expect(store.state.layer2Vector.socialConformity).toBe(.75);
  act(() => store.recordDailyPulseShift({ pulseId: 'test', phase1Choice: 'A', phase2ChoiceAfterSocialProof: 'B', phase1ResponseTimeMs: 1000 }));
  const history = structuredClone(store.state.dailyShiftLog);
  await emit(null);
  expect(store.state.layer2Vector.socialConformity).toBe(.75);
  expect(store.state.dailyShiftLog).toEqual(history);
  expect(mock.save).not.toHaveBeenCalled();
});
it('preserves guest survey data if local removal fails',async()=>{
 await emit(null);act(()=>store.updateDemographics({occupation:'research_edu'}));await tick();
 const before=JSON.stringify(store.state),raw=localStorage.getItem('room_rubato_guest_state_v4');
 vi.spyOn(localStorage,'removeItem').mockImplementation(()=>{throw Error('blocked');});
 await act(async()=>{expect((await store.deletePersonaData()).ok).toBe(false);});
 expect(JSON.stringify(store.state)).toBe(before);expect(localStorage.getItem('room_rubato_guest_state_v4')).toBe(raw);
});
it('does not promote a future temporary OAuth consent timestamp to durable metadata',async()=>{
 const oauth=session('alice');oauth.user.user_metadata={} as any;
 sessionStorage.setItem('room_rubato_pending_consent_v1',JSON.stringify({version:'2026-11-10',at:new Date(Date.now()+60_000).toISOString()}));
 await emit(oauth);expect(mock.updateUser).not.toHaveBeenCalled();expect(store.isHydrated).toBe(false);expect(store.syncError).toContain('동의 기록');
});
