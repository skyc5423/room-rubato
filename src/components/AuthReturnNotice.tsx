'use client';
import React,{useEffect,useState} from 'react';
import {supabase} from '@/lib/supabase';
import {PENDING_AUTH_CONSENT_KEY} from '@/lib/pending-auth-consent';
import {failedAuthReturnPath} from '@/lib/auth-return';

/** Inform about explicit failed return URLs; session ownership stays with Supabase. */
export function AuthReturnNotice(){
 const [notice,setNotice]=useState<{cleanupFailed:boolean}|null>(null);
 useEffect(()=>{
  let alive=true;
  const href=window.location.href;
  const clean=failedAuthReturnPath(href);
  if(clean===null)return;
  let pendingConsent:string|null=null;
  try{pendingConsent=sessionStorage.getItem(PENDING_AUTH_CONSENT_KEY);}catch{ /* Optional temporary staging only. */ }
  async function finish(){
   // The SDK starts initialization at construction. Await its same promise so URL
   // cleanup cannot race callback consumption or touch an ordinary successful URL.
   try{if(supabase)await supabase.auth.initialize();}catch{ /* Never show raw provider details. */ }
   if(!alive||window.location.href!==href)return;
   let cleanupFailed=false;
   try{window.history.replaceState(window.history.state,'',new URL(href).origin+clean);}catch{cleanupFailed=true;}
   // Do not erase a new attempt started while the old SDK initialization settled.
   try{if(pendingConsent!==null&&sessionStorage.getItem(PENDING_AUTH_CONSENT_KEY)===pendingConsent)sessionStorage.removeItem(PENDING_AUTH_CONSENT_KEY);}catch{ /* Expiring staging; not a durable consent/account record. */ }
   setNotice({cleanupFailed});
  }
  void finish();
  return()=>{alive=false;};
 },[]);
 if(!notice)return null;
 return <aside aria-label="인증 링크 안내" className="mx-auto mt-6 max-w-3xl rounded-xl border border-[#0042AF]/30 bg-[#FFFDF7] p-5 text-sm leading-7 sm:mt-28">
  <p role="alert">돌아온 인증 링크에 오류가 있어 요청을 마치지 못했어요. 취소되었거나 링크가 만료되었을 수 있습니다. 계정 메뉴에서 현재 로그인 상태를 확인하고, 필요하면 다시 시도해 주세요.</p>
  <p className="mt-2">이 안내가 기존 계정에서 로그아웃되었다는 뜻은 아닙니다. 비밀번호 재설정이나 계정 복구가 완료된 것도 아니에요.</p>
  {notice.cleanupFailed&&<p className="mt-2">주소의 인증 정보를 정리하지 못했어요. 현재 주소를 복사해 공유하지 말고 홈으로 이동해 주세요.</p>}
  <div className="mt-3 flex flex-wrap gap-3"><button type="button" className="min-h-11 rounded-lg border border-[#0042AF]/40 px-4" onClick={()=>setNotice(null)}>안내 닫기</button><a className="inline-flex min-h-11 items-center underline" href="/">홈으로 이동</a></div>
 </aside>;
}
