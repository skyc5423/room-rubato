'use client';

import React, { useId } from 'react';
import Link from 'next/link';
import { ArtworkImage } from './ArtworkStudy';
import { artworkStudies } from '@/lib/artwork-studies';

const works = ['437881', '437853'].map(id => artworkStudies.find(work => work.id === id)!);
const textLink = 'inline-flex min-h-11 items-center underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4';

/** An editorial doorway into existing content, with no personal state or recording. */
export function HomeObservationPreview({embedded=false}:{embedded?:boolean}={}) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className={embedded?"min-w-0 text-[#010D6E]":"border-b border-[#0042AF]/20 bg-[#F6F3E9] px-5 py-10 text-[#010D6E] sm:px-8 sm:py-12"}>
      <div className="mx-auto max-w-6xl">
        <div className={`mb-6 flex flex-col gap-4 ${embedded?'':'md:flex-row md:items-end md:justify-between'}`}>
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-[#0042AF]">두 작품 사이 · 약 3분</p>
            <h2 id={headingId} className="mt-2 text-2xl font-semibold leading-snug sm:text-3xl">빛이 만드는 경계</h2>
            <p className="mt-3 text-base leading-7">주전자의 테두리와 물 위의 반사를 번갈아 보세요. 어디가 또렷하고, 어디가 이어져 보이나요?</p>
          </div>
          <Link href="/compare/light-and-edges" className="inline-flex min-h-12 shrink-0 items-center justify-center bg-[#0042AF] px-5 py-3 text-base font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">
            두 작품 자세히 보기 →
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {works.map((work, index) => (
            <figure key={work.id} className="min-w-0">
              <ArtworkImage work={work} detail={false}/>
              <figcaption className="mt-3 border-t border-[#0042AF]/20 pt-3 text-sm leading-6">
                <p className="font-semibold">{index === 0 ? 'A' : 'B'} · {work.titleKo}</p>
                <p>{work.artist} · {work.date}</p>
                <a className={textLink} href={work.image} target="_blank" rel="noopener noreferrer">이미지 크게 열기 ↗<span className="sr-only"> 새 탭</span></a>
                <details className="mt-1">
                  <summary className="min-h-11 cursor-pointer py-2 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">작품 출처와 이미지 이용 정보</summary>
                  <div className="border-l border-[#0042AF]/20 pl-3 text-sm leading-6">
                    <p>{work.title} · {work.medium}</p>
                    <p>{work.credit}</p>
                    <div className="flex flex-wrap gap-x-4">
                      <a className={textLink} href={work.sourceUrl} target="_blank" rel="noopener noreferrer">The Met 작품 자료 ↗<span className="sr-only"> 새 탭</span></a>
                      <a className={textLink} href={work.licenseUrl} target="_blank" rel="noopener noreferrer">이미지 CC0 ↗<span className="sr-only"> 새 탭</span></a>
                    </div>
                  </div>
                </details>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-5 max-w-3xl text-sm leading-6 text-[#010D6E]/80">작품 전체를 원본 비율로 보여드려요. 두 이미지의 화면 크기는 실제 작품 크기를 뜻하지 않아요.</p>
      </div>
    </section>
  );
}
