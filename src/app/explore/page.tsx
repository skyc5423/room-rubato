import Link from 'next/link';
import { tasteLessons } from '@/lib/taste-lessons';
import { artworkComparisons } from '@/lib/artwork-comparisons';

export const metadata = {title:'콘텐츠 둘러보기 | Room Rubato',description:'작품을 비교하고, 빛과 리듬을 바꿔 보고, 감각을 설명하는 말을 읽는 작은 관찰 목차.'};
const linkStyle='inline-flex min-h-11 items-center underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4';
const cardStyle='flex min-w-0 flex-col rounded-2xl border border-[#0042AF]/25 bg-[#FFFDF7] p-5 sm:p-6';
export default function ExplorePage(){
 return <div data-explore className="mx-auto max-w-6xl px-5 pb-20 pt-6 text-[#010D6E] sm:px-8 sm:pt-36">
  <header className="max-w-3xl border-b border-[#0042AF]/25 pb-8">
   <p className="text-sm font-semibold text-[#0042AF]">Room Rubato · 작은 관찰 목차</p>
   <h1 className="mt-3 font-editorial text-3xl leading-tight sm:text-5xl">오늘은 무엇을<br/>다르게 볼까요?</h1>
   <p className="mt-5 text-base leading-7">취향을 먼저 정하지 않아도 괜찮아요. 작품 한 쌍, 움직이는 도식, 짧은 예문 중 마음이 가는 곳에서 시작해보세요.</p>
   <p className="mt-3 text-sm leading-6">목차는 로그인 없이 볼 수 있어요. 예상 시간은 읽는 속도에 따라 달라집니다. 각 활동의 출처와 한계는 해당 화면에서 확인할 수 있어요.</p>
  </header>
  <section aria-labelledby="first-visit-title" className="my-6 rounded-2xl border border-[#0042AF]/25 bg-[#FFFDF7] p-5 sm:p-6">
   <p className="text-sm font-semibold text-[#0042AF]">처음이라면 · 약 3분</p>
   <h2 id="first-visit-title" className="mt-2 text-xl font-semibold">빛을 바꾸며 한 가지 차이부터 찾아보세요</h2>
   <p className="mt-3 max-w-2xl text-sm leading-6">같은 형태도 빛이 달라지면 어떻게 보일까요? 로그인 없이 도식을 비교하고 마음이 가는 쪽을 골라보세요. 정답이나 준비물은 없어요.</p>
   <Link href="/notes?lesson=light" className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0042AF] px-5 py-3 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">명암 직접 바꿔 보기 →</Link>
   <p className="mt-3 text-xs leading-6">선택과 메모의 기본 저장 위치는 이 브라우저예요. 이 링크를 여는 것만으로 활동이 완료되거나 계정에 저장되지는 않아요.</p>
  </section>
  <nav aria-label="콘텐츠 종류" className="my-6 flex flex-wrap gap-x-6 gap-y-2">
   <Link className={linkStyle} href="/explore#compare-content">작품을 나란히</Link><Link className={linkStyle} href="/explore#try-content">직접 바꿔 보기</Link><Link className={linkStyle} href="/explore#read-content">말을 자세히</Link>
  </nav>
  <section id="compare-content" aria-labelledby="compare-title" className="scroll-mt-36 py-7">
   <p className="text-sm text-[#0042AF]">01 · 실제 작품 비교</p><h2 id="compare-title" className="mt-2 text-2xl font-semibold">작품을 나란히</h2>
   <p className="mt-3 max-w-3xl text-sm leading-6">전체와 세부를 번갈아 보고, 설명은 나중에 펼쳐보세요. 비교 감상 화면은 선택과 완료 기록을 저장하지 않습니다.</p>
   <div className="mt-5 grid gap-4 md:grid-cols-2">{artworkComparisons.map((item,index)=><article key={item.slug} className={cardStyle}>
    <p className="text-xs text-[#0042AF]">작품 2점 · 약 3분 · 저장 없음</p><h3 className="mt-3 font-editorial text-xl">{item.title}</h3>
    <p className="my-4 text-sm leading-6">{item.cue}</p><Link data-explore-destination href={`/compare/${item.slug}`} className={`${linkStyle} mt-auto`}>{index===0?'빛과 경계 비교하기':'시선과 구도 비교하기'} →</Link>
   </article>)}</div>
  </section>
  <section id="try-content" aria-labelledby="try-title" className="scroll-mt-36 border-t border-[#0042AF]/25 py-7">
   <p className="text-sm text-[#0042AF]">02 · 8개의 관찰 활동</p><h2 id="try-title" className="mt-2 text-2xl font-semibold">직접 바꿔 보기</h2>
   <p className="mt-3 max-w-3xl text-sm leading-6">빛·배열·강조가 달라질 때 무엇이 눈에 들어오는지 살펴보세요. 관찰실에서 선택과 메모를 남길 수 있으며, 기본 기록은 브라우저에 저장됩니다. 계정 저장은 로그인 후 관찰실에 계정 저장 버튼이 표시될 때 사용할 수 있어요. 아래 링크만 여는 것으로 활동이 완료되지는 않아요.</p>
   <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{tasteLessons.map(lesson=><article key={lesson.id} className={cardStyle}>
    <p className="text-xs text-[#0042AF]">{lesson.category} · 약 {lesson.minutes}분 · 기록 가능</p><h3 className="mt-3 text-lg font-semibold">{lesson.title}</h3><p className="my-3 text-sm leading-6">{lesson.subtitle}</p>
    <Link data-explore-destination href={`/notes?lesson=${lesson.id}`} className={`${linkStyle} mt-auto`}>{lesson.term.split(' · ')[0]} 살펴보기 →</Link>
   </article>)}</div>
   <Link href="/notes" className={`${linkStyle} mt-5`}>관찰실에서 내 기록과 이어 보기 →</Link>
  </section>
  <section id="read-content" aria-labelledby="read-title" className="scroll-mt-36 border-t border-[#0042AF]/25 py-7">
   <p className="text-sm text-[#0042AF]">03 · 감각과 소재를 설명하는 말</p><h2 id="read-title" className="mt-2 text-2xl font-semibold">말을 자세히</h2>
   <article className={`${cardStyle} mt-5 max-w-3xl`}><p className="text-xs text-[#0042AF]">가상 예문 3개 · 저장 없음</p><h3 className="mt-3 text-xl font-semibold">풍미의 언어</h3><p className="my-4 text-sm leading-6">‘고소하다’, ‘산뜻하다’, ‘알싸하다’. 무엇을 느꼈다는 말인지, 좋다는 평가인지 나누어 읽어보세요. 식품이나 향 제품을 준비할 필요는 없어요.</p><Link data-explore-destination href="/observe/flavor" className={linkStyle}>감각과 평가 나눠 읽기 →</Link></article>
   <article className={`${cardStyle} mt-5 max-w-3xl`}><p className="text-xs text-[#0042AF]">패션 · 섬유와 짜임 · 저장 없음</p><h3 className="mt-3 text-xl font-semibold">실크와 새틴은 같은 종류의 말일까요?</h3><p className="my-4 text-sm leading-6">무엇으로 만들었는지와 어떻게 짰는지를 나눠보세요. 가상 옷감 설명과 직접 만든 도식으로 살펴봅니다. 실제 원단이나 구매는 필요 없어요.</p><Link data-explore-destination href="/observe/fibre-weave" className={linkStyle}>섬유와 짜임 나눠 보기 →</Link></article>
  </section>
  <section aria-labelledby="weekly-observation-title" className="border-t border-[#0042AF]/25 py-7">
   <p className="text-sm text-[#0042AF]">이번 주의 관찰 01 · 세 가지를 천천히</p>
   <h2 id="weekly-observation-title" className="mt-2 text-xl font-semibold">‘좋다’고 말하기 전, 하나만 나눠 보기</h2>
   <p className="mt-3 max-w-3xl text-sm leading-7">옷의 재료와 짜임, 맛의 감각과 평가, 그림의 또렷한 경계와 흐려지는 경계. 익숙한 말 하나를 나눠보세요. 로그인이나 준비물 없이, 한 번에 하나만 살펴봐도 괜찮아요.</p>
   <ol className="mt-4 grid gap-4 md:grid-cols-3">
    <li className="min-w-0"><h3 className="text-sm font-semibold">1. 이름을 나누기</h3><Link href="/observe/fibre-weave" className={`${linkStyle} mt-1`}>섬유와 짜임 나눠 보기 →</Link><p className="mt-1 text-sm leading-6">가상 설명에서 바뀐 것이 재료인지 짜임인지 살펴보세요.</p></li>
    <li className="min-w-0"><h3 className="text-sm font-semibold">2. 느낌을 나누기</h3><Link href="/observe/flavor" className={`${linkStyle} mt-1`}>맛을 묘사하는 말 나눠 보기 →</Link><p className="mt-1 text-sm leading-6">느껴지는 감각과 그 느낌을 좋아하는지를 따로 짚어보세요.</p></li>
    <li className="min-w-0"><h3 className="text-sm font-semibold">3. 눈길을 나누기</h3><Link href="/compare/light-and-edges" className={`${linkStyle} mt-1`}>빛이 만드는 경계 보기 →</Link><p className="mt-1 text-sm leading-6">각 그림 안에서 또렷한 가장자리와 주변에 이어지는 곳을 찾아보세요.</p></li>
   </ol>
   <p className="mt-4 max-w-3xl text-xs leading-6">이 세 화면은 선택이나 완료 기록을 저장하지 않아요. 다음에 돌아오고 싶다면 이 페이지를 브라우저에 북마크해 두세요. 다시 볼 때는 첫 옷감 설명에서 ‘설명에 없는 정보는 무엇일까?’를 찾아봐도 좋아요.</p>
  </section>
  <section aria-labelledby="survey-door-title" className="border-t border-[#0042AF]/25 py-7"><h2 id="survey-door-title" className="text-xl font-semibold">내 선택부터 살펴보고 싶다면</h2><p className="mt-3 max-w-3xl text-sm leading-6">방의 물건에서 12개 분야의 질문을 열 수 있어요. 완료한 응답은 기기 또는 로그인 계정에 저장됩니다. 결과는 정해진 가중치로 요약한 것으로, 심리 검사나 진단이 아닙니다.</p><div className="mt-3 flex flex-wrap gap-x-6"><Link href="/#room-stage" className={linkStyle}>방에서 분야 고르기 →</Link><Link href="/#threads-spread" className={linkStyle}>분야 사이의 취향 연결 보기 →</Link></div></section>
  <aside className="mt-4 rounded-2xl border border-[#0042AF]/25 p-5 text-sm leading-6"><p>정답이나 취향 등급을 매기는 목차가 아닙니다. 모두 마칠 필요도 없어요. 하나의 단서를 고르고, 다음에 다른 장면에서 다시 찾아보세요.</p><Link className={`${linkStyle} mt-2`} href="/privacy">기록의 저장·삭제 범위 확인하기 →</Link></aside>
 </div>;
}
