'use client';
import React, { useEffect, useRef, useState } from 'react';
import type { ArtworkDetail } from '@/lib/artwork-details';
import { ArtworkRevisit } from './ArtworkRevisit';
import { ObservationGuide } from './ObservationGuide';
import { artworkStudies, type ArtworkStudyData } from '@/lib/artwork-studies';
const control = 'min-h-11 rounded-xl border border-[#0042AF]/25 px-4 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4';

export function ArtworkImage({ work, detail, detailView }: { work: ArtworkStudyData; detail: boolean; detailView?: ArtworkDetail }) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  useEffect(() => {
    // A cached image can finish before hydration attaches the load handler.
    const image = imageRef.current;
    if (image?.complete) setStatus(image.naturalWidth > 0 ? 'loaded' : 'error');
  }, []);

  return <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-[#eae6dc]" aria-busy={status === 'loading'}>
    <img ref={imageRef} src={work.image} alt={detail&&detailView?detailView.alt:`${work.alt}${detail ? ' · 부분 확대 보기' : ''}`} width="600" height="450" loading="lazy"
      onLoad={() => setStatus('loaded')} onError={() => setStatus('error')} aria-hidden={status !== 'loaded'}
      className={`h-full w-full ${detail ? 'object-cover' : 'object-contain'}`}
      style={{ visibility: status === 'loaded' ? 'visible' : 'hidden', ...(detail&&detailView?{position:'absolute',maxWidth:'none',width:`${detailView.crop.sourceWidth/detailView.crop.width*100}%`,height:`${detailView.crop.sourceHeight/detailView.crop.height*100}%`,left:`${-detailView.crop.x/detailView.crop.width*100}%`,top:`${-detailView.crop.y/detailView.crop.height*100}%`}:detail ? { transform: 'scale(1.6)', transformOrigin: work.position } : {}) }}/>
    {status !== 'loaded' && <p role="status" className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm leading-6">
      {status === 'loading' ? '작품 이미지를 불러오는 중이에요.' : '이미지를 불러오지 못했어요. 아래 ‘이미지 크게 열기’에서 다시 확인해 주세요.'}
    </p>}
  </div>;
}

