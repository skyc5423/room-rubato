import React from 'react';
import {act,create,type ReactTestRenderer} from 'react-test-renderer';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
const mock=vi.hoisted(()=>{process.env.NEXT_PUBLIC_PERSONA_CAS_ENABLED='true';return {callback:null as any,read:vi.fn(),signout:vi.fn(),rpc:vi.fn()};});
vi.mock('../src/lib/supabase',()=>({supabase:{auth:{onAuthStateChange:(cb:any)=>{mock.callback=cb;return {data:{subscription:{unsubscribe:vi.fn()}}};},signOut:()=>mock.signout(),updateUser:vi.fn()},from:()=>({select:()=>({eq:()=>({maybeSingle:()=>mock.read()})})}),rpc:(...args:any[])=>mock.rpc(...args)}}));
import {PersonaProvider,usePersonaStore} from '../src/lib/persona-store';
const key='room_rubato_guest_state_v4';let root:ReactTestRenderer,store:ReturnType<typeof usePersonaStore>,data:Map<string,string>,readFails:boolean,writeFails:boolean,setItem:ReturnType<typeof vi.fn>;
function Probe(){store=usePersonaStore();return null;}
const tick=()=>act(async()=>{await new Promise(r=>setTimeout(r,10));});
const guest=async()=>{act(()=>mock.callback('INITIAL_SESSION',null));await tick();};
beforeEach(()=>{vi.clearAllMocks();data=new Map();readFails=false;writeFails=false;setItem=vi.fn((k:string,v:string)=>{if(writeFails&&k===key)throw Error('write denied');data.set(k,v);});vi.stubGlobal('localStorage',{getItem:(k:string)=>{if(readFails&&k===key)throw Error('read denied');return data.get(k)??null;},setItem,removeItem:(k:string)=>data.delete(k)});vi.stubGlobal('sessionStorage',{getItem:()=>null,removeItem:()=>{}});mock.read.mockResolvedValue({data:{state:{demographics:{occupation:'research_edu'}},revision:'r1',consent_agreed_at:'2026-11-10'},error:null});mock.signout.mockResolvedValue({error:null});act(()=>{root=create(<PersonaProvider><Probe/></PersonaProvider>);});});
afterEach(()=>{act(()=>root.unmount());vi.unstubAllGlobals();});
it.each(['{broken','null','[]','"text"',''])('preserves invalid raw guest bytes on hydration: %s',async raw=>{
 data.set(key,raw);await guest();expect(data.get(key)).toBe(raw);expect(setItem).not.toHaveBeenCalled();expect(store.isHydrated).toBe(false);expect(store.syncError).toContain('원본');expect(store.guestRecoveryRaw).toBe(raw);
 act(()=>store.recordDailyPulseShift({pulseId:'daily-pulse-1',phase1Choice:'A',phase1ResponseTimeMs:1000,phase2ChoiceAfterSocialProof:'B'}));await tick();expect(data.get(key)).toBe(raw);expect(setItem).not.toHaveBeenCalled();
});
it('does not replace valid bytes after a temporary read failure and explicitly retries reading them',async()=>{
 const original=JSON.stringify({demographics:{occupation:'research_edu'}});data.set(key,original);readFails=true;await guest();expect(data.get(key)).toBe(original);expect(store.isHydrated).toBe(false);expect(store.guestRecoveryRaw).toBeNull();expect(setItem).not.toHaveBeenCalled();
 readFails=false;act(()=>store.retrySync());await guest();expect(store.isHydrated).toBe(true);expect(store.state.demographics?.occupation).toBe('research_edu');expect(store.syncError).toBeNull();expect(mock.rpc).not.toHaveBeenCalled();
});
it('treats a genuinely absent guest profile as a new blank profile',async()=>{await guest();expect(store.isHydrated).toBe(true);expect(store.syncError).toBeNull();expect(store.guestRecoveryRaw).toBeNull();expect(JSON.parse(data.get(key)!).dailyShiftLog).toEqual([]);});
it.each([false,true])('reports signout success but blocks guest writes after an invalid/read-failed guest load (%s)',async getterFailure=>{
 act(()=>mock.callback('SIGNED_IN',{user:{id:'alice',email:'alice@example.test',app_metadata:{},user_metadata:{consent_agreed_at:'2026-11-10'}}}));await tick();expect(store.authUser?.userUuid).toBe('alice');
 const raw='{damaged guest original';data.set(key,raw);readFails=getterFailure;setItem.mockClear();await act(async()=>{expect((await store.logoutToGuest()).ok).toBe(true);});
 expect(store.authUser).toBeNull();expect(store.isHydrated).toBe(false);expect(store.state.demographics?.occupation).toBe('unspecified');expect(store.guestRecoveryRaw).toBe(getterFailure?null:raw);expect(data.get(key)).toBe(raw);expect(setItem).not.toHaveBeenCalled();
});
it('allows a safe guest write retry under CAS mode and clears its error after success',async()=>{
 await guest();writeFails=true;act(()=>store.updateDemographics({occupation:'research_edu'}));await tick();expect(store.syncError).toContain('저장');writeFails=false;act(()=>store.retrySync());await tick();expect(JSON.parse(data.get(key)!).demographics.occupation).toBe('research_edu');expect(store.syncError).toBeNull();expect(mock.rpc).not.toHaveBeenCalled();
});

it('clears guest recovery bytes immediately when an account transition begins',async()=>{
 data.set(key,'{guest private original');await guest();expect(store.guestRecoveryRaw).toBe('{guest private original');
 act(()=>mock.callback('SIGNED_IN',{user:{id:'alice',email:'alice@example.test',app_metadata:{},user_metadata:{consent_agreed_at:'2026-11-10'}}}));
 expect(store.guestRecoveryRaw).toBeNull();expect(store.isHydrated).toBe(false);await tick();expect(store.authUser?.userUuid).toBe('alice');expect(store.guestRecoveryRaw).toBeNull();expect(data.get(key)).toBe('{guest private original');
});
