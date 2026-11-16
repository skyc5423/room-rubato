'use client';
import React, { useEffect, useRef, useState } from 'react';

const control = 'min-h-11 rounded-xl border border-[#0042AF]/40 bg-white px-4 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4';

/** Original editorial prompts inspired by museum education, not an efficacy claim. */
export function ArtworkRevisit({ title, onMemo, onContext }: { title: string; onMemo?: () => void; onContext: () => void }) {
  const [revisit, setRevisit] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const changed = useRef(false);
  useEffect(() => { if (changed.current) heading.current?.focus(); }, [revisit]);
  const change = (next: boolean) => { changed.current = true; setRevisit(next); };
  return <section className="mt-5 rounded-2xl border border-[#0042AF]/20 bg-[#F2EFE7] p-4" aria-label="한 작품 다시 보기">
    <p className="text-xs font-semibold text-[#0042AF]">선택 활동 · 같은 작품에 한 번 더 머물기</p>
    <h4 ref={heading} tabIndex={-1} className="mt-2 text-lg font-semibold">{revisit ? '두 번째 시선 · 달라진 단서 찾기' : '첫 번째 시선 · 눈에 보이는 것부터'}</h4>
    <p className="mt-2 text-sm leading-6">{title}을 편한 만큼 살펴보세요. 시간을 재거나 답의 수를 채울 필요는 없어요.</p>
    {revisit ? <><p className="mt-3 text-sm leading-7">처음 고른 부분을 다시 찾고, 그 주변이나 작품의 가장자리를 살펴보세요. 새로 보이는 것이 없다면 같은 단서에 머물러도 좋아요.</p><p className="mt-3 text-sm leading-7">처음의 인상이 유지되나요? 달라졌다면 눈에 보이는 단서가 달라진 것인지, 해설에서 알게 된 사실 때문인지 구분해보세요.</p><p className="mt-3 rounded-xl bg-white p-3 text-sm leading-6">메모에 첫 문장을 남겨 둔 채 ‘다시 보니: …’를 덧붙여 보세요. 달라지지 않았다는 기록도 괜찮아요.</p></> : <><p className="mt-3 text-sm leading-7">먼저 눈에 들어온 부분 하나를 골라 위치와 눈에 보이는 특징을 말해보세요. 그 부분을 보고 느낀 인상은 별도 문장으로 적어볼 수 있어요.</p><p className="mt-3 rounded-xl bg-white p-3 text-sm leading-6">메모 힌트: ‘처음 본 단서: … / 내가 받은 인상: …’. 무엇을 골랐는지도 하나의 해석이며 정답은 아니에요.</p></>}
    <div className="mt-4 flex flex-wrap gap-2">
      {onMemo && <button type="button" className={control} onClick={onMemo}>기존 관찰 메모로 이동</button>}
      <button type="button" className={control} onClick={() => change(!revisit)}>{revisit ? '첫 질문 다시 보기' : '같은 작품 다시 살펴보기'}</button>
      <button type="button" className={control} onClick={onContext}>작품의 맥락 함께 읽기</button>
    </div>
    <p className="mt-3 text-xs leading-6">이 버튼들은 기록을 바꾸거나 활동을 완료 처리하지 않아요. 관찰 메모는 기존 기록 방식으로 보관됩니다. 완료된 기록은 ‘현재 기록 편집하기’를 선택해야 수정할 수 있어요.</p>
    <p className="mt-3 text-sm leading-6">눈에 보이는 특징만으로 작품의 문화적 의미를 다 알 수는 없어요. 작품 설명과 출처를 함께 읽되, 내 관찰과 새로 알게 된 맥락을 나눠보세요. 성격이나 감상 능력을 점수로 추론하지 않습니다.</p>
    <details className="mt-4 text-xs leading-6"><summary className="min-h-11 cursor-pointer py-2 font-semibold">활동의 참고 자료와 한계</summary>
      <p><a className="underline" href="https://lab.metmuseum.org/non-interpretive-ai-a511583972d5" target="_blank" rel="noopener noreferrer">The Met · 느리게 보기 실험 ↗</a>: 열린 질문과 관찰의 여백을 참고했어요. 단어 선택과 주목할 부분에도 해석이 들어가며, 관찰만으로 문화적 맥락을 대신할 수 없다는 한계도 반영했어요.</p>
      <p className="mt-2"><a className="underline" href="https://www.getty.edu/education/teachers/trippack/activity_post_lookagain.html" target="_blank" rel="noopener noreferrer">Getty · Look Again ↗</a>: 같은 작품을 다시 보며 관찰을 추가하는 교육 활동을 참고했어요. 학생 대상 활동이며 성인 서비스의 효과 검증은 아니에요.</p>
      <p className="mt-2">질문은 Room Rubato가 독립적으로 작성했습니다. 원문 활동지·음성·사진을 복제하지 않으며 기관의 공동 개발·추천을 뜻하지 않아요. 이 기능의 학습 효과나 재방문 증가는 측정하지 않았습니다. 자료 확인: 2026.11.16.</p>
    </details>
  </section>;
}
