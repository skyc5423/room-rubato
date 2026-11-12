'use client';
import React,{useState} from 'react';

/** Original conceptual diagram, not a museum floorplan or lighting simulation. */
export function ArchitectureCaseStudy(){
 const [layer,setLayer]=useState<'sight'|'walk'|'both'>('sight');
 const descriptions={sight:'주황 점선은 사람이 선 자리에서 유리 너머를 보는 방향입니다. 유리를 통과해 걸을 수 있다는 뜻은 아닙니다.',walk:'파란 실선은 아래쪽 열린 통로를 돌아가는 이동 경로입니다. 벽과 유리를 통과하지 않습니다.',both:'시선은 유리를 지나지만, 이동 경로는 열린 통로로 돌아갑니다. 같은 공간에서도 두 연결은 다릅니다.'};
 return <section className="mt-8 border-t border-[#0042AF]/15 pt-8" aria-labelledby="architecture-case-title">
  <p className="text-xs font-semibold text-[#0042AF]">주거에서 미술관으로 · 국내 사례와 한국 연구</p>
  <h3 id="architecture-case-title" className="mt-2 text-xl font-semibold">창이 있다고 모두 같은 방식으로 열리는 건 아니다</h3>
  <p className="mt-3 text-sm leading-7">앞의 주거 사례에서는 유리 구획 너머의 작업 공간을 보았어요. 이번에는 밖이 보이는 곳, 빛이 들어오는 곳, 사람이 지나는 곳을 나눠보세요.</p>
  <div className="mt-5 grid gap-6 lg:grid-cols-2">
   <figure className="min-w-0">
    <svg viewBox="0 0 420 270" role="img" aria-label={`시선과 동선의 개념 도식. ${descriptions[layer]}`} className="w-full rounded-2xl bg-[#f6f2e8]">
     <rect x="25" y="25" width="370" height="220" rx="6" fill="#e8e1d2" stroke="#506460" strokeWidth="4"/>
     <path d="M210 25V80 M210 150V195" stroke="#506460" strokeWidth="10"/>
     <rect x="205" y="80" width="10" height="70" fill="#89bdc9" stroke="#326b7c"/>
     <circle cx="80" cy="115" r="9" fill="#193a39"/>
     <rect x="326" y="96" width="34" height="38" rx="3" fill="#ac7650"/>
     {(layer==='sight'||layer==='both')&&<path data-layer="sight" d="M92 115H318 M307 108L318 115L307 122" fill="none" stroke="#9b4b12" strokeWidth="3" strokeDasharray="7 5"/>}
     {(layer==='walk'||layer==='both')&&<path data-layer="walk" d="M80 130V218H285V142 M278 153L285 142L292 153" fill="none" stroke="#0042AF" strokeWidth="3"/>}
     <text x="80" y="92" textAnchor="middle" fontSize="13" fill="#193a39">서 있는 곳</text>
     <text x="230" y="76" fontSize="13" fill="#193a39">유리</text>
     <text x="230" y="178" fontSize="13" fill="#193a39">벽</text>
     <text x="216" y="239" fontSize="12" fill="#193a39">열린 통로</text>
     <text x="343" y="85" textAnchor="middle" fontSize="13" fill="#193a39">보이는 대상</text>
    </svg>
    <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="시선과 동선 비교">{([['sight','시선만 보기'],['walk','동선만 보기'],['both','함께 비교하기']] as const).map(([value,label])=><button key={value} type="button" aria-pressed={layer===value} onClick={()=>setLayer(value)} className={`min-h-11 rounded-xl border border-[#0042AF]/30 px-3 text-sm ${layer===value?'bg-[#010D6E] text-white':'bg-white'}`}>{label}</button>)}</div>
    <p className="mt-3 text-sm leading-6" role="status">{descriptions[layer]}</p>
    <figcaption className="mt-2 text-xs leading-6">Room Rubato가 만든 설명용 평면 도식입니다. 뮤지엄 SAN이나 앞의 아파트 도면을 재현하지 않았으며, 채광·방음·접근성이나 실제 이동 거리를 계산하지 않습니다. 조작은 기록되지 않아요.</figcaption>
   </figure>
   <div className="space-y-4 text-sm leading-7">
    <div><h4 className="font-semibold">기관이 설명하는 공간 · 뮤지엄 SAN</h4><p>본관은 돌로 둘러싼 외피 안에 콘크리트 전시공간을 둡니다. 공식 소개는 복도 창에 담기는 풍경과 돌담·처마 사이로 들어오는 빛을 설명합니다.</p><a className="inline-flex min-h-11 items-center underline" href="https://app.museumsan.org/museumsan/museum/building_introduce.jsp?m=1&s=2" target="_blank" rel="noopener noreferrer">뮤지엄 SAN 건축소개 · 기관 설명 ↗</a></div>
    <div><h4 className="font-semibold">한국 연구에서 읽는 관점</h4><p>김신혜·김창성(2017)은 안도 다다오의 박물관 사례에서 전시실과 연결 공간이 빛을 다르게 받아들이는 방식에 주목했습니다. 문헌과 현장 답사를 바탕으로 한 사례 분석이며, 편안함이나 집중력의 효과를 검증한 연구는 아닙니다.</p><a className="inline-flex min-h-11 items-center underline" href="https://doi.org/10.12813/kieae.2017.17.5.061" target="_blank" rel="noopener noreferrer">공간구성과 빛 · 연구 논문 ↗</a></div>
    <div className="rounded-xl bg-[#edf2ee] p-4"><h4 className="font-semibold">Room Rubato의 관찰 제안</h4><p>창 너머의 풍경과 빛이 닿는 벽을 따로 찾아보세요. 밖이 보이는 곳과 빛이 들어오는 곳은 같은가요? 눈으로 이어지는 길과 실제 걸을 수 있는 길은 어떻게 다른가요?</p><p className="mt-2">가까운 방이나 복도에서도 한 곳에 멈춰 비교할 수 있어요. 걷기 어렵거나 외출하지 않아도 괜찮습니다.</p></div>
    <p className="text-xs leading-6 opacity-70">자료 확인: 2026.11.12. 기관·연구자와 공동 개발한 활동이 아닙니다. 사진·도면·논문 그림을 복제하지 않았으며, 위 질문과 도식은 독립적인 관찰 제안입니다.</p>
   </div>
  </div>
 </section>;
}
