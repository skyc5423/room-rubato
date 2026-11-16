'use client';
import React,{useState} from 'react';
import {fibreWeaveExamples,plainWeave,fibreWeaveSources} from '@/lib/fibre-weave';
export function FibreWeaveStudy(){
 const [selected,setSelected]=useState(0);
 const [revision,setRevision]=useState(0);
 const example=fibreWeaveExamples[selected];
 return <div data-fibre-study className="mt-6 space-y-6">
  <p className="text-sm leading-7">‘실크’와 ‘새틴 조직’은 서로 다른 것을 설명하는 말입니다. 옷이나 원단을 준비하지 않고, 가상 설명 두 개에서 무엇이 같고 다른지 읽어보세요. 정답을 채점하는 퀴즈가 아닙니다.</p>
  <details key={`terms:${revision}`} className="rounded-2xl border border-[#0042AF]/20 bg-white/70 p-5" data-fibre-terms><summary className="min-h-11 cursor-pointer py-2 font-semibold">실크와 새틴 조직, 무엇을 말할까요?</summary><p className="mt-3 text-sm leading-7">실크는 섬유를, 새틴 조직은 실이 교차하는 방식을 가리킵니다. 섬유는 무엇으로 만들었는지, 조직은 어떻게 짰는지 나눠 읽는 단서예요. 판매명에서 ‘새틴’이라는 말을 쓰는 방식은 다를 수 있어 여기서는 ‘새틴 조직’으로 범위를 한정합니다.</p></details>
  <section aria-labelledby="fibre-examples-title" className="rounded-2xl border border-[#0042AF]/20 bg-white/70 p-5">
   <h2 id="fibre-examples-title" className="text-xl font-semibold">가상 설명에서 같은 것 찾기</h2>
   <div role="group" aria-label="비교할 가상 설명" className="mt-4 flex flex-wrap gap-2">{fibreWeaveExamples.map((item,index)=><button key={item.id} data-fibre-example={item.id} type="button" aria-pressed={selected===index} onClick={()=>setSelected(index)} className={`min-h-11 rounded-xl border border-[#0042AF]/30 px-4 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ${selected===index?'bg-[#010D6E] text-white':'bg-white'}`}>{item.title}</button>)}</div>
   <div className="mt-4 grid gap-3 sm:grid-cols-2" aria-live="polite" aria-atomic="true"><p className="rounded-xl bg-[#edf2ee] p-4 text-sm leading-7">{example.a}</p><p className="rounded-xl bg-[#edf2ee] p-4 text-sm leading-7">{example.b}</p></div>
   <p className="mt-3 text-sm leading-7">바뀐 것은 섬유 이름인가요, 조직 이름인가요? 어느 쪽이 더 좋을지는 이 설명만으로 판단하지 않습니다.</p>
   <details key={`${example.id}:${revision}`} data-fibre-explanation={example.id} className="mt-3"><summary className="min-h-11 cursor-pointer py-2 font-semibold">두 설명 나눠 읽기</summary><p className="mt-2 text-sm leading-7">{example.explanation}</p><p className="mt-2 text-sm leading-7">실의 굵기, 밀도, 가공 등은 제시하지 않았어요. 실제 제품의 품질·광택·촉감·편안함·가격이나 나에게 맞는지는 추론할 수 없습니다.</p></details>
  </section>
  <section aria-labelledby="plain-weave-title" className="rounded-2xl bg-[#edf2ee] p-5">
   <h2 id="plain-weave-title" className="text-xl font-semibold">평직: 한 번 위로, 한 번 아래로</h2>
   <p className="mt-3 text-sm leading-7">세로로 놓인 실을 날실, 가로로 지나는 실을 씨실이라고 합니다. 아래는 평직의 교차 순서만 나타낸 6×6 설명용 도식입니다. 새틴 조직을 그린 것이 아닙니다.</p>
   <figure className="mt-4"><svg viewBox="0 0 240 240" role="img" aria-label="평직 교차 도식. 첫째 줄의 세로 날실은 가로 씨실보다 위, 아래를 번갈아 지나고 둘째 줄은 아래, 위로 시작합니다. 이 두 줄을 세 번 반복합니다." className="mx-auto w-full max-w-64 rounded-xl bg-[#FFFDF7]">{plainWeave.flatMap((row,r)=>row.map((above,c)=><g key={`${r}:${c}`} transform={`translate(${c*36+12} ${r*36+12})`}><path d="M18 0V36 M0 18H36" stroke="#a8aca4" strokeWidth="10"/><path d={above?'M18 0V36':'M0 18H36'} stroke="#FFFDF7" strokeWidth="16"/><path d={above?'M18 0V36':'M0 18H36'} stroke="#0042AF" strokeWidth="10"/></g>))}</svg><figcaption className="mt-3 text-xs leading-6">Room Rubato의 자체 도식입니다. 선의 방향과 끊김으로 위아래를 표시합니다. 원단 사진이나 기관 그림을 옮기지 않았으며 실제 촉감·광택을 재현하지 않습니다.</figcaption></figure>
   <div className="mt-3"><h3 className="font-semibold">교차 순서를 글로 읽기</h3><p className="mt-2 text-sm leading-7">각 위치에서 세로 날실이 가로 씨실보다 위에 있는지 아래에 있는지 읽습니다. 1·3·5행은 ‘위, 아래, 위, 아래, 위, 아래’, 2·4·6행은 ‘아래, 위, 아래, 위, 아래, 위’입니다. 위아래는 실 사이의 관계이지 원단의 앞면·뒷면 이름이 아닙니다.</p></div>
  </section>
  <section aria-labelledby="fibre-sources-title" className="border-t border-[#0042AF]/20 pt-5"><h2 id="fibre-sources-title" className="text-lg font-semibold">설명의 근거와 다음에 볼 단서</h2><p className="mt-2 text-sm leading-7">다음에 옷 설명을 읽을 때 무엇으로 만들었는지와 어떻게 짰는지를 나눠 찾아보세요. 이름만 있고 다른 정보가 없다면 알 수 없는 점은 그대로 남겨둡니다. 구매나 원단 만지기는 필요하지 않아요.</p><ul className="mt-3 text-sm">{fibreWeaveSources.map(source=><li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline underline-offset-4">{source.title} ↗<span className="sr-only"> 새 탭</span></a></li>)}</ul><p className="mt-3 text-xs leading-6">기관 자료는 섬유와 조직 개념의 참고입니다. 가상 예문과 도식은 독립 작성했으며 기관의 그림·사진·문장을 복제하거나 공동 개발·추천을 뜻하지 않습니다. 학습 효과를 검증한 활동은 아닙니다.</p></section>
  <button type="button" data-fibre-reset onClick={()=>{setSelected(0);setRevision(n=>n+1);}} className="min-h-11 rounded-xl border border-[#0042AF]/30 px-4 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">처음 예문으로 · 해설 닫기</button>
  <p className="text-xs leading-6">선택과 펼침은 이 화면에서만 바뀝니다. 입력·점수·완료 기록을 저장하거나 수집하지 않고, 기존 설문·관찰실 기록도 바꾸지 않습니다. 새로고침하면 첫 예문과 닫힌 해설로 돌아갑니다.</p>
 </div>;
}
