'use client';

import React, { useState } from 'react';

const notes = [
  {
    id: 'light', label: '빛과 그림자', title: '같은 형태도 빛에 따라 달라 보여요',
    question: '아래 두 도형에서 어느 쪽이 더 입체적으로 보이나요?',
    term: '키아로스쿠로 · Chiaroscuro',
    body: '회화에서 밝고 어두운 톤의 대비로 형태와 부피를 드러내는 방법입니다. 여기서는 원의 크기와 위치를 그대로 두고 명암만 바꿨어요. 더 입체적으로 보이는 쪽과 더 마음에 드는 쪽이 꼭 같을 필요는 없습니다.',
    tryThis: '주변의 컵을 보세요. 가장 밝은 곳과 그림자의 경계를 찾아보면, 색보다 빛이 먼저 눈에 들어올 수 있어요.',
    limit: '직접 만든 설명용 도식입니다. 실제 회화나 조명의 효과를 그대로 재현한 실험은 아닙니다.',
    sources: [{ label: 'National Gallery · Chiaroscuro', url: 'https://www.nationalgallery.org.uk/paintings/glossary/chiaroscuro' }],
  },
  {
    id: 'minimal', label: '미술과 일상', title: '미니멀리즘은 그냥 물건이 적다는 뜻일까요?',
    question: '비어 있는 방을 좋아하는 것과 반복된 기하학 작품을 좋아하는 것은 같을까요?',
    term: '미니멀리즘 · Minimalism',
    body: '일상에서 말하는 단순한 생활 방식과 1960년대 미술 운동은 구분할 필요가 있어요. 미니멀리즘 미술을 볼 때는 작품의 모양만 아니라 반복, 재료, 놓인 공간, 내 몸과의 거리도 관찰해 보세요.',
    tryThis: '똑같은 물건 세 개를 나란히 놓고 가까이에서, 조금 떨어져서 번갈아 보세요. 물건보다 간격이 눈에 들어오는 순간이 있나요?',
    limit: '단순한 공간을 좋아한다고 특정 미술 운동이나 성격까지 좋아한다고 판단하지 않습니다.',
    sources: [{ label: 'PBS The Art Assignment · The Case for Minimalism', url: 'https://www.youtube.com/watch?v=XEi0Ib-nNGo' }, { label: 'MoMA · 미술 용어집', url: 'https://www.moma.org/momaorg/shared/flattened_pages/moma_learning/glossary/' }],
  },
  {
    id: 'space', label: '공간을 보는 법', title: '열려 있지만 구분된 공간',
    question: '방을 나누면서도 답답하지 않게 만들 수 있을까요?',
    term: '공간 구획 · Zoning',
    body: '공간을 나누는 방법은 벽 하나만이 아니에요. Never Too Small이 소개한 폴란드의 58㎡ 집은 유리 파티션으로 작업 공간을 구분하면서 빛과 시선이 이어지게 했습니다. 바닥이 보이는 벽걸이 수납장도 사용했어요.',
    tryThis: '집이나 카페에서 창까지 시선이 닿는 길을 찾아보세요. 가구, 커튼, 벽 중 무엇이 공간을 나누고 있나요?',
    limit: '한 집의 설계 사례이지 모든 집에 맞는 처방은 아닙니다. 유리로 구분해도 시각적 프라이버시나 방음이 충분한지는 별도로 살펴봐야 합니다.',
    sources: [{ label: 'Never Too Small · 폴란드 58㎡ 아파트 (2026.11.05)', url: 'https://www.nevertoosmall.com/post/5-small-space-design-ideas-from-a-colourful-58sqm-624sqft-apartment-in-poland' }],
  },
];

export function TasteNotebook() {
  const [selected, setSelected] = useState('light');
  const note = notes.find((item) => item.id === selected)!;
  return (
    <section aria-labelledby="notebook-heading" className="mx-auto max-w-3xl px-5 pb-16 pt-28 text-[#010D6E]">
      <p className="text-sm text-[#0042AF]">취향 노트 · 3편</p>
      <h1 id="notebook-heading" className="mt-3 text-3xl font-semibold tracking-tight">좋아하는 것, 조금 더 자세히</h1>
      <p className="mt-4 leading-7">이름을 몰라도 감상할 수 있어요. 빛, 간격, 공간처럼 한 가지 단서부터 살펴보세요.</p>
      <div className="my-7 flex flex-wrap gap-2" aria-label="노트 선택">
        {notes.map((item) => <button key={item.id} type="button" aria-pressed={selected === item.id} onClick={() => setSelected(item.id)} className={`min-h-11 rounded-full border border-[#0042AF] px-4 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ${selected === item.id ? 'bg-[#0042AF] text-white' : 'bg-white text-[#0042AF]'}`}>{item.label}</button>)}
      </div>
      <article className="rounded-3xl border border-[#0042AF]/20 bg-white/80 p-5 sm:p-8" aria-labelledby="note-title">
        <h2 id="note-title" className="text-2xl font-semibold leading-snug">{note.title}</h2>
        <p className="mt-4 leading-7">{note.question}</p>
        {note.id === 'light' && <figure className="my-6">
          <svg viewBox="0 0 560 220" role="img" aria-label="같은 크기의 원 두 개. 왼쪽은 균일한 회색, 오른쪽은 밝음에서 어두움으로 명암이 변합니다." className="w-full rounded-2xl bg-[#F6F3EC]">
            <defs><radialGradient id="notebook-shade" cx="30%" cy="25%" r="80%"><stop offset="0%" stopColor="#eee"/><stop offset="65%" stopColor="#999"/><stop offset="100%" stopColor="#444"/></radialGradient></defs>
            <circle cx="150" cy="100" r="65" fill="#999"/><circle cx="410" cy="100" r="65" fill="url(#notebook-shade)"/>
            <text x="150" y="197" textAnchor="middle" fontSize="16" fill="#010D6E">균일한 톤</text><text x="410" y="197" textAnchor="middle" fontSize="16" fill="#010D6E">명암을 준 톤</text>
          </svg>
          <figcaption className="mt-2 text-xs leading-5 text-[#010D6E]/70">Room Rubato가 직접 만든 도식. 화면 설정에 따라 명암이 다르게 보일 수 있어요.</figcaption>
        </figure>}
        <p className="mt-6 text-sm font-semibold text-[#0042AF]">{note.term}</p>
        <p className="mt-2 leading-7">{note.body}</p>
        <div className="my-6 rounded-2xl bg-[#FEF1D0] p-5"><h3 className="font-semibold">지금 한번 살펴보기</h3><p className="mt-2 leading-7">{note.tryThis}</p></div>
        <p className="text-sm leading-6 text-[#010D6E]/80">{note.limit}</p>
        <div className="mt-6 border-t border-[#0042AF]/15 pt-5"><h3 className="text-sm font-semibold">더 읽고 보기</h3><ul className="mt-2 space-y-2">{note.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-block py-2 text-sm text-[#0042AF] underline underline-offset-4">{source.label} <span className="sr-only">(새 탭)</span><span aria-hidden="true">↗</span></a></li>)}</ul></div>
      </article>
      <p className="mt-5 text-sm leading-6 text-[#010D6E]/70">출처를 참고해 Room Rubato가 작성한 감상 안내입니다. 이 페이지는 답변을 수집하거나 취향·성격 점수에 반영하지 않습니다.</p>
    </section>
  );
}
