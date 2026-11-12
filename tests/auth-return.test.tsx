import React from 'react';
import {act,create,ReactTestRenderer} from 'react-test-renderer';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
const mock=vi.hoisted(()=>({initialize:vi.fn()}));
vi.mock('../src/lib/supabase',()=>({supabase:{auth:{initialize:()=>mock.initialize()}}}));
import {AuthReturnNotice} from '../src/components/AuthReturnNotice';
import {failedAuthReturnPath} from '../src/lib/auth-return';
let view:ReactTestRenderer|undefined;
beforeEach(()=>{mock.initialize.mockReset().mockResolvedValue({error:{message:'raw-untrusted-provider-text'}});vi.stubGlobal('window',{location:{href:'https://room.example/?lesson=context#error=access_denied&error_description=private-detail'},history:{state:{__NA:true},replaceState:vi.fn()}});});
afterEach(()=>{if(view)act(()=>view!.unmount());view=undefined;vi.unstubAllGlobals();});
const render=async()=>act(async()=>{view=create(<AuthReturnNotice/>);await Promise.resolve();});
it.each(['https://room.example/#error=access_denied&error_description=private','https://room.example/?error=access_denied&error_code=otp_expired'])('handles failed returns without reflecting raw error or changing sessions: %s',async href=>{
 window.location.href=href;await render();expect(mock.initialize).toHaveBeenCalledTimes(1);expect(window.history.replaceState).toHaveBeenCalledWith({__NA:true},'','https://room.example/');
 expect(JSON.stringify(view!.toJSON())).not.toContain('private');expect(JSON.stringify(view!.toJSON())).not.toContain('raw-untrusted-provider-text');expect(view!.root.findByProps({role:'alert'})).toBeDefined();
 act(()=>view!.root.findByType('button').props.onClick());expect(view!.toJSON()).toBeNull();
});
it('leaves normal and successful auth URLs entirely to the SDK',async()=>{
 for(const href of ['https://room.example/notes?lesson=light#section','https://room.example/#access_token=synthetic&refresh_token=synthetic','https://room.example/?code=synthetic'])expect(failedAuthReturnPath(href)).toBeNull();
 window.location.href='https://room.example/?code=synthetic';await render();expect(mock.initialize).not.toHaveBeenCalled();expect(window.history.replaceState).not.toHaveBeenCalled();expect(view!.toJSON()).toBeNull();
});
it('preserves same-origin route/unrelated state and strips known callback fields on explicit errors only',()=>{
 expect(failedAuthReturnPath('https://room.example/notes?lesson=context&error=access_denied&next=https%3A%2F%2Fevil.example#section')).toBe('/notes?lesson=context&next=https%3A%2F%2Fevil.example#section');
 expect(failedAuthReturnPath('https://room.example/?error_code=otp_expired&code=synthetic#access_token=synthetic&refresh_token=synthetic&provider_token=synthetic&keep=yes')).toBe('/#keep=yes');
 expect(failedAuthReturnPath('javascript:alert(1)')).toBeNull();expect(failedAuthReturnPath('invalid')).toBeNull();
});
it('waits for SDK initialization and does not rewrite a newer navigation',async()=>{
 let resolve!:(value:any)=>void;mock.initialize.mockReturnValue(new Promise(r=>resolve=r));await render();expect(window.history.replaceState).not.toHaveBeenCalled();
 window.location.href='https://room.example/compare';await act(async()=>{resolve({error:null});await Promise.resolve();});expect(window.history.replaceState).not.toHaveBeenCalled();expect(view!.toJSON()).toBeNull();
});
it('ignores pending work after unmount and safely reports cleanup failure',async()=>{
 let resolve!:(value:any)=>void;mock.initialize.mockReturnValue(new Promise(r=>resolve=r));await render();act(()=>view!.unmount());await act(async()=>{resolve({error:null});await Promise.resolve();});expect(window.history.replaceState).not.toHaveBeenCalled();
 mock.initialize.mockRejectedValue(Error('private SDK error'));vi.mocked(window.history.replaceState).mockImplementation(()=>{throw Error('blocked');});await render();expect(JSON.stringify(view!.toJSON())).toContain('현재 주소를 복사해 공유하지');expect(JSON.stringify(view!.toJSON())).not.toContain('private SDK');
});
it('clears only the failed attempt temporary consent, never a newer attempt',async()=>{
 let pending='old staging';const remove=vi.fn(()=>{pending='';});vi.stubGlobal('sessionStorage',{getItem:()=>pending,removeItem:remove});await render();expect(remove).toHaveBeenCalledWith('room_rubato_pending_consent_v1');act(()=>view!.unmount());
 pending='old staging';remove.mockClear();let resolve!:(v:any)=>void;mock.initialize.mockReturnValue(new Promise(r=>resolve=r));await render();pending='new staging';await act(async()=>{resolve({error:null});await Promise.resolve();});expect(remove).not.toHaveBeenCalled();
});
it('keeps cleanup on the same origin even for a double-slash route',async()=>{
 window.location.href='https://room.example//elsewhere.example/?error=access_denied';await render();expect(window.history.replaceState).toHaveBeenCalledWith({__NA:true},'','https://room.example//elsewhere.example/');
});

