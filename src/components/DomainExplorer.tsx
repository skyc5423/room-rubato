'use client';

import React, { useState } from 'react';
import { ALL_MASTER_DOMAINS } from '@/lib/domains-index';

interface Props {
  completedIds: number[];
  ready: boolean;
  onSelect: (id: number) => void;
}

/** A visible, non-spatial alternative to the illustrated room hotspots. */
export function DomainExplorer({ completedIds, ready, onSelect }: Props) {
  const [filter, setFilter] = useState<'all' | 'new' | 'done'>('all');
  const domains = ALL_MASTER_DOMAINS.filter((domain) =>
    filter === 'all' || (filter === 'done' ? completedIds.includes(domain.id) : !completedIds.includes(domain.id))
  );
  return (
    <section aria-labelledby="domain-explorer-title" className="border-b border-[#0042AF]/20 bg-[#FFF9EB] px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="domain-explorer-title" className="text-xl font-semibold">궁금한 분야부터 골라보세요</h2>
            <p className="mt-2 text-sm text-[#010D6E]/75">전부 답할 필요는 없어요. 목록에서 바로 시작하거나 아래 방의 물건을 눌러도 돼요.</p>
          </div>
          <div aria-label="분야 목록 필터" className="flex flex-wrap gap-2">
            {([['all', '전체'], ['new', '아직 안 본 분야'], ['done', '내 결과']] as const).map(([value, label]) => (
              <button key={value} type="button" disabled={!ready} aria-pressed={filter === value} onClick={() => setFilter(value)} className={`min-h-11 rounded-full border px-4 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 ${filter === value ? 'border-[#0042AF] bg-[#0042AF] text-white' : 'border-[#0042AF]/25 bg-white text-[#0042AF]'}`}>{label}</button>
            ))}
          </div>
        </div>
        {!ready ? <p role="status" className="mt-6 text-sm">저장된 분야를 확인하고 있어요.</p> : domains.length === 0 ? (
          <p role="status" className="mt-6 rounded-xl border border-[#0042AF]/15 p-5 text-sm">{filter === 'done' ? '아직 완료한 분야가 없어요. 전체에서 궁금한 분야를 골라보세요.' : '모든 분야를 살펴봤어요. 내 결과에서 다시 확인할 수 있어요.'}</p>
        ) : (
          <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {domains.map((domain) => {
              const done = completedIds.includes(domain.id);
              return <li key={domain.id}><button type="button" onClick={() => onSelect(domain.id)} className="flex min-h-24 w-full flex-col items-start justify-between gap-3 rounded-xl border border-[#0042AF]/20 bg-white p-4 text-left transition-colors hover:border-[#0042AF] hover:bg-[#F6F3E9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
                <span className="font-semibold">{domain.shortTitle}</span>
                <span className="text-xs text-[#0042AF]">{done ? '내 결과 다시 보기 →' : `${domain.questions.length}문항 · 시작하기 →`}</span>
              </button></li>;
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
