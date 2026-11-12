'use client';
import { useEffect, useRef, useState } from 'react';
import { RHYTHM_PATTERN_STEPS, RHYTHM_PULSE_STEPS, RHYTHM_STEP_COUNT, RHYTHM_STEP_SECONDS, RHYTHM_REPEATS, RHYTHM_PLAYBACK_MS, RHYTHM_NO_SOUND_READING, type RhythmPlayback } from '@/lib/rhythm-patterns';

export function RhythmListening() {
  const context = useRef<AudioContext|null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const generation = useRef(0);
  const [playing,setPlaying]=useState<RhythmPlayback|null>(null);
  const [error,setError]=useState('');
  function release() {
    generation.current++;
    if(timer.current) clearTimeout(timer.current);
    timer.current=null;
    const audio=context.current;context.current=null;
    // Detach before closing: pending resume callbacks must not own this player.
    if(audio) {try {void audio.close().catch(()=>{});} catch { /* Already unavailable. */ }}
  }
  function stop() {release();setPlaying(null);}
  useEffect(()=>()=>release(),[]);
  async function play(pattern:RhythmPlayback) {
    stop();setError('');
    const request=generation.current;
    setPlaying(pattern); // Stop remains available while the browser resumes audio.
    try {
      const audio=new AudioContext();context.current=audio;await audio.resume();
      if(generation.current!==request || context.current!==audio) return;
      const patternSteps=pattern==='pulse'?[]:RHYTHM_PATTERN_STEPS[pattern];
      const start=audio.currentTime+0.06;
      for(let repeat=0;repeat<RHYTHM_REPEATS;repeat++) for(let i=0;i<RHYTHM_STEP_COUNT;i++) {
        const time=start+(repeat*RHYTHM_STEP_COUNT+i)*RHYTHM_STEP_SECONDS;
        if(RHYTHM_PULSE_STEPS.includes(i)) tone(audio,time,160,0.035);
        if(patternSteps.includes(i)) tone(audio,time,660,0.07);
      }
      setPlaying(pattern);timer.current=setTimeout(()=>{if(context.current===audio)stop();},RHYTHM_PLAYBACK_MS);
    } catch {if(generation.current!==request)return;stop();setError('이 브라우저에서 소리를 재생하지 못했어요. 도식의 점 위치로 비교할 수 있어요.');}
  }
  function tone(audio:AudioContext,time:number,hz:number,volume:number) {
    const oscillator=audio.createOscillator();const gain=audio.createGain();oscillator.type='sine';oscillator.frequency.value=hz;gain.gain.setValueAtTime(volume,time);gain.gain.exponentialRampToValueAtTime(0.001,time+0.09);oscillator.connect(gain);gain.connect(audio.destination);oscillator.start(time);oscillator.stop(time+0.1);
  }
  return <div className="mt-4 rounded-xl border border-[#0042AF]/20 bg-white p-4">
    <h3 className="font-semibold">박과 패턴을 나눠 듣기</h3>
    <p className="mt-2 text-sm leading-6">먼저 기기 볼륨을 낮춰주세요. 기준 박만 들어본 뒤 A와 B를 비교해 보세요. 낮은 소리는 일정한 박, 높은 소리는 비교할 패턴입니다.</p>
    <p className="mt-2 text-sm leading-6">A와 B는 같은 속도이며 네 박 패턴 한 차례마다 높은 소리가 각각 4번 납니다. A에서는 두 소리가 겹치고, B에서는 일부가 따로 들려요. 네 박 패턴을 두 번 반복해 약 5초씩 재생합니다.</p>
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" onClick={()=>void play('pulse')} className="min-h-11 rounded-xl border border-[#0042AF]/30 px-4 text-sm" aria-pressed={playing==='pulse'}>기준 박만 듣기</button>
      {(['a','b'] as const).map(p=><button type="button" key={p} onClick={()=>void play(p)} className="min-h-11 rounded-xl bg-[#0042AF] px-4 text-sm text-white" aria-pressed={playing===p}>{p.toUpperCase()} 듣기</button>)}
      <button type="button" onClick={stop} disabled={!playing} className="min-h-11 rounded-xl border border-[#0042AF]/30 px-4 text-sm disabled:opacity-40">정지</button>
    </div>
    <p role="status" className="mt-2 text-xs">{error|| (playing?`${playing==='pulse'?'기준 박':playing.toUpperCase()} 재생 중`:'직접 만든 합성음입니다. 음원이나 음성은 수집하지 않습니다.')}</p>
    <p className="mt-3 text-xs leading-5">기준 박은 비교를 돕는 소리이며 세 번째 선택지가 아닙니다. 듣기 동작은 기록에 저장하지 않아요.</p>
    <details className="mt-3 text-sm leading-6"><summary className="min-h-11 cursor-pointer">소리 없이 위치 읽기</summary><p>{RHYTHM_NO_SOUND_READING}</p></details>
  </div>;
}
