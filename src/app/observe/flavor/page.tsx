import React from 'react';
import Link from 'next/link';
import {FlavorLanguageStudy} from '@/components/FlavorLanguageStudy';
export const metadata={title:'풍미의 언어 | Room Rubato',description:'가상의 예문으로 맛·향·식감·온도·자극과 개인의 평가를 나눠 읽습니다. 시식이나 기록 없이 살펴보는 선택 활동입니다.'};
export default function FlavorPage(){
 return <article className="mx-auto max-w-3xl px-5 pb-20 pt-6 text-[#010D6E] sm:pt-28">
  <Link href="/notes" className="inline-flex min-h-11 items-center text-sm underline underline-offset-4">← 관찰실로 돌아가기</Link>
  <p className="mt-4 text-sm text-[#0042AF]">미식 · 문장으로 살펴보기 · 약 3–4분</p>
  <h1 className="mt-2 text-3xl font-semibold">풍미의 언어</h1>
  <p className="mt-3 text-lg leading-8">느낌을 설명하는 말과 좋아한다는 말을 나눠보기</p>
  <FlavorLanguageStudy/>
 <section aria-labelledby="next-activity-title" className="mt-8 rounded-2xl border border-[#0042AF]/25 bg-[#FFFDF7] p-5 sm:p-6">
  <p className="text-sm font-semibold text-[#0042AF]">원한다면, 다음 관찰 하나</p>
  <h2 id="next-activity-title" className="mt-2 text-xl font-semibold">다른 감각에서도 맥락을 살펴보세요</h2>
  <p className="mt-3 text-sm leading-7">감각 설명과 평가를 나눠봤다면, 이번에는 같은 그림도 주변 맥락에 따라 다르게 보이는지 비교해보세요. 맛이나 향을 재현하는 활동은 아니에요.</p>
  <Link href="/notes?lesson=context" className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0042AF] px-5 py-3 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">그림의 맥락 비교하기 →</Link>
  <p className="mt-3 text-xs leading-6">로그인 없이 시작할 수 있어요. 지금 읽은 내용은 완료 기록으로 저장되지 않으며, 다음 활동의 선택·메모는 기본적으로 이 브라우저에 저장돼요.</p>
 </section></article>;
}
