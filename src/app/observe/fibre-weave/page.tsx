import React from 'react';
import Link from 'next/link';
import {FibreWeaveStudy} from '@/components/FibreWeaveStudy';
export const metadata={title:'섬유와 조직 | Room Rubato',description:'실크와 새틴 조직의 차이를 가상 설명과 자체 평직 도식으로 살펴봅니다. 구매나 기록 없이 읽는 선택 활동입니다.'};
export default function FibreWeavePage(){return <article className="mx-auto max-w-3xl px-5 pb-20 pt-6 text-[#010D6E] sm:pt-36"><Link href="/explore" className="inline-flex min-h-11 items-center text-sm underline underline-offset-4">← 콘텐츠 둘러보기</Link><p className="mt-4 text-sm text-[#0042AF]">패션 · 설명 나눠 읽기 · 약 2–3분</p><h1 className="mt-2 text-3xl font-semibold leading-tight">실크와 새틴은 같은 종류의 말일까요?</h1><FibreWeaveStudy/></article>;}
