import Link from 'next/link';

export const metadata = {
  title: '회원 탈퇴 준비 상태 | Room Rubato',
  description: '회원 탈퇴의 현재 제공 상태와 삭제 범위를 확인합니다.',
};

export default function AccountWithdrawalPage() {
  return <article className="mx-auto max-w-3xl px-5 pb-20 pt-8 leading-7 sm:pt-32">
    <h1 className="text-3xl font-bold">회원 탈퇴</h1>
    <p className="mt-4 rounded-xl border border-[#0042AF]/20 bg-white/60 p-4" role="status">자동 회원 탈퇴는 아직 제공하지 않습니다. 백업 보관·파기 절차와 계정별 삭제 검증이 끝날 때까지 실행할 수 없습니다.</p>
    <h2 className="mt-8 text-xl font-semibold">탈퇴와 초기화는 다릅니다</h2>
    <p className="mt-3">설문 프로필 초기화는 로그인 계정, 동의 기록, 관찰실 기록을 삭제하지 않습니다. 로그아웃도 회원 탈퇴가 아닙니다.</p>
    <p className="mt-3">계정 탈퇴 기능은 로그인 계정과 해당 계정의 서버 기록을 함께 처리하도록 준비 중입니다. 백업이 즉시 삭제되거나 다른 기기·내보낸 파일까지 원격으로 지워진다고 안내하지 않습니다.</p>
    <button type="button" disabled aria-describedby="withdrawal-unavailable" className="mt-6 min-h-11 rounded-lg bg-slate-200 px-5 py-3 text-slate-600 disabled:cursor-not-allowed">회원 탈퇴 실행 불가</button>
    <p id="withdrawal-unavailable" className="mt-2 text-sm">이 버튼은 어떤 데이터도 삭제하거나 탈퇴 요청을 전송하지 않습니다.</p>
    <h2 className="mt-8 text-xl font-semibold">계정·삭제 문의</h2>
    <p className="mt-3"><a className="underline" href="mailto:sangmin5423@gmail.com">sangmin5423@gmail.com</a>으로 문의해 주세요. 비밀번호, 인증 코드, 기록 원문은 보내지 마세요. 문의만으로 자동 삭제가 완료되지는 않습니다.</p>
    <Link className="mt-8 inline-flex min-h-11 items-center underline" href="/privacy">데이터 저장·삭제 범위 보기</Link>
  </article>;
}
