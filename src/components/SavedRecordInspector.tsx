'use client';

import React, { useId, useState } from 'react';
import type { PersonaState } from '@/lib/persona-store';

/** An optional local view of existing state, not an export or validated inference. */
export function SavedRecordInspector({ state }: { state: PersonaState }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <section className="paper-sheet rounded-3xl p-6">
      <h2 className="font-editorial text-[18px] text-[#010D6E] mb-2">저장된 기록 확인</h2>
      <p className="text-[13px] text-[#0042AF] leading-6 mb-3">
        현재 불러온 기록을 JSON 형식으로 볼 수 있습니다. 답변과 응답 시간이 포함되므로 화면을 공유할 때는 주의하세요. 이 표시는 검증된 성격 검사 결과가 아닙니다.
      </p>
      <button type="button" aria-expanded={open} aria-controls={id}
        className="min-h-11 rounded-full border border-[#0042AF]/40 px-4 py-2 text-[13px] text-[#0042AF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
        onClick={() => setOpen(value => !value)}>
        {open ? '기록 접기' : 'JSON 기록 펼치기'}
      </button>
      <div id={id} hidden={!open}>
        {open && <>
          <p className="text-[12px] text-[#0042AF] leading-6 mt-4 mb-3">
            responseTimeMs는 선택까지 걸린 시간(밀리초)입니다. didShift는 오늘의 질문에서 처음 답과 상황을 읽은 뒤의 최종 답이 달랐는지를 나타냅니다. 답을 바꾼 이유나 동조 성향을 판단하는 값이 아닙니다.
          </p>
          <pre tabIndex={0} aria-label="현재 불러온 기록 JSON"
            className="bg-[#FEF1D0]/75 border border-[#0042AF]/20 rounded-2xl p-4 text-[12px] text-[#010D6E] overflow-auto max-h-[300px] focus-visible:outline focus-visible:outline-2">
            {JSON.stringify(state, null, 2)}
          </pre>
        </>}
      </div>
    </section>
  );
}
