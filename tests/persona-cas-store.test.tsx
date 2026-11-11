import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_PERSONA_CAS_ENABLED = 'true';
  return { callback: null as any, read: vi.fn(), rpc: vi.fn(), signout: vi.fn() };
});
vi.mock('../src/lib/supabase', () => ({ supabase: {
  auth: { onAuthStateChange: (cb: any) => { mock.callback=cb; return {data:{subscription:{unsubscribe:vi.fn()}}}; }, signOut: () => mock.signout(), updateUser: vi.fn() },
  from: () => ({select:()=>({eq:()=>({maybeSingle:()=>mock.read()})})}), rpc: (...args:any[])=>mock.rpc(...args),
} }));
import { PersonaProvider, usePersonaStore } from '../src/lib/persona-store';
let store: ReturnType<typeof usePersonaStore>; let root:ReactTestRenderer;
function Probe(){store=usePersonaStore();return null;}
const memory=()=>{const m=new Map();return {getItem:(k:string)=>m.get(k)??null,setItem:(k:string,v:string)=>m.set(k,v),removeItem:(k:string)=>m.delete(k)};};
const tick=()=>act(async()=>{await new Promise(r=>setTimeout(r,10));});
const session=(id='alice')=>({user:{id,email:`${id}@example.test`,app_metadata:{},user_metadata:{consent_agreed_at:'2026-11-10T00:00:00Z'}}});
const emit=async(id='alice')=>{act(()=>mock.callback('SIGNED_IN',session(id)));await tick();};
beforeEach(()=>{vi.clearAllMocks();vi.stubGlobal('localStorage',memory());vi.stubGlobal('sessionStorage',memory());mock.read.mockResolvedValue({data:{state:{},revision:'r1',consent_agreed_at:'2026-11-10T00:00:00Z'},error:null});mock.rpc.mockResolvedValue({data:'r2',error:null});mock.signout.mockResolvedValue({error:null});act(()=>{root=create(<PersonaProvider><Probe/></PersonaProvider>);});});
afterEach(()=>{act(()=>root.unmount());vi.unstubAllGlobals();});
describe('profile CAS client integration',()=>{
 it('uses loaded revision and advances serial writes',async()=>{await emit();act(()=>store.updateDemographics({occupation:'research_edu'}));await tick();expect(mock.rpc.mock.calls[0][1].p_expected_revision).toBe('r1');act(()=>store.updateDemographics({gender:'other'}));await tick();expect(mock.rpc.mock.calls[1][1].p_expected_revision).toBe('r2');});
 it('stops stale writes without losing the local state',async()=>{await emit();mock.rpc.mockResolvedValueOnce({data:null,error:{message:'PERSONA_REVISION_CONFLICT'}});act(()=>store.updateDemographics({occupation:'research_edu'}));await tick();expect(store.syncConflict).toBe(true);act(()=>store.updateDemographics({gender:'other'}));await tick();act(()=>store.retrySync());await tick();expect(mock.rpc).toHaveBeenCalledTimes(1);expect(store.state.demographics?.gender).toBe('other');expect(localStorage.getItem('room_rubato_unsaved_profile_v1:alice')).toContain('research_edu');});
 it('retries lost responses with exactly the same id and payload before newer changes',async()=>{await emit();mock.rpc.mockRejectedValueOnce(Error('offline'));act(()=>store.updateDemographics({occupation:'research_edu'}));await tick();const first=mock.rpc.mock.calls[0][1];act(()=>store.updateDemographics({gender:'other'}));await tick();act(()=>store.retrySync());await tick();expect(mock.rpc.mock.calls[1][1]).toEqual(first);expect(mock.rpc.mock.calls[2][1].p_state.demographics.gender).toBe('other');expect(store.syncError).toBeNull();});
 it('initializes a new generation without sharing drafts between users',async()=>{await emit();mock.rpc.mockResolvedValueOnce({data:null,error:{message:'PERSONA_REVISION_CONFLICT'}});act(()=>store.updateDemographics({occupation:'research_edu'}));await tick();await emit('bob');expect(store.syncConflict).toBe(false);expect(store.recoveryDraft).toBeNull();expect(store.state.demographics?.occupation).toBe('unspecified');expect(mock.rpc).toHaveBeenCalledTimes(1);});
 it('offers old unsaved data without silently overwriting the server',async()=>{localStorage.setItem('room_rubato_unsaved_profile_v1:alice',JSON.stringify({demographics:{occupation:'research_edu'}}));await emit();expect(store.recoveryDraft?.demographics?.occupation).toBe('research_edu');expect(store.state.demographics?.occupation).toBe('unspecified');expect(mock.rpc).not.toHaveBeenCalled();});
 it('reset is a revision checked empty state, not a row delete',async()=>{await emit();await act(async()=>{expect((await store.deletePersonaData()).ok).toBe(true);});expect(mock.rpc.mock.calls[0][0]).toBe('save_persona_cas');expect(mock.rpc.mock.calls[0][1].p_expected_revision).toBe('r1');expect(mock.rpc.mock.calls[0][1].p_state.completedDomains).toEqual({});});
 it('retries an ambiguous reset without resurrecting the old state',async()=>{await emit();act(()=>store.updateDemographics({occupation:'research_edu'}));await tick();mock.rpc.mockRejectedValueOnce(Error('lost reset response'));await act(async()=>{expect((await store.deletePersonaData()).ok).toBe(false);});const reset=mock.rpc.mock.calls[1][1];act(()=>store.retrySync());await tick();expect(mock.rpc.mock.calls[2][1]).toEqual(reset);expect(mock.rpc).toHaveBeenCalledTimes(3);expect(store.state.demographics?.occupation).toBe('unspecified');expect(store.recoveryDraft?.demographics?.occupation).toBe('research_edu');});
 it('keeps session identity on load failure to permit signout',async()=>{mock.read.mockResolvedValueOnce({data:null,error:new Error('read failed')});await emit();expect(store.isHydrated).toBe(false);expect(store.authUser?.userUuid).toBe('alice');expect(mock.rpc).not.toHaveBeenCalled();});
});
