'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePersonaStore } from '@/lib/persona-store';
import { DemographicProfile } from '@/lib/types';

const GENDER_OPTIONS: {
  value: NonNullable<DemographicProfile['gender']>;
  label: string;
}[] = [
  { value: 'unspecified', label: '선택 안함' },
  { value: 'female', label: '여성' },
  { value: 'male', label: '남성' },
  { value: 'other', label: '기타' },
];

const AGE_OPTIONS: {
  value: NonNullable<DemographicProfile['ageGroup']>;
  label: string;
}[] = [
  { value: 'unspecified', label: '선택 안함' },
  { value: '10s', label: '10대' },
  { value: '20s_early', label: '20대 초반 (20~24)' },
  { value: '20s_late', label: '20대 후반 (25~29)' },
  { value: '30s_early', label: '30대 초반 (30~34)' },
  { value: '30s_late', label: '30대 후반 (35~39)' },
  { value: '40s', label: '40대' },
  { value: '50s_plus', label: '50대 이상' },
];

const OCCUPATION_OPTIONS: {
  value: NonNullable<DemographicProfile['occupation']>;
  label: string;
}[] = [
  { value: 'unspecified', label: '선택 안함' },
  { value: 'tech_product', label: 'IT · 기획 · 개발' },
  { value: 'design_art', label: '디자인 · 예술 · 창작' },
  { value: 'business_office', label: '경영 · 사무 · 전문직' },
  { value: 'research_edu', label: '학생 · 연구 · 교육' },
  { value: 'freelance_creator', label: '자영업 · 프리랜서' },
  { value: 'other', label: '기타' },
];

