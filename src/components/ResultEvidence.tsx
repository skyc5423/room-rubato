import React from 'react';
import type {MasterDomain} from '@/lib/types';
import {summarizeRecordedAxes} from '@/lib/result-evidence';

export function ResultEvidence({domain,scores}:{domain:Pick<MasterDomain,'axes'|'slug'>;scores:unknown}) {
  return <div className="space-y-2 text-sm leading-7 text-[#010D6E]/85" aria-label="저장된 응답 요약">
    <p>{summarizeRecordedAxes(domain.axes,scores)}</p>
    <p className="text-xs leading-6">유형 이름은 다음에 살펴볼 방향을 붙인 탐색용 이름이에요. 실제 성격이나 능력을 검증한 결과는 아닙니다.</p>
    {domain.slug==='economy'&&<p className="text-sm leading-6">이 결과는 투자 적합성·위험성향 평가나 투자 권유가 아닙니다. 자산·부채·소득·투자 기간을 반영하지 않으며 금융 결정을 대신할 수 없어요.</p>}
  </div>;
}