it('leaves arbitrary application errors and codes untouched',async()=>{
 window.location.href='https://room.example/compare?error=loading&type=art&code=exhibit';
 const remove=vi.fn();vi.stubGlobal('sessionStorage',{getItem:()=> 'keep staging',removeItem:remove});
 expect(failedAuthReturnPath(window.location.href)).toBeNull();expect(failedAuthReturnPath('https://room.example/?error_description=untrusted')).toBeNull();
 await render();expect(mock.initialize).not.toHaveBeenCalled();expect(window.history.replaceState).not.toHaveBeenCalled();expect(remove).not.toHaveBeenCalled();expect(view!.toJSON()).toBeNull();
});
it('survives synthetic setup-cleanup-remount replay without duplicate URL cleanup',async()=>{
 // React18 test-renderer does not implement browser development StrictEffects.
 // Exercise cleanup/re-entry against the SDK's shared unresolved initialization promise.
 let resolve!:(v:any)=>void;const initialized=new Promise(r=>resolve=r);mock.initialize.mockReturnValue(initialized);
 const remove=vi.fn();vi.stubGlobal('sessionStorage',{getItem:()=> 'same staging',removeItem:remove});
 await act(async()=>{view=create(<React.StrictMode><AuthReturnNotice/></React.StrictMode>);});act(()=>view!.unmount());
 await act(async()=>{view=create(<React.StrictMode><AuthReturnNotice/></React.StrictMode>);});expect(mock.initialize).toHaveBeenCalledTimes(2);
 await act(async()=>{resolve({error:null});await Promise.resolve();});expect(window.history.replaceState).toHaveBeenCalledTimes(1);expect(remove).toHaveBeenCalledTimes(1);expect(view!.root.findByProps({role:'alert'})).toBeDefined();
});
it('matches SDK query-over-fragment and last-value precedence without changing overridden errors',()=>{
 for(const href of ['https://room.example/?error=#error=access_denied','https://room.example/?error=access_denied&error=loading','https://room.example/#error=access_denied&error='])expect(failedAuthReturnPath(href)).toBeNull();
 expect(failedAuthReturnPath('https://room.example/?error=loading&error=access_denied#keep=yes')).toBe('/#keep=yes');
 expect(failedAuthReturnPath('https://room.example/compare?error=access_denied&type=art&code=exhibit')).toBe('/compare?type=art&code=exhibit');
 expect(failedAuthReturnPath('https://room.example/?error_code=otp_expired&type=recovery&code=synthetic')).toBe('/');
});
