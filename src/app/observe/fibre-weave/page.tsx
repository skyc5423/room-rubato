import React from 'react';
import Link from 'next/link';
import {FibreWeaveStudy} from '@/components/FibreWeaveStudy';
export const metadata={title:'섬유와 조직 | Room Rubato',description:'실크와 새틴 조직의 차이를 가상 설명과 자체 평직 도식으로 살펴봅니다. 구매나 기록 없이 읽는 선택 활동입니다.'};
export default function FibreWeavePage(){return <article className="mx-auto max-w-3xl px-5 pb-20 pt-6 text-[#010D6E] sm:pt-36"><Link href="/explore" className="inline-flex min-h-11 items-center text-sm underline underline-offset-4">← 콘텐츠 둘러보기</Link><p className="mt-4 text-sm text-[#0042AF]">패션 · 설명 나눠 읽기 · 약 2–3분</p><h1 className="mt-2 text-3xl font-semibold leading-tight">실크와 새틴은 같은 종류의 말일까요?</h1><FibreWeaveStudy/><section aria-labelledby="next-activity-title" className="mt-8 rounded-2xl border border-[#0042AF]/25 bg-[#FFFDF7] p-5 sm:p-6">
  <p className="text-sm font-semibold text-[#0042AF]">원한다면, 다음 관찰 하나</p>
  <h2 id="next-activity-title" className="mt-2 text-xl font-semibold">다음에는 색의 주변을 바꿔보세요</h2>
  <p className="mt-3 text-sm leading-7">소재와 짜임을 나눠봤다면, 이번에는 같은 색이 주변색에 따라 어떻게 달라 보이는지 비교해보세요. 실제 옷감의 재질이나 핏을 재현하는 활동은 아니에요.</p>
  <Link href="/notes?lesson=contrast" className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0042AF] px-5 py-3 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">주변색 직접 바꿔 보기 →</Link>
  <p className="mt-3 text-xs leading-6">로그인 없이 시작할 수 있어요. 지금 읽은 내용은 완료 기록으로 저장되지 않으며, 다음 활동의 선택·메모는 기본적으로 이 브라우저에 저장돼요.</p>
 </section></article>;}
