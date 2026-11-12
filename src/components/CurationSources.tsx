import React from 'react';
import {curationSources} from '@/lib/curation-sources';

/** Reading sources is optional and never writes a preference or opens an embedded player. */
export function CurationSources({id}:{id:string}) {
  const sources=curationSources[id];
  if(!sources)return null;
  return <details className="mt-3 text-xs leading-6">
    <summary className="min-h-11 cursor-pointer py-2 text-[#0042AF] underline underline-offset-4">설명에 사용한 자료</summary>
    <ul className="space-y-3">{sources.map(source=><li key={source.url}>
      <a className="inline-flex min-h-11 items-center text-[#0042AF] underline underline-offset-4" href={source.url} target="_blank" rel="noopener noreferrer">{source.title} ↗<span className="sr-only"> 새 탭</span></a>
      <p className="text-[#010D6E]/80">{source.scope}</p>
    </li>)}</ul>
    <p className="mt-3 text-[#010D6E]/75">자료 확인: 2026.11.12. 사실 설명의 근거이며, 이 탐색 예시를 기관이 추천하거나 개인에게 맞는다고 검증한 것은 아닙니다.</p>
  </details>;
}
