import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
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
  vi.clearAllMocks();
  vi.stubGlobal('localStorage', memory()); vi.stubGlobal('sessionStorage', memory()); vi.stubGlobal('window', { location: { origin: 'https://room.example' } });
  mock.read.mockResolvedValue({ data: null, error: null }); mock.save.mockResolvedValue({ error: null }); mock.remove.mockResolvedValue({ error: null }); mock.signout.mockResolvedValue({ error: null }); mock.updateUser.mockResolvedValue({ error: null });
  act(() => { root = create(<PersonaProvider><Probe /></PersonaProvider>); });
});
afterEach(() => { act(() => root.unmount()); vi.unstubAllGlobals(); });
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
