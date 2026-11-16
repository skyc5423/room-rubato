'use client';
import React,{useEffect,useRef} from 'react';
import Link from 'next/link';
/** Next 15 segment boundary. Never display/log exception messages or reset user storage. */
export default function PageError({reset}:{error:Error&{digest?:string};reset?:()=>void}){
 const heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{heading.current?.focus();},[]);
 return <section className="mx-auto max-w-2xl px-5 pb-20 pt-8 text-[#010D6E] sm:pt-32" aria-labelledby="page-error-title">
  <p className="text-sm font-semibold text-[#0042AF]">ROOM RUBATO · 화면 오류</p>
  <h1 id="page-error-title" ref={heading} tabIndex={-1} className="mt-3 text-3xl font-semibold">이 화면을 불러오지 못했어요</h1>
  <p className="mt-4 leading-7">잠시 후 다시 시도하거나 다른 활동으로 이동할 수 있어요. 반복되면 지금 하던 동작과 페이지 이름을 알려주세요. 비밀번호나 개인 메모를 보낼 필요는 없습니다.</p>
  <div className="mt-6 flex flex-wrap gap-3">{reset&&<button type="button" onClick={reset} className="min-h-11 rounded-xl bg-[#0042AF] px-4 text-sm text-white">이 화면 다시 시도</button>}<Link className="inline-flex min-h-11 items-center rounded-xl border border-[#0042AF]/30 bg-white px-4 text-sm underline underline-offset-4" href="/notes">관찰실로 이동</Link><Link className="inline-flex min-h-11 items-center px-4 text-sm underline underline-offset-4" href="/">홈으로 이동</Link></div>
  <p className="mt-5 text-sm leading-7">다시 시도는 화면을 다시 여는 동작이며, 저장된 기록을 삭제하거나 초기화하지 않습니다. 저장 완료 전 입력이 모두 복구된다고 보장할 수는 없어요. 돌아온 화면의 저장 안내를 확인해 주세요.</p>
 </section>;
}
