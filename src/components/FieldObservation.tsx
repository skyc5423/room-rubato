import React from 'react';
import { fieldObservations } from '@/lib/field-observations';
import type { TasteLesson } from '@/lib/taste-lessons';

/** Native disclosure only: deliberately no input, effect, storage or progress state. */
export function FieldObservation({ lesson }: { lesson: TasteLesson }) {
  const prompt = fieldObservations[lesson.diagram];
  if (!prompt) return null;
  return <details data-field-observation={lesson.id} className="mt-4 rounded-2xl border border-[#0042AF]/20 bg-[#FEF1D0]/40 p-4 sm:p-5">
    <summary className="min-h-11 cursor-pointer py-2 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">일상에서 다시 써보기 · 선택 활동</summary>
    <h2 className="mt-3 text-lg font-semibold">{prompt.title}</h2>
    <p className="mt-2 text-sm leading-7">완료한 기록은 그대로 두고, 익숙한 물건에서 같은 단서를 찾아보세요. 지금 하지 않거나 관찰만 해도 괜찮아요. 주변 조건도 달라질 수 있는 개인 관찰이지, 과학적으로 통제된 실험은 아닙니다.</p>
    <dl className="mt-4 space-y-4 text-sm leading-7">
      {([['유지할 조건', prompt.keep], ['하나만 바꿔보기', prompt.change], ['관찰할 근거', prompt.evidence], ['단정하지 않을 점', prompt.limit]] as const).map(([title, text]) => <div key={title}><dt className="font-semibold">{title}</dt><dd>{text}</dd></div>)}
    </dl>
    <p className="mt-4 text-xs leading-6">이 카드에는 입력란이 없고, 열거나 닫아도 선택·메모·완료 상태를 저장하거나 바꾸지 않습니다. 남기고 싶다면 개인 종이에 적어보세요. 다른 기기로 진행 상태가 이어지지는 않아요.</p>
    <h3 className="mt-4 text-sm font-semibold">개념을 더 읽을 자료</h3>
    <p className="mt-1 text-xs leading-6">아래는 기존 활동의 개념 참고 자료입니다. 위 일상 비교는 Room Rubato의 독립 안내이며 원문 저자의 실험 절차나 검증된 학습 과제가 아닙니다.</p>
    <ul className="mt-2 space-y-1 text-sm">{lesson.sources.map(source => <li key={source.url}><a className="inline-flex min-h-11 items-center underline underline-offset-4" href={source.url} target="_blank" rel="noopener noreferrer">{source.title} ↗<span className="sr-only"> 새 탭</span></a><span className="ml-2 text-xs">{source.kind}</span></li>)}</ul>
  </details>;
}