/** Institutional facts and editorial interpretation deliberately remain separate. */
export function ArtworkStudy({ lessonId, onMemo, selectionKey, canRemember=false, canForget=canRemember }: { lessonId: string; onMemo?: () => void; selectionKey?:string; canRemember?:boolean; canForget?:boolean }) {
  const works = artworkStudies.filter(work => work.lessonIds.includes(lessonId));
  const [selection,setSelection]=useState<{key?:string;id:string}>({key:selectionKey,id:''});
  const selected=selection.key===selectionKey?selection.id:'';
  const setSelected=(id:string)=>setSelection({key:selectionKey,id});
  const [selectionError,setSelectionError]=useState('');
  useEffect(()=>{
    if(!selectionKey)return;
    const read=()=>{try{setSelection({key:selectionKey,id:localStorage.getItem(selectionKey)||''});setSelectionError('');}catch{setSelectionError('이 브라우저의 이전 작품 선택을 읽지 못했어요. 작품은 계속 둘러볼 수 있어요.');}};
    read();const sync=(event:StorageEvent)=>{if(event.key===selectionKey||event.key===null)read();};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);
  },[selectionKey]);
  const [detail, setDetail] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const contextHeading = useRef<HTMLHeadingElement>(null);
  const focusContext = useRef(false);
  useEffect(() => { if (revealed && focusContext.current) { contextHeading.current?.focus(); focusContext.current = false; } }, [revealed]);
  const showContext = () => { if (revealed) contextHeading.current?.focus(); else { focusContext.current = true; setRevealed(true); } };
  const work = works.find(item => item.id === selected) || works[0];
  if (!work) return null;
  return <section className="mt-8 border-t border-[#0042AF]/15 pt-8" aria-label="실제 작품에서 살펴보기">
    <p className="text-xs font-semibold tracking-wide text-[#0042AF]">도식에서 작품으로</p>
    <h3 className="mt-2 text-xl font-semibold">실제 작품에서는 어떻게 보일까요?</h3>
    <p className="mt-2 text-sm leading-6">정답을 맞히기보다 눈에 보이는 근거를 하나 찾아보세요. 해설을 읽기 전과 후의 차이를 위의 메모에 함께 남길 수 있어요.</p>
    {selectionError&&<p role="status" className="mt-3 text-sm">{selectionError}</p>}
    {selected&&!works.some(item=>item.id===selected)&&<p role="status" className="mt-3 text-sm">이전에 본 작품을 현재 목록에서 찾지 못해 첫 작품을 보여드려요. 기록과 메모는 바꾸지 않았습니다.</p>}
    <ObservationGuide/>
    <div className="my-4 flex flex-wrap gap-2" aria-label="비교할 작품">{works.map(item => <button key={item.id} className={`${control} ${item.id === work.id ? 'bg-[#010D6E] text-white' : 'bg-white'}`} aria-pressed={item.id === work.id} onClick={() => {setSelected(item.id);setDetail(false);setRevealed(false);if(selectionKey&&canRemember){try{localStorage.setItem(selectionKey,item.id);setSelectionError('');}catch{setSelectionError('작품 선택을 이 브라우저에 기억하지 못했어요. 다음 방문에는 첫 작품이 열릴 수 있습니다. 메모는 바꾸지 않았어요.');}}}}>{item.titleKo}</button>)}</div>
    {selectionKey&&<p className="mb-4 text-xs leading-6">{canRemember?'작품을 직접 고르면 이 사용자·브라우저에서 마지막으로 본 작품을 기억해요. 메모에 연결된 작품 기록이나 클라우드 백업은 아니며 다른 기기로 옮겨지지 않습니다.':'지금 작품을 바꿔 보는 것은 이전 작품 선택이나 메모를 덮어쓰지 않아요.'}</p>}
    {selectionKey&&selected&&<button type="button" disabled={!canForget} className={`${control} mb-4`} onClick={()=>{if(!canForget)return;try{localStorage.removeItem(selectionKey);setSelected('');setSelectionError('');}catch{setSelectionError('이 브라우저의 작품 선택을 지우지 못했어요. 기록과 메모는 바꾸지 않았습니다.');}}}>이 브라우저의 작품 선택 지우기</button>}
    <div className="grid gap-6 lg:grid-cols-2">
      <figure>
        {/* A new node and load state prevent the previous work's pixels surviving a src change. */}
        <ArtworkImage key={`${work.id}:${work.image}`} work={work} detail={detail}/>
        <div className="mt-3 flex flex-wrap gap-2"><button className={control} aria-pressed={detail} onClick={() => setDetail(!detail)}>{detail ? '작품 전체 보기' : `${work.detail} 확대`}</button><a className={`${control} inline-flex items-center`} href={work.image} target="_blank" rel="noopener noreferrer">이미지 크게 열기 ↗<span className="sr-only">새 탭</span></a></div>
        <figcaption className="mt-3 text-xs leading-5"><strong className="block text-sm">{work.titleKo}</strong>{work.artist} · {work.date}<span className="block">{work.title}</span><span className="mt-1 block">{work.credit}</span><a className="underline underline-offset-4" href={work.sourceUrl} target="_blank" rel="noopener noreferrer">The Met 소장품 설명 ↗</a>{' · '}<a className="underline underline-offset-4" href={work.licenseUrl} target="_blank" rel="noopener noreferrer">이미지 CC0</a><span className="block opacity-70">원본 색·비율 유지. 부분 보기는 화면 표시만 확대합니다.</span></figcaption>
      </figure>
      <div><p className="text-xs font-semibold text-[#0042AF]">{work.concept}</p><h4 className="mt-2 text-lg font-semibold leading-7">{work.question}</h4><ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-6">{work.prompts.map(prompt => <li key={prompt}>{prompt}</li>)}</ul>
        <ArtworkRevisit key={work.id} title={work.titleKo} onMemo={onMemo} onContext={showContext}/>
        <button className={`${control} mt-5 bg-white`} aria-expanded={revealed} onClick={() => setRevealed(!revealed)}>{revealed ? '해설 접고 다시 보기' : '관찰했어요 · 작품의 맥락 읽기'}</button>
        {revealed && <div className="mt-4 space-y-4 text-sm leading-7"><div><h5 ref={contextHeading} tabIndex={-1} className="font-semibold">미술관이 설명하는 맥락</h5><p>{work.context}</p></div><div><h5 className="font-semibold">Room Rubato의 관찰 제안</h5><p>{work.interpretation}</p></div><div className="rounded-xl bg-[#FEF1D0]/70 p-4"><h5 className="font-semibold">다른 분야로 옮겨 보기</h5><p>{work.bridge}</p></div><p className="text-xs opacity-70">작품 정보·이미지 권리 확인: {work.verifiedAt}. 감상 제안은 미술관이나 연구자가 검증한 성격 검사가 아닙니다.</p></div>}
      </div>
    </div>
  </section>;
}
