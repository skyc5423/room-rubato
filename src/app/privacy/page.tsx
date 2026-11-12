import Link from 'next/link';

export const metadata = {
  title: '데이터 저장·삭제 안내 | Room Rubato',
  description: '설문, 관찰실, 로그인 계정이 저장되는 위치와 삭제 범위를 구분합니다.',
};

export default function PrivacyPage() {
  return <article className="mx-auto max-w-3xl px-5 pb-20 pt-8 sm:pt-32 leading-7">
    <h1 className="text-3xl font-bold">데이터 저장·삭제 안내</h1>
    <p className="mt-4">설문 응답, 관찰실 기록, 로그인 계정은 서로 다른 데이터입니다. 한 곳에서 지웠다고 모두 삭제되는 것은 아니에요.</p>
    <p className="mt-3 rounded-xl border border-[#0042AF]/20 bg-white/60 p-4 text-sm">현재 기능을 설명하는 안내입니다. 보유기간·백업 파기와 계정 탈퇴 절차를 포함한 정식 개인정보 처리방침은 아직 확정되지 않았습니다. 공개 서비스 준비가 끝난 상태는 아니에요. 메모에 민감한 개인정보를 입력하지 마세요.</p>

    <section className="mt-9" aria-labelledby="data-purpose">
      <h2 id="data-purpose" className="text-xl font-semibold">이용 목적과 문의</h2>
      <p className="mt-3">취향 응답과 관찰실 메모는 본인의 기록 저장·복원, 취향 요약과 탐색 기능을 제공하는 데 사용합니다. 서비스 연구·개선, 모델 학습이나 다른 이용자와의 통계 비교에 사용하지 않습니다.</p>
      <p className="mt-3">성별·연령대·직군은 새로 입력받지 않습니다. 이전에 입력한 정보가 있다면 기존 기록에 남을 수 있으며 설문 프로필 초기화 범위에 포함됩니다.</p>
      <p className="mt-3">서비스·개인정보 문의: <a className="underline" href="mailto:sangmin5423@gmail.com">sangmin5423@gmail.com</a></p>
      <p className="mt-3 text-sm">문의할 때 비밀번호나 인증 코드는 보내지 마세요. 연락처를 통한 문의는 즉시 자동 삭제를 의미하지 않습니다.</p>
    </section>

    <section className="mt-9" aria-labelledby="survey-data">
      <h2 id="survey-data" className="text-xl font-semibold">설문과 오늘의 질문</h2>
      <p className="mt-3">게스트의 응답은 이 브라우저에 저장됩니다. 로그인 후에는 계정 ID와 연결된 별도 프로필에 응답·응답시간·완료 상태·선택한 기본 정보가 저장됩니다. 계정 ID로 연결되므로 익명 데이터라고 볼 수는 없어요.</p>
      <p className="mt-3">계정 메뉴의 <strong>설문 프로필 초기화</strong>는 해당 프로필의 응답과 요약을 비웁니다. 로그인 계정, 동의 기록, 관찰실 기록은 유지됩니다. 오래된 탭이 기록을 되살리지 않도록 빈 상태의 버전 정보는 남습니다. 백업까지 즉시 삭제한다는 의미는 아닙니다.</p>
      <p className="mt-3">저장 오류가 나면 이 브라우저에 복구 사본이 남을 수 있어요. 복구 안내에서 내보내거나 사본을 지울 수 있습니다. 로그아웃만으로 브라우저 기록이 모두 지워지지는 않습니다.</p>
    </section>

    <section className="mt-9" aria-labelledby="journal-data">
      <h2 id="journal-data" className="text-xl font-semibold">관찰실 선택·메모·저장 표시</h2>
      <p className="mt-3">기본 저장 위치는 이 브라우저입니다. 로그인만으로 업로드하지 않으며, 계정 저장 버튼을 누르면 그때의 기록을 서버에 저장합니다. 자동 동기화가 아니므로 다른 기기에서는 서버 기록을 직접 불러와야 합니다.</p>
      <p className="mt-3">완료한 관찰실 기록을 편집하면 원본과 수정 내용의 임시 사본을 현재 탭에 보관합니다. 게스트와 계정별로 나뉘며 서버에 보내지 않습니다. 같은 탭에서 새로고침하거나 돌아왔을 때 직접 이어갈 수 있지만, 탭을 닫은 뒤의 복구는 보장하지 않습니다. 원본이 바뀌거나 삭제되면 임시 수정으로 덮어쓸 수 없어요.</p>
      <p className="mt-3">수정 저장·취소, 해당 기록 삭제 또는 임시 수정 버리기로 현재 탭의 사본을 지웁니다. 실패하면 안내가 표시되며 사본이 남을 수 있어요. 로그아웃은 다른 계정의 임시 수정을 숨길 뿐 사본을 모두 지우지는 않습니다. 다른 탭·기기의 사본도 원격으로 삭제하지 않습니다.</p>
      <p className="mt-3">관찰실에서 기록을 지우면 우선 이 브라우저에서 삭제됩니다. 계정에도 저장했다면 서버 기록을 확인한 뒤 삭제된 상태를 다시 저장해야 서버에도 반영돼요. 서버 기록을 불러오기 전에 만들어지는 브라우저 복원 사본은 별도로 지워야 합니다.</p>
      <p className="mt-3">다른 기기에 남은 로컬 사본이나 이미 내보낸 파일은 원격으로 삭제되지 않습니다. 공용 기기에서는 사용 후 해당 사이트의 브라우저 데이터를 정리해 주세요.</p>
      <Link className="mt-3 inline-flex min-h-11 items-center underline" href="/notes">관찰실 기록 관리하기</Link>
    </section>

    <section className="mt-9" aria-labelledby="account-data">
      <h2 id="account-data" className="text-xl font-semibold">로그인 계정과 회원 탈퇴</h2>
      <p className="mt-3">이메일 등 로그인 정보는 Supabase 인증 서비스가 관리합니다. Google 로그인으로 받은 정보와 로그인 세션은 설문 프로필과 별개입니다.</p>
      <p className="mt-3"><strong>현재 앱에는 회원 탈퇴 기능이 없습니다.</strong> 설문 초기화나 로그아웃을 회원 탈퇴로 안내하지 않습니다. 계정·동의·서버 기록·복구 사본의 처리 범위와 문의 경로가 정해지고 삭제 절차가 검증되기 전에는 탈퇴를 완료했다고 표시하지 않겠습니다.</p>
      <Link className="mt-3 inline-flex min-h-11 items-center underline" href="/account/withdrawal">회원 탈퇴 준비 상태 확인하기</Link>
    </section>
    <Link className="mt-10 inline-flex min-h-11 items-center underline" href="/">홈으로 돌아가기</Link>
  </article>;
}
