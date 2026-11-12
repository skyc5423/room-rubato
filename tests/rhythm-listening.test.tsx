import React from 'react';
import {act,create,ReactTestRenderer} from 'react-test-renderer';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {RhythmListening} from '../src/components/RhythmListening';
const instances:FakeAudio[]=[];
class FakeAudio {
 currentTime=0;destination={};
 resolve!:()=>void;reject!:(error:Error)=>void;
 resume=vi.fn(()=>new Promise<void>((resolve,reject)=>{this.resolve=resolve;this.reject=reject;}));
 close=vi.fn(()=>Promise.resolve());
 createOscillator=vi.fn(()=>({type:'',frequency:{value:0},connect:vi.fn(),start:vi.fn(),stop:vi.fn()}));
 createGain=vi.fn(()=>({gain:{setValueAtTime:vi.fn(),exponentialRampToValueAtTime:vi.fn()},connect:vi.fn()}));
 constructor(){instances.push(this);}
}
let view:ReactTestRenderer;
const button=(label:string)=>view.root.findAllByType('button').find(b=>b.children.join('')===label)!;
const click=(label:string)=>act(()=>button(label).props.onClick());
const resolve=async(audio:FakeAudio)=>{await act(async()=>{audio.resolve();await Promise.resolve();});};
const reject=async(audio:FakeAudio)=>{await act(async()=>{audio.reject(new Error('resume failed'));await Promise.resolve();});};
beforeEach(()=>{instances.length=0;vi.useFakeTimers();vi.stubGlobal('AudioContext',FakeAudio);act(()=>{view=create(<RhythmListening/>);});});
afterEach(()=>{act(()=>view.unmount());vi.useRealTimers();vi.unstubAllGlobals();});
it('never autoplays and allows stop during pending resume',async()=>{
 expect(instances).toHaveLength(0);expect(button('정지').props.disabled).toBe(true);
 click('A 듣기');const a=instances[0];expect(button('정지').props.disabled).toBe(false);
 click('정지');expect(a.close).toHaveBeenCalledTimes(1);await resolve(a);
 expect(a.createOscillator).not.toHaveBeenCalled();expect(button('정지').props.disabled).toBe(true);
});
it('plays only after resume and stops manually or after five seconds',async()=>{
 click('A 듣기');const a=instances[0];await resolve(a);expect(a.createOscillator).toHaveBeenCalledTimes(16);
 click('정지');expect(a.close).toHaveBeenCalledTimes(1);
 click('B 듣기');const b=instances[1];await resolve(b);act(()=>{vi.advanceTimersByTime(5000);});
 expect(b.close).toHaveBeenCalledTimes(1);expect(button('정지').props.disabled).toBe(true);
});
it('invalidates delayed resume on unmount without scheduling sound',async()=>{
 click('A 듣기');const a=instances[0];act(()=>view.unmount());expect(a.close).toHaveBeenCalledTimes(1);
 await resolve(a);expect(a.createOscillator).not.toHaveBeenCalled();expect(vi.getTimerCount()).toBe(0);
});
it('ignores stale success after switching patterns',async()=>{
 click('A 듣기');const a=instances[0];click('B 듣기');const b=instances[1];
 await resolve(a);expect(a.createOscillator).not.toHaveBeenCalled();await resolve(b);
 expect(b.createOscillator).toHaveBeenCalledTimes(16);expect(button('B 듣기').props['aria-pressed']).toBe(true);
});
it('ignores stale rejection without stopping newer playback',async()=>{
 click('A 듣기');const a=instances[0];click('B 듣기');const b=instances[1];await resolve(b);await reject(a);
 expect(b.close).not.toHaveBeenCalled();expect(button('B 듣기').props['aria-pressed']).toBe(true);
 expect(JSON.stringify(view.toJSON())).not.toContain('재생하지 못했어요');
});
it('shows a fallback for the current failure and allows a later retry',async()=>{
 click('A 듣기');const a=instances[0];await reject(a);expect(a.close).toHaveBeenCalledTimes(1);
 expect(JSON.stringify(view.toJSON())).toContain('도식의 점 위치로 비교');expect(button('정지').props.disabled).toBe(true);
 click('B 듣기');await resolve(instances[1]);expect(JSON.stringify(view.toJSON())).not.toContain('재생하지 못했어요');
});
it('ignores rejected resume after unmount',async()=>{
 click('A 듣기');const a=instances[0];act(()=>view.unmount());await reject(a);
 expect(a.close).toHaveBeenCalledTimes(1);expect(vi.getTimerCount()).toBe(0);
});
it('closes active sound and cancels its timer on unmount',async()=>{
 click('A 듣기');const a=instances[0];await resolve(a);expect(vi.getTimerCount()).toBe(1);
 act(()=>view.unmount());expect(a.close).toHaveBeenCalledTimes(1);expect(vi.getTimerCount()).toBe(0);
});
