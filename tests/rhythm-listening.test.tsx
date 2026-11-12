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

it.each([
 ['기준 박만 듣기', []],
 ['A 듣기', [0, 4, 8, 12]],
 ['B 듣기', [0, 3, 6, 10]],
] as const)('schedules unchanged reference and pattern onsets for %s',async(label,highSteps)=>{
 click(label);const audio=instances[0];await resolve(audio);
 const tones=audio.createOscillator.mock.results.map(result=>result.value);
 const low=tones.filter(tone=>tone.frequency.value===160);
 const high=tones.filter(tone=>tone.frequency.value===660);
 const times=(steps:readonly number[])=>[0,1].flatMap(repeat=>steps.map(step=>0.06+(repeat*16+step)*0.15));
 expect(low.map(tone=>tone.start.mock.calls[0][0])).toEqual(times([0,4,8,12]));
 expect(high.map(tone=>tone.start.mock.calls[0][0])).toEqual(times(highSteps));
 expect(tones).toHaveLength(label==='기준 박만 듣기'?8:16);
});
it('can stop the reference during pending resume and restart A without stale sound',async()=>{
 click('기준 박만 듣기');const pulse=instances[0];click('정지');click('A 듣기');const a=instances[1];
 await resolve(pulse);expect(pulse.createOscillator).not.toHaveBeenCalled();await resolve(a);
 expect(a.createOscillator).toHaveBeenCalledTimes(16);
});
it('a rejected old A request does not interrupt the newer reference pulse',async()=>{
 click('A 듣기');const a=instances[0];click('기준 박만 듣기');const pulse=instances[1];await resolve(pulse);await reject(a);
 expect(pulse.close).not.toHaveBeenCalled();expect(button('기준 박만 듣기').props['aria-pressed']).toBe(true);
 expect(JSON.stringify(view.toJSON())).not.toContain('재생하지 못했어요');
 act(()=>{vi.advanceTimersByTime(5000);});expect(pulse.close).toHaveBeenCalledTimes(1);
});
it('offers a readable reference and comparison without sound or storage writes',async()=>{
 const storage={setItem:vi.fn(),removeItem:vi.fn()};vi.stubGlobal('localStorage',storage);vi.stubGlobal('sessionStorage',storage);
 const text=JSON.stringify(view.toJSON());
 expect(text).toContain('소리 없이 위치 읽기');expect(text).toContain('1·5·9·13');expect(text).toContain('1·4·7·11');
 expect(text).toContain('세 번째 선택지가 아닙니다');expect(instances).toHaveLength(0);
 click('기준 박만 듣기');await resolve(instances[0]);click('B 듣기');await resolve(instances[1]);click('정지');
 expect(storage.setItem).not.toHaveBeenCalled();expect(storage.removeItem).not.toHaveBeenCalled();
});
it('stops active reference playback manually and on unmount',async()=>{
 click('기준 박만 듣기');const first=instances[0];await resolve(first);click('정지');expect(first.close).toHaveBeenCalledTimes(1);
 click('기준 박만 듣기');const second=instances[1];await resolve(second);act(()=>view.unmount());
 expect(second.close).toHaveBeenCalledTimes(1);expect(vi.getTimerCount()).toBe(0);
});
