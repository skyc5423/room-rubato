import React from 'react';
import Link from 'next/link';

/** Editorial domain-to-activity navigation. Deliberately does not accept user scores. */
const activities:Record<string,{href:string;label:string;question:string}>={
 'gastronomy-scent':{href:'/observe/flavor',label:'풍미의 언어 살펴보기',question:'고소하다·산뜻하다는 말에는 어떤 감각과 평가가 함께 담길까요? 시식 없이 가상 예문을 읽어보세요.'},
 'visual-art':{href:'/compare/light-and-edges',label:'두 작품의 빛과 경계 비교하기',question:'같은 그림 안에서도 또렷한 가장자리와 흐린 가장자리를 함께 찾을 수 있을까요?'},
 'space-interior':{href:'/notes?lesson=space',label:'시선과 동선 직접 비교하기',question:'너머가 보이는 것과 직접 걸어갈 수 있는 것은 어떻게 다를까요?'},
 music:{href:'/notes?lesson=syncopation',label:'기준 박과 두 리듬 들어보기',question:'따라가기 편한 리듬과 다시 듣고 싶은 리듬은 같을까요? 소리 없이도 읽을 수 있어요.'},
 literature:{href:'/notes?lesson=rhythm',label:'간격과 문장의 행 나눔 살펴보기',question:'같은 말도 행 끝을 바꾸면 다르게 읽힐까요? 활동 아래의 문학 비교를 찾아보세요.'},
 cinema:{href:'/notes?lesson=context',label:'그림의 맥락과 컷 순서 비교하기',question:'같은 그림을 다른 순서로 볼 때 끝맺음은 어떻게 느껴지나요? 활동 아래의 영화 순서 비교로 이어집니다.'},
 fashion:{href:'/notes?lesson=contrast',label:'주변색에 따른 인상 비교하기',question:'같은 색도 주변색이 바뀌면 다르게 보이나요? 실제 옷의 재질이나 핏을 재현하는 활동은 아니에요.'},
};
export function ResultObservationBridge({slug}:{slug:string}){
 const activity=activities[slug];
 return <aside className="my-5 rounded-xl border border-[#0042AF]/25 bg-white p-4 text-[#010D6E]" aria-label="결과에서 관찰로 이어보기">
  <h3 className="text-sm font-semibold">유형 이름 다음에는, 직접 비교해보세요</h3>
  <p className="mt-2 text-sm leading-6">{activity?.question||'명암·간격·공간 같은 단서를 직접 바꾸고, 선택한 이유를 내 말로 남겨보세요.'}</p>
  <Link data-observation-bridge className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-[#0042AF] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4" href={activity?.href||'/notes'}>{activity?.label||'관찰실에서 관심 있는 활동 고르기'} →</Link>
  <p className="mt-2 text-xs leading-6">같은 분야를 보는 누구에게나 제안하는 편집 경로이며, 내 점수로 예측한 추천이 아닙니다. 활동을 여는 것만으로 설문 응답이나 관찰 기록은 바뀌지 않아요.</p>
 </aside>;
}
