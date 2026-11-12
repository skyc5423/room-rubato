'use client';
import React, {useId,useState} from 'react';
import Link from 'next/link';
import {ArtworkImage} from './ArtworkStudy';
import {artworkDetails} from '@/lib/artwork-details';
import {artworkStudies, type ArtworkStudyData} from '@/lib/artwork-studies';
import type {ArtworkComparisonData} from '@/lib/artwork-comparisons';
const control='inline-flex min-h-11 items-center rounded-xl border border-[#0042AF]/25 px-4 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4';
export function ArtworkComparison({study}:{study:ArtworkComparisonData}) {
 const [revealed,setRevealed]=useState(false);
 const works=study.workIds.map(id=>artworkStudies.find(work=>work.id===id)!);
 return <div className="mx-auto max-w-6xl px-5 pb-20 pt-6 sm:pt-32"><Link href="/compare" className={control}>← 두 작품 사이</Link><p className="mt-8 text-sm">먼저 관찰하고, 맥락을 읽고, 다시 보기</p><h1 className="mt-2 text-3xl font-semibold">{study.title}</h1><p className="mt-4 text-xl leading-8">{study.cue}</p><p className="mt-3 text-xs leading-6">두 작품은 같은 크기의 틀에 표시하지만 실제 크기는 달라요. 화면의 색과 밝기도 원작과 다를 수 있어요.</p>
 <div className="mt-6 grid gap-8 md:grid-cols-2">{works.map((work,index)=><ComparisonArtwork key={work.id} work={work} letter={index===0?'A':'B'}/>)}</div>
 <section className="mt-10 rounded-2xl bg-white/70 p-6" aria-labelledby="compare-observe"><h2 id="compare-observe" className="text-xl font-semibold">눈에 보이는 근거 하나</h2><ol className="mt-4 list-decimal space-y-3 pl-5 leading-7">{study.prompts.map(prompt=><li key={prompt}>{prompt}</li>)}</ol><p className="mt-4 text-sm">마음속으로 답해도 좋아요. 여기서는 답을 수집하거나 점수를 매기지 않아요.</p><button className={`${control} mt-5`} aria-expanded={revealed} aria-controls="comparison-context" onClick={()=>setRevealed(!revealed)}>{revealed?'설명 접고 작품 보기':'작품 설명 읽기'}</button>
 {revealed&&<div id="comparison-context" className="mt-6 space-y-6"><div><h3 className="font-semibold">미술관 자료에서 확인한 내용</h3>{works.map(work=><p key={work.id} className="mt-3 leading-7"><strong>{work.titleKo}</strong>: {work.context} <a className="underline" href={work.sourceUrl} target="_blank" rel="noopener noreferrer">출처 ↗</a></p>)}</div><div><h3 className="font-semibold">Room Rubato의 비교 제안</h3><p className="mt-2 leading-7">{study.reading}</p><p className="mt-3 text-sm leading-6">주제·재료·시대가 다른 작품을 비교하는 관찰 연습이에요. 한 요소만 바꾼 실험이 아니며, 선호를 성격으로 해석하지 않아요.</p></div></div>}</section>
 <section className="mt-8 rounded-2xl bg-[#FEF1D0]/70 p-6"><h2 className="text-xl font-semibold">한 가지 단서를 내 일상으로</h2><p className="mt-3 leading-7">{study.tomorrow}</p><Link className={`${control} mt-5 bg-[#010D6E] text-white`} href={`/notes?lesson=${study.lessonId}`}>이 단서를 직접 바꿔보기 →</Link><p className="mt-3 text-xs leading-6">관찰실의 기존 활동으로 이어집니다. 여는 것만으로 기록이 저장되거나 기존 메모가 바뀌지 않아요.</p></section></div>;
}

/** Each work keeps its own view state, so exploring A never moves B. */
function ComparisonArtwork({work,letter}:{work:ArtworkStudyData;letter:string}) {
 const [detail,setDetail]=useState(false);
 const view=artworkDetails[work.id];
 const imageId=useId();
 return <figure className="min-w-0 rounded-2xl border border-[#0042AF]/15 bg-white/60 p-4 sm:p-5">
  <figcaption><p className="text-xs font-semibold text-[#0042AF]">Room Rubato의 관찰 지점</p><h2 className="mt-2 text-lg font-semibold">{letter} · {work.titleKo}</h2><p className="mt-2 text-sm leading-6">{view?.prompt||work.question}</p></figcaption>
  <div id={imageId} className="mt-4"><ArtworkImage work={work} detail={detail} detailView={view}/></div>
  {view&&<div className="mt-3"><button className={`${control} w-full justify-center bg-white`} aria-label={`${work.titleKo}: ${detail?'작품 전체로 돌아가기':`${view.label} 자세히 보기`}`} aria-pressed={detail} aria-controls={imageId} onClick={()=>setDetail(!detail)}>{detail?'작품 전체로 돌아가기':`${view.label} 자세히 보기`}</button><p className="mt-2 text-xs leading-5" role="status">{detail?`부분 확대 · ${view.label}`:'작품 전체 · 원본 비율 유지'}</p><p className="mt-1 text-xs leading-5 opacity-75">약 600px 이미지의 일부를 화면에서 키워 보여줘요. 새 세부 정보가 생기거나 실제 크기를 비교하는 것은 아니에요.</p></div>}
  <div className="mt-4 border-t border-[#0042AF]/15 pt-3 text-xs leading-5"><p>{work.artist} · {work.date} · {work.medium}</p><p>{work.credit}</p><div className="mt-2 flex flex-wrap gap-2"><a className={control} href={work.image} target="_blank" rel="noopener noreferrer">이미지 크게 열기 ↗<span className="sr-only"> 새 탭</span></a><a className={control} href={work.sourceUrl} target="_blank" rel="noopener noreferrer">The Met 작품 자료 ↗<span className="sr-only"> 새 탭</span></a></div><a className="mt-2 inline-flex min-h-11 items-center underline" href={work.licenseUrl} target="_blank" rel="noopener noreferrer">이미지 CC0 ↗<span className="sr-only"> 새 탭</span></a></div>
 </figure>;
}