export function Navbar() {
  const pathname = usePathname();
  const {
    state,
    isHydrated,
    syncError,
    retrySync,
    authUser,
    loginWithEmail,
    loginWithGoogle,
    logoutToGuest,
    deletePersonaData,
    updateDemographics,
  } = usePersonaStore();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'google' | 'email'>('google');
  const [emailMode, setEmailMode] = useState<'signin' | 'signup'>('signin');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [showPrivacyDetail, setShowPrivacyDetail] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const profilePanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthModalOpen) return;
    const panel = profilePanelRef.current;
    const button = profileButtonRef.current;
    panel?.querySelector<HTMLButtonElement>('button')?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsAuthModalOpen(false);
        button?.focus();
      }
      if (event.key !== 'Tab' || !panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href]'));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !panel?.contains(event.target) && !button?.contains(event.target)) setIsAuthModalOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [isAuthModalOpen]);

  useEffect(() => { setIsAuthModalOpen(false); }, [pathname]);

  const completedCount = isHydrated
    ? Object.keys(state.completedDomains).length
    : 0;

  const demographics = state.demographics || {
    gender: 'unspecified',
    ageGroup: 'unspecified',
    occupation: 'unspecified',
  };

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);
    if (!consentAgreed) {
      setFeedbackMsg({
        type: 'error',
        text: '[필수] 계정 정보와 취향 응답 수집·이용에 동의해 주세요.',
      });
      return;
    }

    setIsLoading(true);
    const res = await loginWithGoogle({
      googleEmail: emailInput,
      consentAgreed,
      demographics,
    });
    setIsLoading(false);

    if (!res.ok) {
      setFeedbackMsg({
        type: 'error',
        text: res.error || 'Google 로그인에 실패했습니다.',
      });
      return;
    }

    setEmailInput('');
    setFeedbackMsg({
      type: 'success',
      text: res.isNewUser
        ? '로그인했어요. 이제 응답을 계정에 저장할 수 있어요.'
        : 'Google 인증 페이지로 이동합니다.',
    });
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);
    if (!consentAgreed) {
      setFeedbackMsg({
        type: 'error',
        text: '[필수] 계정 정보와 취향 응답 수집·이용에 동의해 주세요.',
      });
      return;
    }

    setIsLoading(true);
    const res = await loginWithEmail({
      email: emailInput,
      password: passwordInput,
      mode: emailMode,
      consentAgreed,
      demographics,
    });
    setIsLoading(false);

    if (!res.ok) {
      setFeedbackMsg({
        type: 'error',
        text: res.error || '이메일 로그인에 실패했습니다.',
      });
      return;
    }

    setEmailInput('');
    setPasswordInput('');
    setFeedbackMsg({
      type: 'success',
      text: res.needsEmailConfirmation
        ? '확인 메일을 보냈습니다. 이메일의 링크를 연 뒤 로그인해 주세요.'
        : res.isNewUser
        ? '계정을 만들었어요. 이제 응답을 계정에 저장할 수 있어요.'
        : '인증되었습니다. 프로필을 불러옵니다.',
    });
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    const res = await deletePersonaData();
    setIsLoading(false);
    setConfirmDelete(false);
    if (res.ok) {
      setFeedbackMsg({
        type: 'success',
        text: '취향 프로필을 삭제했습니다. 로그인 계정은 유지되며, 새 응답은 다시 저장됩니다.',
      });
    } else {
      setFeedbackMsg({
        type: 'error',
        text: res.error || '데이터 삭제 중 오류가 발생했습니다.',
      });
    }
  };

  return (
    <header className="pointer-events-none relative sm:fixed top-0 left-0 right-0 z-30 px-3 sm:px-8 pt-3 sm:pt-5 pb-3 sm:pb-0">
      <div className="max-w-[1520px] mx-auto flex flex-wrap lg:flex-nowrap items-start justify-between gap-2 sm:gap-4">
        {/* Top-Left Brand Mark */}
        <Link
          href="/"
          className="pointer-events-auto group inline-flex items-center gap-3 bg-[#FFF9EB]/95 backdrop-blur-md px-4 py-2 rounded-full border border-[#0042AF]/30 shadow-[0_6px_20px_-6px_rgba(1,13,110,0.12)] hover:border-[#0042AF] transition-all"
        >
          <span className="relative flex h-6 w-6 items-center justify-center rounded-full border border-[#0042AF] bg-[#FEF1D0] text-[#0042AF] transition-transform duration-500 group-hover:rotate-45">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
              <path d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z" />
            </svg>
          </span>
          <div className="flex items-baseline gap-2.5">
            <span className="font-display italic font-semibold text-[21px] sm:text-[23px] tracking-[-0.01em] text-[#010D6E] leading-none">
              Room Rubato
            </span>
            <span className="hidden md:inline-block text-[12.5px] text-[#0042AF] font-medium">
              내가 아는 취향으로 아직 모르는 취향 찾기
            </span>
          </div>
        </Link>

        {/* Top-Right Clear Navigation + Auth Button */}
        <div className="pointer-events-auto relative flex w-full sm:w-auto items-center gap-2">
          <nav className="flex flex-wrap w-full sm:w-auto items-center gap-1.5 sm:gap-2 bg-[#FFF9EB]/95 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-[#0042AF]/30 shadow-[0_6px_20px_-6px_rgba(1,13,110,0.12)]">
            <Link
              href="/#room-stage"
              className={`px-3 py-1 rounded-full text-[13px] transition-colors ${
                pathname === '/'
                  ? 'bg-[#0042AF] text-[#FEF1D0] font-semibold'
                  : 'text-[#010D6E] hover:bg-[#FEF1D0]'
              }`}
            >
              방 둘러보기
            </Link>
            <Link
              href="/#threads-spread"
              className="hidden sm:inline-block px-3 py-1 rounded-full text-[13px] text-[#010D6E] hover:bg-[#FEF1D0] transition-colors"
            >
              취향 연결 보기
            </Link>
            <Link
              href="/daily"
              className={`px-3 py-1 rounded-full text-[13px] transition-colors ${
                pathname.startsWith('/daily')
                  ? 'bg-[#0042AF] text-[#FEF1D0] font-semibold'
                  : 'text-[#010D6E] hover:bg-[#FEF1D0]'
              }`}
            >
              오늘의 질문
            </Link>
            <Link
              href="/notes"
              aria-current={pathname.startsWith('/notes') ? 'page' : undefined}
              className={`px-3 py-1 min-h-9 inline-flex items-center rounded-full text-[13px] transition-colors ${
                pathname.startsWith('/notes')
                  ? 'bg-[#0042AF] text-[#FEF1D0] font-semibold'
                  : 'text-[#010D6E] hover:bg-[#FEF1D0]'
              }`}
            >
              취향 노트
            </Link>
            <Link
              href="/research"
              className={`hidden md:inline-block px-2.5 py-1 rounded-full text-[12.5px] transition-colors ${
                pathname.startsWith('/research')
                  ? 'bg-[#0042AF] text-[#FEF1D0] font-semibold'
                  : 'text-[#0042AF]/80 hover:text-[#010D6E]'
              }`}
            >
              내 취향 요약
            </Link>

            <span className="h-3.5 w-[1px] bg-[#0042AF]/20 mx-0.5" />

            <div
              className="px-2.5 py-0.5 rounded-full bg-[#FEF1D0] border border-[#0042AF]/30 text-[12px] text-[#010D6E] flex items-center gap-1.5"
              title="찾아낸 취향 분야 수"
            >
              <span className="inline-block w-2 h-2 rounded-full bg-[#D4653B]" />
              <span className="font-semibold text-[12px]">
                {completedCount} / 12 완료
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsAuthModalOpen((prev) => !prev);
                setFeedbackMsg(null);
                setConfirmDelete(false);
              }}
              ref={profileButtonRef}
              aria-expanded={isAuthModalOpen}
              aria-controls="account-panel"
              aria-haspopup="dialog"
              className="px-3.5 py-1 min-h-9 rounded-full bg-[#010D6E] text-[#FEF1D0] text-[12px] font-semibold hover:bg-[#0042AF] transition-colors flex items-center gap-1.5"
            >
              {authUser ? (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-[#34A853]" />
                  <span>{authUser.maskedEmail}</span>
                </>
              ) : (
                <span>로그인 · 내 방 저장</span>
              )}
              <span className="text-[10px] opacity-80">▾</span>
            </button>
          </nav>

          {/* Auth & Privacy-Separated Persona Profile Popover */}
          {isAuthModalOpen && (
            <div id="account-panel" ref={profilePanelRef} role="dialog" aria-label="내 계정" className="fixed left-3 right-3 top-28 sm:absolute sm:left-auto sm:right-0 sm:top-14 w-auto sm:w-[400px] max-w-[calc(100vw-24px)] max-h-[calc(100dvh-128px)] overflow-y-auto overscroll-contain rounded-2xl bg-[#FFFDF7] border border-[#0042AF]/35 shadow-[0_20px_48px_-12px_rgba(1,13,110,0.28)] p-5 z-50">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="block text-[14px] font-bold text-[#010D6E]">
                    {authUser
                      ? '내 계정과 취향 기록'
                      : 'Google · 이메일 로그인 및 내 방 연동'}
                  </span>
                  <span className="text-[11px] text-[#0042AF]/75">
                    이메일은 인증 정보에, 취향은 계정 ID로 연결된 별도 프로필에 저장됩니다
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => { setIsAuthModalOpen(false); profileButtonRef.current?.focus(); }}
                  className="text-[12px] text-[#0042AF]/70 hover:text-[#010D6E]"
                >
                  닫기 ✕
                </button>
              </div>

              {/* Section 1: Non-PII Demographic Attributes (Always Editable) */}
              <div className="mb-4 p-3.5 rounded-xl bg-[#FEF1D0]/45 border border-[#0042AF]/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-[#010D6E]">
                    페르소나 기본 통계 정보 (성별 · 연령대 · 직군)
                  </span>
                  <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-[#0042AF]/10 text-[#0042AF] font-semibold">
                    선택 입력 · 프로필 정보
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-[#010D6E]/70 mb-1">
                      성별
                    </label>
                    <select
                      value={demographics.gender || 'unspecified'}
                      onChange={(e) =>
                        updateDemographics({
                          gender: e.target
                            .value as DemographicProfile['gender'],
                        })
                      }
                      className="w-full px-2 py-1.5 rounded-lg bg-[#FFFDF7] border border-[#0042AF]/25 text-[11.5px] text-[#010D6E] focus:outline-none focus:border-[#0042AF]"
                    >
                      {GENDER_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#010D6E]/70 mb-1">
                      연령대
                    </label>
                    <select
                      value={demographics.ageGroup || 'unspecified'}
                      onChange={(e) =>
                        updateDemographics({
                          ageGroup: e.target
                            .value as DemographicProfile['ageGroup'],
                        })
                      }
                      className="w-full px-2 py-1.5 rounded-lg bg-[#FFFDF7] border border-[#0042AF]/25 text-[11.5px] text-[#010D6E] focus:outline-none focus:border-[#0042AF]"
                    >
                      {AGE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#010D6E]/70 mb-1">
                      직군/분야
                    </label>
                    <select
                      value={demographics.occupation || 'unspecified'}
                      onChange={(e) =>
                        updateDemographics({
                          occupation: e.target
                            .value as DemographicProfile['occupation'],
                        })
                      }
                      className="w-full px-2 py-1.5 rounded-lg bg-[#FFFDF7] border border-[#0042AF]/25 text-[11.5px] text-[#010D6E] focus:outline-none focus:border-[#0042AF]"
                    >
                      {OCCUPATION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Logged-In View OR Login/Signup Form */}
              {authUser ? (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-[#FFF9EB] border border-[#0042AF]/20 space-y-1.5 text-[12px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#010D6E]/70">인증 계정</span>
                      <span className="font-semibold text-[#010D6E]">
                        {authUser.maskedEmail} ({authUser.provider.toUpperCase()})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#010D6E]/70">
                        취향 DB 가명 ID (UUID)
                      </span>
                      <span className="font-mono text-[11.5px] text-[#0042AF] font-semibold break-all min-w-0 text-right">
                        {authUser.userUuid}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#010D6E]/65 pt-1 border-t border-[#0042AF]/10">
                      ✓ 취향 분석 테이블에는 이메일 없이 위 가명 UUID와 성별·연령대만 분리 저장됩니다.
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={async () => {
                        const result = await logoutToGuest();
                        setFeedbackMsg({ type: result.ok ? 'success' : 'error', text: result.ok ? '로그아웃되어 게스트 모드로 전환되었습니다.' : result.error || '로그아웃 실패' });
                      }}
                      className="flex-1 py-2 rounded-xl border border-[#0042AF]/30 text-[12px] font-semibold text-[#010D6E] hover:bg-[#FEF1D0]"
                    >
                      로그아웃
                    </button>

                    {!confirmDelete ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="px-3 py-2 rounded-xl border border-[#D4653B]/40 text-[11.5px] text-[#D4653B] hover:bg-[#D4653B]/10"
                      >
                        취향 프로필 삭제
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={handleDeleteAccount}
                        className="px-3 py-2 rounded-xl bg-[#D4653B] text-[#FFFDF7] text-[11.5px] font-semibold"
                      >
                        취향 데이터만 삭제할까요?
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Consent Checkbox */}
                  <div className="p-3 rounded-xl bg-[#FFF9EB] border border-[#0042AF]/25">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consentAgreed}
                        onChange={(e) => setConsentAgreed(e.target.checked)}
                        className="mt-0.5 rounded border-[#0042AF]"
                      />
                      <span className="text-[11.5px] text-[#010D6E] leading-[1.45]">
                        <strong>[필수]</strong> 계정 정보와 취향·통계 데이터 수집·이용에 동의합니다. 취향 기록은 계정과 연결됩니다.
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPrivacyDetail((p) => !p)}
                      className="mt-1.5 ml-5 text-[11px] text-[#0042AF] underline underline-offset-2"
                    >
                      {showPrivacyDetail ? '고지사항 접기 ▲' : '수집 항목 및 분리 보관 원칙 보기 ▼'}
                    </button>

                    {showPrivacyDetail && (
                      <div className="mt-2 p-2.5 rounded-lg bg-[#FFFDF7] border border-[#0042AF]/15 text-[11px] text-[#010D6E]/75 space-y-1 leading-[1.45]">
                        <p>
                          <strong>1. 수집 항목:</strong> 이메일(계정 인증), 취향 응답과 선택에 걸린 시간. 성별·연령대·직군은 선택 입력입니다.
                        </p>
                        <p>
                          <strong>2. 저장 방식:</strong> 취향 프로필은 이메일 대신 계정 ID(UUID)로 연결합니다. 계정과 연결할 수 있는 가명 정보이며 완전히 익명인 데이터가 아닙니다.
                        </p>
                        <p>
                          <strong>3. 파기 권리:</strong> 프로필 메뉴의 [취향 프로필 삭제] 클릭 시 현재 취향 프로필이 삭제됩니다. 로그인 계정은 유지됩니다.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Login Method Tabs */}
                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#FEF1D0]/60 border border-[#0042AF]/20">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab('google');
                        setFeedbackMsg(null);
                      }}
                      className={`py-1.5 rounded-lg text-[12px] font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                        authTab === 'google'
                          ? 'bg-[#010D6E] text-[#FEF1D0]'
                          : 'text-[#010D6E]/75 hover:text-[#010D6E]'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 15.65 5 12c0-3.65 3.36-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81Z"
                        />
                      </svg>
                      <span>Google 로그인</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab('email');
                        setFeedbackMsg(null);
                      }}
                      className={`py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
                        authTab === 'email'
                          ? 'bg-[#010D6E] text-[#FEF1D0]'
                          : 'text-[#010D6E]/75 hover:text-[#010D6E]'
                      }`}
                    >
                      이메일 로그인/가입
                    </button>
                  </div>

                  {authTab === 'google' ? (
                    <form onSubmit={handleGoogleSubmit} className="space-y-2">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2.5 rounded-xl bg-[#0042AF] text-[#FEF1D0] text-[12.5px] font-semibold hover:bg-[#010D6E] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 15.65 5 12c0-3.65 3.36-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81Z"
                          />
                        </svg>
                        <span>
                          {isLoading
                            ? '인증 처리 중...'
                            : 'Google 계정으로 1초 만에 시작하기'}
                        </span>
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleEmailSubmit} className="space-y-2">
                      <label className="text-xs">이메일 인증 방식
                        <select value={emailMode} onChange={(e) => setEmailMode(e.target.value as 'signin' | 'signup')} className="ml-2 p-1 rounded">
                          <option value="signin">기존 계정 로그인</option>
                          <option value="signup">새 계정 가입</option>
                        </select>
                      </label>
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="이메일 주소 입력"
                        className="w-full px-3 py-2 rounded-xl bg-[#FEF1D0]/50 border border-[#0042AF]/30 text-[12.5px] text-[#010D6E] placeholder:text-[#0042AF]/45 focus:outline-none focus:border-[#0042AF]"
                      />
                      <input
                        type="password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="비밀번호 (6자 이상)"
                        className="w-full px-3 py-2 rounded-xl bg-[#FEF1D0]/50 border border-[#0042AF]/30 text-[12.5px] text-[#010D6E] placeholder:text-[#0042AF]/45 focus:outline-none focus:border-[#0042AF]"
                      />
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2.5 rounded-xl bg-[#0042AF] text-[#FEF1D0] text-[12.5px] font-semibold hover:bg-[#010D6E] transition-colors disabled:opacity-50"
                      >
                        {isLoading
                          ? '인증 처리 중...'
                          : (emailMode === 'signup' ? '새 계정 가입' : '이메일 로그인')}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {syncError && <div role="alert" className="text-xs text-red-700">{syncError}{authUser && <button type="button" onClick={retrySync} className="ml-2 underline">저장 재시도</button>}</div>}
              {feedbackMsg && (
                <p
                  className={`mt-2.5 text-[11.5px] font-medium ${
                    feedbackMsg.type === 'error'
                      ? 'text-[#D4653B]'
                      : 'text-[#0042AF]'
                  }`}
                >
                  · {feedbackMsg.text}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
