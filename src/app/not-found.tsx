import React from 'react';
import Link from 'next/link';
export default function NotFound(){
 return <section className="mx-auto max-w-2xl px-5 pb-20 pt-8 text-[#010D6E] sm:pt-32" aria-labelledby="missing-page-title">
  <p className="text-sm font-semibold text-[#0042AF]">ROOM RUBATO · 페이지를 찾을 수 없어요</p>
  <h1 id="missing-page-title" className="mt-3 text-3xl font-semibold">다른 문으로 들어가 볼까요?</h1>
  <p className="mt-4 leading-7">주소가 잘못되었거나 더 이상 열리지 않는 페이지입니다. 작품 목록이나 관찰실에서 다시 골라보세요.</p>
  <nav aria-label="다시 시작할 곳" className="mt-6 flex flex-wrap gap-3">{[['/compare','작품 비교 목록'],['/notes','관찰실 전체 활동'],['/','홈으로']] .map(([href,label])=><Link key={href} href={href} className="inline-flex min-h-11 items-center rounded-xl border border-[#0042AF]/30 bg-white px-4 text-sm text-[#0042AF] underline underline-offset-4">{label}</Link>)}</nav>
  <p className="mt-5 text-sm leading-6">이 안내는 기록 삭제를 뜻하지 않아요. 여기서 저장된 기록을 초기화하지 않습니다.</p>
 </section>;
}
