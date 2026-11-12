import React from 'react';
import type {MasterDomain} from '@/lib/types';
import {ResultEvidence} from './ResultEvidence';
import {recordedAxisScore} from '@/lib/result-evidence';
import {recordedChoice} from '@/lib/recorded-choice';

export function UnavailableResult({domain,scores,log}:{domain:MasterDomain;scores:unknown;log:readonly unknown[]}) {
 return <section className="space-y-4" aria-label="확인할 수 없는 저장 유형">
  <h2 className="text-xl font-semibold">저장된 유형을 확인할 수 없어요</h2>
  <p className="text-sm leading-7">현재 유형 목록에서 이 기록의 이름을 찾지 못했어요. 다른 유형으로 대신 표시하거나 기록을 다시 계산하지 않았습니다. 저장된 점수와 선택은 아래에서 확인할 수 있어요.</p>
  <ResultEvidence domain={domain} scores={scores}/>
  <details><summary className="min-h-11 cursor-pointer py-2 underline">저장된 점수와 문항별 선택</summary>
   <ul className="space-y-2 text-sm leading-6">{domain.axes.map(axis=>{const value=recordedAxisScore(scores,axis.axisKey);return <li key={axis.axisKey}>{axis.leftLabel} / {axis.rightLabel}: {value===undefined?'저장된 점수 없음':`${value} (−1~1 설문 점수)`}</li>;})}</ul>
   <ol className="mt-4 space-y-2 text-sm leading-6">{domain.questions.map((q,index)=>{const choice=recordedChoice(log,domain.id,q.id);return <li key={q.id}>Q{index+1} · {choice?`선택 ${choice}: ${choice==='A'?q.optionA.title:q.optionB.title}`:'저장된 선택 없음'}</li>;})}</ol>
  </details>
 </section>;
}
