import React from 'react';

/** Static type examples, not a live catalogue or individually verified suitability. */
export function CurationScope({headingLevel=2}:{headingLevel?:2|3}) {
  const Heading=headingLevel===3?'h3':'h2';
  return <>
    <Heading className="font-editorial text-[16px] text-[#010D6E] mb-2">둘러볼 브랜드 · 레퍼런스</Heading>
    <p className="mb-3 text-[13px] leading-6 text-[#010D6E]/85">유형별로 미리 정한 탐색 예시예요. 개인에게 맞는지 검증하거나 실시간 판매·이용 가능 여부를 확인한 목록은 아닙니다. 관심이 가면 현재 제품·서비스의 조건을 직접 비교해 보세요.</p>
  </>;
}
