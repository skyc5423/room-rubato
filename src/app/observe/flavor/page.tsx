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
 </article>;
}
