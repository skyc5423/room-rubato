'use client';
import React,{useEffect,useState} from 'react';
import Link from 'next/link';
import {usePersonaStore} from '@/lib/persona-store';
import {emptyJournal,journalKey,parseJournal} from '@/lib/taste-journal';
import {notebookReturn} from '@/lib/notebook-return';
const control='inline-flex min-h-11 items-center text-sm underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4';
export function NotebookReturn({withArtworkPreview=false}:{withArtworkPreview?:boolean}={}){
 const {authUser,isHydrated}=usePersonaStore();
 const owner=authUser?.userUuid||'guest';
 const [snapshot,setSnapshot]=useState<{owner:string;progress:ReturnType<typeof notebookReturn>}|null>(null);
 const [unavailable,setUnavailable]=useState(false);
 useEffect(()=>{
  if(!isHydrated)return;
  const refresh=()=>{
   try{setSnapshot({owner,progress:notebookReturn(parseJournal(localStorage.getItem(journalKey(owner))))});setUnavailable(false);}
   catch{setSnapshot({owner,progress:notebookReturn(emptyJournal())});setUnavailable(true);}
  };
  refresh();
  const storage=(event:StorageEvent)=>{if(event.key===journalKey(owner)||event.key===null)refresh();};
  window.addEventListener('storage',storage);window.addEventListener('focus',refresh);window.addEventListener('pageshow',refresh);
  return()=>{window.removeEventListener('storage',storage);window.removeEventListener('focus',refresh);window.removeEventListener('pageshow',refresh);};
 },[owner,isHydrated]);
 const ready=isHydrated&&snapshot?.owner===owner;
 const progress=ready?snapshot.progress:null;
 const target=progress?.target;
 const label=progress?.kind==='continue'?'멈춘 곳에서 이어보기':progress?.kind==='bookmark'?'저장해 둔 단서 다시 보기':'내 기록과 다시 보기';
 return <aside className="rounded-2xl border border-[#0042AF]/20 bg-white/70 p-5" aria-label="관찰실 시작과 이어보기">
  <p className="text-sm font-semibold">{target?`${progress.completed}/8개 탐색을 마쳤어요`:'8개의 감상 활동 · 한 편에 3–4분'}</p>
  {target?<><h2 className="mt-3 text-xl font-semibold">{target.title}</h2><p className="mt-2 text-sm leading-6">{progress.kind==='continue'?'처음 고른 답이 저장돼 있어요. 하던 활동을 이어가세요.':progress.kind==='bookmark'?'다시 보고 싶어 저장해 둔 활동이에요.':'전에 남긴 선택과 이유를 다시 펼쳐보세요. 완료한 기록은 편집을 선택하기 전까지 그대로 유지돼요.'}</p><Link className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#0042AF] px-5 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4" href={`/notes?lesson=${target.id}`}>{label} →</Link></>:<><p className="mt-2 text-xs leading-6 text-[#010D6E]/70">설문 완료나 로그인 없이 시작할 수 있어요. 먼저 두 작품을 비교하거나, 직접 도식을 바꿔보세요.</p><Link className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#0042AF] px-5 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4" href={withArtworkPreview?'/notes':'/compare'}>{withArtworkPreview?'직접 바꾸며 관찰하기 →':'두 작품 함께 감상하기 →'}</Link></>}
  <div className="mt-2 flex flex-col items-start">{(!withArtworkPreview||target)&&<Link href="/notes" className={control}>관찰실 전체 활동 보기 →</Link>}{target&&!withArtworkPreview&&<Link href="/compare" className={control}>두 작품 비교하며 새롭게 보기 →</Link>}<a href="#room-stage" className={control}>아래 방에서 분야별 취향 고르기 ↓</a></div>
  <p className="mt-3 text-xs leading-5 text-[#010D6E]/70">{ready&&unavailable?'브라우저 기록을 읽지 못했어요. 활동은 계속 둘러볼 수 있어요.':!ready?'저장된 탐색을 확인하고 있어요.':'이 브라우저의 현재 사용자 기록을 기준으로 이어볼 활동을 보여줘요. 저장 범위와 관리 방법은 관찰실에서 확인할 수 있어요.'}</p>
 </aside>;
}
