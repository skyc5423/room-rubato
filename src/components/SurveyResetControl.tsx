'use client';
import React,{useEffect,useRef,useState} from 'react';
import {usePersonaStore} from '@/lib/persona-store';

/** All survey-reset entry points use the store's serialized, conflict-aware operation. */
export function SurveyResetControl({className='',hasData=true}:{className?:string;hasData?:boolean}) {
 const {deletePersonaData,isHydrated,currentUserId,authUser}=usePersonaStore();
 const owner=authUser?.userUuid||currentUserId||'guest';
 const ownerRef=useRef(owner);ownerRef.current=owner;
 const pending=useRef(false);
 const [busy,setBusy]=useState(false);
 const [feedback,setFeedback]=useState<{owner:string;ok:boolean;text:string}|null>(null);
 useEffect(()=>{setFeedback(null);},[owner]);
 async function reset(){
  if(pending.current||!isHydrated||!hasData)return;
  if(!window.confirm('분야별 설문 응답·응답시간·취향 결과, 오늘의 질문 선택과 추천 반응을 초기화할까요? 되돌릴 수 없습니다. 로그인 계정·동의 기록·관찰실 기록은 유지되며, 다른 기기의 로컬 사본과 백업까지 지우지는 않습니다.'))return;
  const startedOwner=owner;pending.current=true;setBusy(true);setFeedback(null);
  try{
   const result=await deletePersonaData();
   if(ownerRef.current===startedOwner)setFeedback({owner:startedOwner,ok:result.ok,text:result.ok?'설문 응답·취향 결과, 오늘의 질문 선택과 추천 반응을 초기화했어요. 계정·동의 기록·관찰실 기록은 유지됩니다.':result.error||'초기화하지 못했어요. 저장 상태를 확인한 뒤 다시 시도해 주세요.'});
  }catch{
   if(ownerRef.current===startedOwner)setFeedback({owner:startedOwner,ok:false,text:'초기화 결과를 확인하지 못했어요. 저장 상태를 확인해 주세요.'});
  }finally{pending.current=false;setBusy(false);}
 }
 return <div className="max-w-full"><button type="button" className={`${className} min-h-11 disabled:opacity-50`} disabled={busy||!isHydrated||!hasData} aria-busy={busy} onClick={reset}>{busy?'초기화 확인 중…':'설문 응답 초기화'}</button>{feedback?.owner===owner&&<p className="mt-2 max-w-md text-sm leading-6" role={feedback.ok?'status':'alert'}>{feedback.text}</p>}</div>;
}
