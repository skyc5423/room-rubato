'use client';
import React,{useState} from 'react';

/** Original Korean text, not an excerpt, translation or imitation of a named poet. */
export const literatureLines={
 A:['창가에 컵을 놓았다.','빛이 식탁 끝에 머문다.'],
 B:['창가에','컵을 놓았다. 빛이','식탁 끝에 머문다.'],
} as const;
export function LiteratureLineStudy(){
 const [marked,setMarked]=useState(false);
 return <section className="mt-8 border-t border-[#0042AF]/15 pt-8" aria-labelledby="literature-line-title">
  <p className="text-xs font-semibold text-[#0042AF]">형태의 간격에서 문장의 행으로 · 선택 활동</p>
  <h3 id="literature-line-title" className="mt-2 text-xl font-semibold">같은 말, 다른 행 끝</h3>
  <p className="mt-3 text-sm leading-7">단어 순서와 문장부호는 그대로 두고 행을 나눠 보았어요. 눈으로 읽거나 편한 속도로 소리 내어 읽어보세요. 소리를 녹음하거나 읽는 속도를 측정하지 않습니다.</p>
  <div className="mt-5 grid gap-4 sm:grid-cols-2">{(['A','B'] as const).map(version=><figure key={version} className="min-w-0 rounded-2xl border border-[#0042AF]/20 bg-white/70 p-4">
   <figcaption className="mb-4 text-sm font-semibold">{version} · {literatureLines[version].length}행</figcaption>
   <ol aria-label={`${version} 행별 읽기`} className="space-y-3">{literatureLines[version].map((line,index)=><li key={index} className="flex items-baseline gap-3 leading-8"><span className="shrink-0 text-xs text-[#0042AF]">{index+1}행</span><span className="min-w-0">{line}{marked&&<span aria-hidden="true" className="ml-1 text-[#0042AF]">↵</span>}</span></li>)}</ol>
  </figure>)}</div>
  <button type="button" aria-pressed={marked} className="mt-4 min-h-11 rounded-xl border border-[#0042AF]/30 bg-white px-4 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4" onClick={()=>setMarked(!marked)}>행 끝 표시 {marked?'끄기':'켜기'}</button>
  <p role="status" className="mt-2 text-xs leading-6">{marked?'↵는 의도한 행 끝입니다.':'행 번호마다 의도한 한 행입니다.'} 좁은 화면이나 큰 글자에서는 한 행이 화면의 여러 줄로 접힐 수 있어요.</p>
  <div className="mt-5 rounded-xl bg-[#edf2ee] p-4 text-sm leading-7"><h4 className="font-semibold">Room Rubato의 관찰 제안</h4><p>A의 ‘놓았다.’와 B의 ‘창가에’ 뒤에서 다음 말을 기다리는 느낌은 같았나요? B의 둘째 행에서는 한 문장이 끝나고 다른 문장이 시작합니다. 문장의 끝과 행의 끝을 각각 찾아보세요.</p><p className="mt-2">행 끝마다 반드시 멈춰 읽을 필요는 없어요. 차이가 느껴지지 않아도 괜찮습니다. 행 수와 여백도 함께 달라지므로 한 가지 효과를 측정하는 실험은 아닙니다.</p></div>
  <details className="mt-4 text-sm leading-7"><summary className="min-h-11 cursor-pointer py-2 font-semibold">문학 용어와 출처 읽기</summary><p>Academy of American Poets는 행을 시의 기본 단위로 설명하고, 문장이나 구가 행 경계를 넘어 이어지는 것을 enjambment라고 설명합니다. B에서 뜻이 다음 행으로 이어지는 자리를 찾아볼 수 있어요. 영어 시의 운율 규칙을 한국어에 그대로 적용한 예시는 아닙니다.</p><div className="flex flex-wrap gap-x-4"><a className="inline-flex min-h-11 items-center underline" href="https://poets.org/glossary/line" target="_blank" rel="noopener noreferrer">Line · 원문 ↗<span className="sr-only"> 새 탭</span></a><a className="inline-flex min-h-11 items-center underline" href="https://poets.org/glossary/enjambment" target="_blank" rel="noopener noreferrer">Enjambment · 원문 ↗<span className="sr-only"> 새 탭</span></a></div><p className="text-xs leading-6">예문과 질문은 Room Rubato의 독립 작성입니다. 원문의 시·해설을 복제하지 않았으며 기관의 추천이나 공동 개발을 뜻하지 않습니다. 감상 능력·성격·교육 효과를 측정하지 않습니다. 자료 확인: 2026.11.16.</p></details>
  <p className="mt-3 text-xs leading-6">이 비교의 A·B는 위 도식의 A·B와 별개입니다. 조작은 저장되거나 기존 선택에 반영되지 않아요.</p>
 </section>;
}
