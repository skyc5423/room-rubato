'use client';
import React, {useEffect,useState} from 'react';
import { tasteLessons, TasteLesson } from '@/lib/taste-lessons';
import { TasteJournal } from '@/lib/taste-journal';
import { studyPaths,dailyStudyId } from '@/lib/study-paths';
const button='min-h-11 rounded-xl border border-[#0042AF]/25 px-4 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4';
export function StudyPaths({journal,onOpen,ready}:{journal:TasteJournal;onOpen:(lesson:TasteLesson)=>void;ready:boolean}){
 const [today,setToday]=useState<string|undefined>();
 useEffect(()=>{const update=()=>setToday(dailyStudyId(tasteLessons.map(l=>l.id),new Date()));update();const timer=setInterval(update,60000);return()=>clearInterval(timer);},[]);
 const spotlight=tasteLessons.find(l=>l.id===today);
 return <section className="mb-8 space-y-5" aria-labelledby="study-paths-title">
   <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs text-[#0042AF]">관심에서 시작하는 탐색</p><h2 id="study-paths-title" className="mt-2 text-2xl font-semibold">한 가지 단서를 다른 곳에서도</h2></div></div>
   <div className="grid gap-4 lg:grid-cols-3">{studyPaths.map(path=>{const done=path.lessonIds.filter(id=>journal.entries[id]?.completedAt).length;const next=path.lessonIds.find(id=>!journal.entries[id]?.completedAt)||path.lessonIds[0];return <div key={path.id} className="flex flex-col rounded-2xl border border-[#0042AF]/15 bg-white/70 p-5"><p className="text-xs text-[#0042AF]">{path.lessonIds.length}개 단서 · {done}개 살펴봄</p><h3 className="mt-2 text-lg font-semibold">{path.title}</h3><p className="mt-3 text-sm leading-6">{path.description}</p><ol className="my-4 space-y-2 text-sm">{path.lessonIds.map((id,index)=>{const lesson=tasteLessons.find(l=>l.id===id)!;return <li key={id}><button disabled={!ready} className="min-h-11 text-left underline-offset-4 hover:underline disabled:opacity-40" onClick={()=>onOpen(lesson)}>{journal.entries[id]?.completedAt?'✓':`${index+1}.`} {lesson.title}</button></li>;})}</ol><p className="mb-4 text-xs leading-5 opacity-70">남길 것: {path.outcome}</p><button disabled={!ready} className={`${button} mt-auto bg-[#010D6E] text-white disabled:opacity-40`} onClick={()=>onOpen(tasteLessons.find(l=>l.id===next)!)}>{done===path.lessonIds.length?'내 기록과 다시 비교하기':done?'이어 살펴보기':'이 흐름으로 시작하기'} →</button></div>;})}</div>
   {spotlight&&<aside className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#FEF1D0]/70 p-5"><div><h3 className="font-semibold">오늘 다시 볼 단서 · {spotlight.title}</h3><p className="mt-1 text-xs leading-5">8개 활동을 한국 날짜 기준으로 돌아가며 제안합니다. 매일 새 콘텐츠가 공개된다는 뜻은 아니에요.</p></div><button disabled={!ready} className={button} onClick={()=>onOpen(spotlight)}>살펴보기 →</button></aside>}
 </section>;
}
