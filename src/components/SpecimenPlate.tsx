'use client';

import React, {useState} from 'react';
import { getRoomObjectByDomainId } from '@/lib/room-objects';

interface SpecimenPlateProps {
  variant: 'A' | 'B';
  domainId: number;
  questionId?: string;
  visualTone: string;
}

const DOMAIN_PREFIXES = [
  'fas',
  'spc',
  'gas',
  'art',
  'mus',
  'cin',
  'lit',
  'trv',
  'tec',
  'eco',
  'wrk',
  'phi',
] as const;

/**
 * 12개 도메인 × 10~12문항 × 2선택지(A/B) = 모든 실생활 선택지 각각에 1:1로 매칭되는 전용 일러스트 맵
 */
export const QUESTION_OPTION_IMAGES: Record<string, { A: string; B: string }> = {
  ...Object.fromEntries(
    DOMAIN_PREFIXES.flatMap((prefix) =>
      Array.from({ length: 12 }, (_, idx) => {
        const qId = `${prefix}-q${idx + 1}`;
        return [
          qId,
          {
            A: `/artwork/options/${qId}-A.jpg`,
            B: `/artwork/options/${qId}-B.jpg`,
          },
        ];
      })
    )
  ),

  // 오늘의 질문 (Daily Pulse)
  'daily-pulse-1': {
    A: '/artwork/options/fas-q1-A.jpg',
    B: '/artwork/options/fas-q3-B.jpg',
  },
  'daily-pulse-2': {
    A: '/artwork/options/cin-q2-B.jpg',
    B: '/artwork/options/cin-q2-A.jpg',
  },
};

function ChoiceImage({src,variant}:{src:string;variant:'A'|'B'}) {
  const [failed,setFailed]=useState(false);
  if(failed)return <p role="status" className="px-4 pt-8 text-center text-sm leading-6">선택지 {variant} 이미지를 불러오지 못했어요. 그림 대신 아래 설명을 읽고 비교해 주세요.</p>;
  return <img src={src} alt={`선택지 ${variant} 설명용 일러스트`} onError={()=>setFailed(true)} className="w-full h-full object-contain rounded-lg transition-transform duration-500 group-hover:scale-[1.03]"/>;
}

export function SpecimenPlate({
  variant,
  domainId,
  questionId,
  visualTone,
}: SpecimenPlateProps) {
  const roomObj = getRoomObjectByDomainId(domainId);

  const imagePair = questionId ? QUESTION_OPTION_IMAGES[questionId] : undefined;

  const rawUrl = imagePair
    ? imagePair[variant]
    : roomObj?.artworkUrl ?? '/artwork/room-colored.jpg';
  const imageUrl = `${rawUrl}?v=6`;

  const notes = visualTone
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="w-full mb-4">
      {/* Clear, Uncropped Visual Illustration of Option A vs Option B */}
      <div className="relative w-full h-[240px] sm:h-[268px] rounded-xl bg-[#F7EFE1] border border-[#0042AF]/25 overflow-hidden flex items-center justify-center p-2">
        <ChoiceImage key={imageUrl} src={imageUrl} variant={variant}/>

        <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#010D6E] text-[#FEF1D0] text-[12px] font-semibold shadow-sm">
          선택 {variant}
        </span>
      </div>

      {/* Clear Material / Style Keywords */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {notes.map((note, idx) => (
          <span
            key={idx}
            className="px-2.5 py-0.5 rounded-md bg-[#FEF1D0]/80 border border-[#0042AF]/20 text-[12px] text-[#010D6E] font-medium"
          >
            {note}
          </span>
        ))}
      </div>
    </div>
  );
}
