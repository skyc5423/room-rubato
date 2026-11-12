'use client';
import React,{useState} from 'react';

export type CinemaScene='door'|'cup'|'chair';
export const cinemaSequences:Record<'A'|'B',readonly CinemaScene[]>={A:['door','cup','door','chair'],B:['door','cup','chair','door']};
export const cinemaScenes:Record<CinemaScene,{name:string;description:string}>={
 door:{name:'닫힌 문',description:'손잡이가 달린 닫힌 문. 사람은 보이지 않습니다.'},
 cup:{name:'컵',description:'탁자 위에 놓인 컵 하나. 사람은 보이지 않습니다.'},
 chair:{name:'빈 의자',description:'아무도 앉아 있지 않은 의자 하나.'},
};
/** The very same drawing is reused for a scene in either sequence. No film images. */
export function CinemaSceneDrawing({scene}:{scene:CinemaScene}){
 return <svg viewBox="0 0 320 200" role="img" aria-label={cinemaScenes[scene].description} className="w-full rounded-xl bg-[#f6f2e8]">
  <path d="M20 164H300" stroke="#63766c" strokeWidth="2"/>
  {scene==='door'&&<g><rect x="102" y="20" width="116" height="144" fill="#b5a18b" stroke="#314d48" strokeWidth="4"/><rect x="112" y="31" width="96" height="132" fill="#ded4c1" stroke="#314d48" strokeWidth="2"/><circle cx="194" cy="100" r="5" fill="#314d48"/></g>}
  {scene==='cup'&&<g><path d="M67 132H253M83 132V164M237 132V164" fill="none" stroke="#314d48" strokeWidth="5"/><path d="M133 83H177V119Q155 137 133 119Z" fill="#ded4c1" stroke="#314d48" strokeWidth="3"/><path d="M177 89H187Q201 103 187 115H177" fill="none" stroke="#314d48" strokeWidth="3"/></g>}
  {scene==='chair'&&<g><path d="M117 91V42H199V91M117 54H199M117 75H199" fill="none" stroke="#314d48" strokeWidth="5"/><path d="M110 99H207V113H110Z" fill="#b5a18b" stroke="#314d48" strokeWidth="3"/><path d="M118 113L110 164M198 113L207 164" stroke="#314d48" strokeWidth="5"/></g>}
 </svg>;
}
export function CinemaSequenceStudy(){
 const [step,setStep]=useState(0);
 const control='min-h-11 rounded-xl border border-[#0042AF]/40 bg-white px-4 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 disabled:opacity-40';
 return <section className="mt-8 border-t border-[#0042AF]/15 pt-8" aria-labelledby="cinema-sequence-title">
  <p className="text-xs font-semibold text-[#0042AF]">그림의 맥락에서 영화의 순서로</p>
  <h3 id="cinema-sequence-title" className="mt-2 text-xl font-semibold">마지막에 무엇을 보았나요?</h3>
  <p className="mt-3 text-sm leading-7">같은 그림도 앞뒤에 무엇이 놓이는지에 따라 다르게 읽힐 수 있어요. 아래 두 묶음은 닫힌 문 두 번, 컵 한 번, 빈 의자 한 번으로 같습니다. 세 번째와 네 번째 컷의 순서만 바꿨습니다.</p>
  <p className="mt-2 text-sm leading-7">문이 반복되는 자리뿐 아니라 의자의 자리와 마지막 컷도 함께 달라집니다. 반복 하나의 효과만 따로 확인하는 실험은 아니에요.</p>
  <div className="mt-5 grid gap-4 sm:grid-cols-2">{(['A','B'] as const).map(sequence=><figure key={sequence} className="min-w-0 rounded-2xl border border-[#0042AF]/20 bg-white/60 p-4">
   <figcaption className="mb-3 text-sm font-semibold">{sequence} · {step+1}번째 컷 · {cinemaScenes[cinemaSequences[sequence][step]].name}</figcaption>
   <CinemaSceneDrawing scene={cinemaSequences[sequence][step]}/>
   <ol aria-label={`${sequence} 전체 순서`} className="mt-3 flex flex-wrap gap-x-3 gap-y-2 text-sm leading-6">{cinemaSequences[sequence].map((scene,index)=><li key={index} aria-current={index===step?'step':undefined} className={index===step?'font-semibold underline underline-offset-4':''}>{index+1}. {cinemaScenes[scene].name}</li>)}</ol>
  </figure>)}</div>
  <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="두 묶음의 컷 함께 이동">
   <button className={control} type="button" disabled={step===0} onClick={()=>setStep(n=>Math.max(0,n-1))}>이전 컷</button>
   <button className={control} type="button" disabled={step===3} onClick={()=>setStep(n=>Math.min(3,n+1))}>다음 컷</button>
   <button className={control} type="button" onClick={()=>setStep(0)}>처음부터 보기</button>
  </div>
  <p className="mt-3 text-sm leading-6" role="status">{step+1}/4 · A는 {cinemaScenes[cinemaSequences.A[step]].name}, B는 {cinemaScenes[cinemaSequences.B[step]].name}입니다.</p>
  <p className="mt-2 text-xs leading-6">버튼을 누를 때만 바뀝니다. 자동재생·소리·움직이는 전환은 없어요. 전체 순서는 그림 아래 글로도 읽을 수 있습니다. 각 컷을 보는 시간은 직접 정하므로 같게 통제하지 않습니다. 조작은 기록되지 않아요.</p>
  <div className="mt-5 rounded-xl bg-[#edf2ee] p-4 text-sm leading-7"><h4 className="font-semibold">Room Rubato의 관찰 제안</h4><p>같은 문도 컵 뒤에 놓일 때와 의자 뒤에 놓일 때 다르게 읽혔나요? A의 마지막 의자와 B의 마지막 문이 각각 어떤 끝맺음으로 느껴지는지 비교해 보세요. 차이가 없거나 이야기가 떠오르지 않아도 괜찮습니다.</p></div>
  <div className="mt-5 space-y-3 text-sm leading-7"><h4 className="font-semibold">창작자의 설명 · BFI 인터뷰</h4><p>왕가위는 《화양연화》의 반복되는 음악과 계단 장면을 이야기하며, 같은 요소도 다시 등장할 때 의미가 달라진다고 설명했습니다. 이 비교는 그 영화의 장면이나 편집을 재현하지 않습니다.</p><a className="inline-flex min-h-11 items-center underline" href="https://www.bfi.org.uk/sight-and-sound/interviews/wong-kar-wai-mood-love-25" target="_blank" rel="noopener noreferrer">BFI · 왕가위 인터뷰 ↗ <span className="sr-only">새 탭</span></a><p>영화 형식을 더 살펴보고 싶다면 Tony Zhou의 영상 에세이 채널도 참고할 수 있어요. 이 활동은 특정 영상의 분석을 요약하거나 따라 만든 것이 아닙니다.</p><a className="inline-flex min-h-11 items-center underline" href="https://vimeo.com/channels/everyframeapainting/" target="_blank" rel="noopener noreferrer">Every Frame a Painting · 창작자 채널 ↗ <span className="sr-only">새 탭</span></a></div>
  <p className="mt-3 text-xs leading-6">도식과 질문은 Room Rubato가 만들었습니다. 영화 스틸·음악·영상이나 창작자의 표현 방식을 복제하지 않았으며, 공동 개발·추천을 뜻하지 않습니다. 감정 반응의 보편 법칙이나 학습 효과를 검증하는 활동이 아닙니다.</p>
 </section>;
}
