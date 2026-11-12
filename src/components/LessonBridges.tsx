import React from 'react';
import {tasteLessons, type TasteLesson} from '@/lib/taste-lessons';
import {lessonBridges} from '@/lib/lesson-bridges';

/** Navigation only: opening a destination retains the notebook's existing draft safeguards. */
export function LessonBridges({lesson,onOpen}:{lesson:TasteLesson;onOpen:(lesson:TasteLesson)=>void}) {
 return <section className="mt-6" aria-labelledby="lesson-bridges-heading">
  <h3 id="lesson-bridges-heading" className="text-sm font-semibold">다음에는 무엇을 비교해볼까요?</h3>
  <p className="mt-2 text-xs leading-5 opacity-70">순서대로 할 필요는 없어요. 궁금한 질문을 골라보세요.</p>
  <div className="mt-3 grid gap-3 sm:grid-cols-2">{lesson.related.map(id=>{
   const next=tasteLessons.find(item=>item.id===id);
   const bridge=lessonBridges[lesson.id]?.find(item=>item.to===id);
   if(!next||!bridge)return null;
   return <div key={id} className="flex flex-col rounded-xl border border-[#0042AF]/20 bg-white/60 p-4">
    <p className="text-sm leading-6">{bridge.connection}</p>
    <p className="mt-3 text-sm font-semibold leading-6">{bridge.question}</p>
    <button type="button" className="mt-3 min-h-11 text-left text-sm underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4" onClick={()=>onOpen(next)}>{next.title} 살펴보기 →</button>
   </div>;
  })}</div>
 </section>;
}
