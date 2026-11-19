'use client';
import React, {useState} from 'react';
import {flavorExamples, flavorSource} from '@/lib/flavor-language';

export function FlavorLanguageStudy() {
  const [selected,setSelected]=useState(0);
  const example=flavorExamples[selected];
  return <div data-flavor-study className="mt-6 space-y-6">
    <p className="text-sm leading-7">맛있다는 말 앞에 어떤 느낌이 있었을까요? 아래는 Room Rubato가 만든 가상의 말입니다. 무엇을 먹거나 사거나 냄새 맡을 필요 없이, 문장만 읽으며 감각을 묘사하는 말과 평가를 나눠보세요.</p>
    <section aria-labelledby="flavor-example-title" className="rounded-2xl border border-[#0042AF]/20 bg-white/70 p-5 sm:p-6">
      <h2 id="flavor-example-title" className="text-xl font-semibold">1. 한 표현 골라 읽기</h2>
      <p className="mt-2 text-sm leading-7">뜻을 맞히는 퀴즈가 아닙니다. 세 표현은 표준화된 감각 분류가 아니며, 말하는 사람과 맥락에 따라 뜻이 달라질 수 있어요.</p>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="가상 예문 선택">{flavorExamples.map((item,index)=><button key={item.id} data-flavor-example={item.id} type="button" aria-pressed={selected===index} onClick={()=>setSelected(index)} className={`min-h-11 rounded-xl border border-[#0042AF]/30 px-4 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ${selected===index?'bg-[#010D6E] text-white':'bg-white'}`}>{item.label}</button>)}</div>
      <div className="mt-5" aria-live="polite" aria-atomic="true"><p className="text-xs text-[#0042AF]">독립 작성한 가상 예문 · {example.label}</p><p className="mt-2 text-lg leading-8">{example.sentence}</p></div>
      <p className="mt-4 text-sm leading-7">어떤 느낌을 말했고, 무엇을 좋아하거나 원하지 않았나요? 답을 입력하지 않고 마음속으로 구분해도 됩니다.</p>
      <details key={example.id} data-flavor-explanation={example.id} className="mt-4 border-t border-[#0042AF]/15 pt-2">
        <summary className="min-h-11 cursor-pointer py-2 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">2. 감각과 평가 나눠 읽기</summary>
        <dl className="mt-3 space-y-4 text-sm leading-7">
          <div><dt className="font-semibold">문장 속 감각 단서</dt><dd>{example.clues}</dd></div>
          <div><dt className="font-semibold">좋다·싫다와 구별하기</dt><dd>{example.evaluation}</dd></div>
          <div><dt className="font-semibold">다른 평가로 말해본다면</dt><dd>{example.alternative}</dd></div>
          <div><dt className="font-semibold">이 말만으로 알 수 없는 것</dt><dd>{example.limit}</dd></div>
        </dl>
      </details>
    </section>
    <section aria-labelledby="flavor-concepts-title" className="rounded-2xl bg-[#edf2ee] p-5 sm:p-6">
      <h2 id="flavor-concepts-title" className="text-xl font-semibold">한 입의 느낌에도 여러 단서가 있어요</h2>
      <p className="mt-3 text-sm leading-7">기본맛에는 적어도 단맛·신맛·쓴맛·짠맛·감칠맛 다섯 가지가 있습니다. 향, 식감, 온도와 매운 느낌 같은 화학적 자극도 함께 경험을 이룹니다. 여기서는 이 함께 느끼는 경험을 ‘풍미’라고 부릅니다.</p>
      <p className="mt-2 text-sm leading-7">식감은 입안에서 느끼는 질감, 온도는 따뜻하거나 차가운 느낌을 말해요. 화학적 자극은 매운 음식의 화끈거림 같은 느낌이며 기본맛과 구별합니다. 실제로 경험해 확인하는 과제가 아닙니다.</p>
      <a href={flavorSource} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center text-sm underline underline-offset-4">NIDCD · 맛을 느끼는 과정 설명 ↗<span className="sr-only"> 새 탭</span></a>
      <p className="text-xs leading-6">미국 국립 청각·의사소통장애 연구소(NIDCD) 자료의 ‘How does your sense of taste work?’ 부분을 개념 참고로 읽었습니다. 위 예문·질문은 기관의 문항이나 어휘 분류를 옮긴 것이 아니며, 공동 개발·추천을 뜻하지 않습니다. 건강 상태를 확인하거나 진단하는 활동이 아닙니다.</p>
    </section>
    <section aria-labelledby="flavor-return-title" className="border-t border-[#0042AF]/20 pt-5">
      <h2 id="flavor-return-title" className="text-lg font-semibold">3. 다른 예문에도 같은 질문 던지기</h2>
      <p className="mt-2 text-sm leading-7">다른 표현을 골라 “어떤 감각을 말했나?”와 “그 느낌을 어떻게 평가했나?”를 다시 나눠보세요. 차이가 분명하지 않은 말은 단정하지 않고 남겨두어도 괜찮아요. 다음 방문에도 같은 세 예문을 읽을 수 있습니다.</p>
      <p className="mt-3 text-xs leading-6">선택과 해설 열림은 이 화면에서만 바뀝니다. 입력란·정답·점수·완료 기록이 없고, 설문 응답이나 관찰실 메모를 읽거나 바꾸지 않습니다. 성격이나 음식 취향을 예측하지 않으며 학습 효과를 측정하지 않습니다. 새로고침하면 첫 예문으로 돌아갑니다.</p>
    </section>
  </div>;
}
