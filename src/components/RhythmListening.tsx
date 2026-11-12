'use client';
import { useEffect, useRef, useState } from 'react';

export function RhythmListening() {
  const context = useRef<AudioContext|null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const generation = useRef(0);
  const [playing,setPlaying]=useState<'a'|'b'|null>(null);
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
  async function play(pattern:'a'|'b') {
    stop();setError('');
    const request=generation.current;
    setPlaying(pattern); // Stop remains available while the browser resumes audio.
    try {
      const audio=new AudioContext();context.current=audio;await audio.resume();
      if(generation.current!==request || context.current!==audio) return;
      const beats=pattern==='a'?[0,4,8,12]:[0,3,6,10];
      const start=audio.currentTime+0.06;const step=0.15;
      for(let repeat=0;repeat<2;repeat++) for(let i=0;i<16;i++) {
        if(i%4===0) tone(audio,start+(repeat*16+i)*step,160,0.035);
        if(beats.includes(i)) tone(audio,start+(repeat*16+i)*step,660,0.07);
      }
      setPlaying(pattern);timer.current=setTimeout(()=>{if(context.current===audio)stop();},5000);
    } catch {if(generation.current!==request)return;stop();setError('이 브라우저에서 소리를 재생하지 못했어요. 도식의 점 위치로 비교할 수 있어요.');}
  }
  function tone(audio:AudioContext,time:number,hz:number,volume:number) {
    const oscillator=audio.createOscillator();const gain=audio.createGain();oscillator.type='sine';oscillator.frequency.value=hz;gain.gain.setValueAtTime(volume,time);gain.gain.exponentialRampToValueAtTime(0.001,time+0.09);oscillator.connect(gain);gain.connect(audio.destination);oscillator.start(time);oscillator.stop(time+0.1);
  }
  return <div className="mt-4 rounded-xl border border-[#0042AF]/20 bg-white p-4"><p className="text-sm leading-6">낮은 소리는 일정한 박, 높은 소리는 비교할 패턴입니다. 먼저 기기 볼륨을 낮춰주세요. 같은 속도·같은 소리 수로 약 5초씩 재생해요.</p><div className="mt-3 flex flex-wrap gap-2">{(['a','b'] as const).map(p=><button type="button" key={p} onClick={()=>void play(p)} className="min-h-11 rounded-xl bg-[#0042AF] px-4 text-sm text-white" aria-pressed={playing===p}>{p.toUpperCase()} 듣기</button>)}<button type="button" onClick={stop} disabled={!playing} className="min-h-11 rounded-xl border border-[#0042AF]/30 px-4 text-sm disabled:opacity-40">정지</button></div><p role="status" className="mt-2 text-xs">{error|| (playing?`${playing.toUpperCase()} 재생 중`:'직접 만든 합성음입니다. 음원이나 음성은 수집하지 않습니다.')}</p></div>;
}
