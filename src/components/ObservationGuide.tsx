import React from 'react';

/** Independently written prompts, not a reproduction/translation of any worksheet. */
export function ObservationGuide() {
  return <details className="mt-4 rounded-2xl border border-[#0042AF]/20 bg-[#F2EFE7] p-4">
    <summary className="min-h-11 cursor-pointer font-semibold">작품에서 근거 찾기 · 세 가지 질문</summary>
    <p className="mt-3 text-sm leading-6">해설을 읽기 전에 한 질문만 골라도 좋아요. 정답이나 성격 점수를 만드는 단계가 아니라, 감상 이유를 구체적으로 말해보는 선택 활동입니다.</p>
    <ol className="mt-4 list-decimal space-y-4 pl-5 text-sm leading-6">
      <li><strong>어느 부분이 먼저 눈에 들어왔나요?</strong><p>작품의 위치와 눈에 보이는 특징을 함께 말해보세요. 예를 들어 ‘오른쪽의 작은 밝은 면’처럼 색의 이름, 밝기, 크기를 구분해볼 수 있어요.</p></li>
      <li><strong>그 부분과 내가 느낀 인상은 어떻게 연결되나요?</strong><p>‘쓸쓸하다’는 느낌과 ‘인물 주변이 비어 있다’는 관찰을 나눠보세요. 같은 단서를 보고 다른 느낌을 받는 해석도 가능한지 생각해보세요.</p></li>
      <li><strong>전체와 부분을 바꿔 보면 설명도 달라지나요?</strong><p>부분 확대를 본 뒤 전체로 돌아오세요. 다른 작품도 볼 수 있다면 같은 단서 하나를 찾아 비교해보세요. 작품마다 색·구도·주제가 함께 달라지므로, 차이의 원인이 한 가지라고 단정하지 않습니다.</p></li>
    </ol>
    <p className="mt-4 rounded-xl bg-white/70 p-3 text-sm leading-6">메모 힌트: “나는 ___ 부분의 ___ 때문에 더 머물고 싶다. 전체로 돌아오니 ___도 보였다.” 위 탐색 메모에 남길 수 있어요. 이미 완료한 기록은 ‘현재 기록 편집하기’를 선택해야 수정됩니다.</p>
    <h4 className="mt-5 text-sm font-semibold">학습 개념 참고 · 무엇을 참고했나요?</h4>
    <ul className="mt-2 space-y-3 text-xs leading-6">
      <li><a className="underline" href="https://www.mmca.go.kr/educations/educationsDetail.do?eduId=202504140000684" target="_blank" rel="noopener noreferrer">국립현대미술관 · 감상 더하기+ ↗</a><p>청소년이 질문을 따라 작품의 주제·맥락·의미를 살펴보는 자기주도 감상 자료. 중·고등학생 대상이며, 이 서비스의 성인 학습 효과를 검증한 자료는 아닙니다.</p></li>
      <li><a className="underline" href="https://www.getty.edu/education/k-12-learning/describe-listen-draw/vocabulary-for-describing-an-artwork/" target="_blank" rel="noopener noreferrer">Getty · 작품을 묘사하는 어휘 ↗</a><p>색상·명도·강도, 크기·대비에 의한 강조, 시선의 흐름과 반복을 구분하는 미술 어휘를 참고했습니다.</p></li>
      <li><a className="underline" href="https://pz.harvard.edu/resources/see-think-wonder" target="_blank" rel="noopener noreferrer">Harvard Project Zero · 감상 사고 루틴 관련 읽기 ↗</a><p>관찰과 해석을 구분하고 해석의 근거를 묻는 교육적 관점을 참고했습니다. 원본 활동지나 질문 순서를 번역·복제한 활동은 아닙니다.</p></li>
    </ul>
    <p className="mt-3 text-xs leading-5 opacity-70">Room Rubato가 독립적으로 작성한 질문입니다. 기관 공동 개발·추천이나 효과 검증을 뜻하지 않습니다. 자료 확인: 2026.11.12. 원문 활동지와 영상은 링크에서 확인하며 이 서비스에 복제하지 않습니다.</p>
  </details>;
}
