'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePersonaStore } from '@/lib/persona-store';
import { DemographicProfile } from '@/lib/types';

const GENDER_OPTIONS: { value: NonNullable<DemographicProfile['gender']>; label: string }[] = [
  { value: 'female', label: '여성' },
  { value: 'male', label: '남성' },
  { value: 'other', label: '기타' },
  { value: 'unspecified', label: '선택 안함' },
];

const AGE_OPTIONS: { value: NonNullable<DemographicProfile['ageGroup']>; label: string }[] = [
  { value: '10s', label: '10대' },
  { value: '20s_early', label: '20대 초반' },
  { value: '20s_late', label: '20대 후반' },
  { value: '30s_early', label: '30대 초반' },
  { value: '30s_late', label: '30대 후반' },
  { value: '40s', label: '40대' },
  { value: '50s_plus', label: '50대 이상' },
  { value: 'unspecified', label: '선택 안함' },
];

const OCCUPATION_OPTIONS: { value: NonNullable<DemographicProfile['occupation']>; label: string }[] = [
  { value: 'tech_product', label: 'IT · 기획 · 개발' },
  { value: 'design_art', label: '디자인 · 예술 · 창작' },
  { value: 'business_office', label: '경영 · 사무 · 전문직' },
  { value: 'research_edu', label: '학생 · 연구 · 교육' },
  { value: 'freelance_creator', label: '자영업 · 프리랜서' },
  { value: 'other', label: '기타' },
  { value: 'unspecified', label: '선택 안함' },
];

export function Navbar() {
  const pathname = usePathname();
  const {
    state,
    isHydrated,
    currentUserId,
    switchUser,
    logoutToGuest,
    updateDemographics,
  } = usePersonaStore();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [inputUserId, setInputUserId] = useState('');
  const [inputPin, setInputPin] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const completedCount = isHydrated
    ? Object.keys(state.completedDomains).length
    : 0;

  const demographics = state.demographics || {
    gender: 'unspecified',
    ageGroup: 'unspecified',
    occupation: 'unspecified',
  };

  const handleSaveOrSwitchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);
    const trimmedId = inputUserId.trim();
    const trimmedPin = inputPin.trim();
    if (!trimmedId) {
      setFeedbackMsg({ type: 'error', text: '별칭(닉네임)을 입력해 주세요.' });
      return;
    }
    if (!/^\d{4}$/.test(trimmedPin)) {
      setFeedbackMsg({
        type: 'error',
        text: '내 방 보호를 위해 숫자 4자리 PIN을 입력해 주세요.',
      });
      return;
    }

    setIsLoading(true);
    const res = await switchUser(trimmedId, trimmedPin);
    setIsLoading(false);

    if (!res.ok) {
      setFeedbackMsg({
        type: 'error',
        text: res.error || '불러오기에 실패했습니다.',
      });
      return;
    }

    setInputUserId('');
    setInputPin('');
    setFeedbackMsg({
      type: 'success',
      text: res.isNewUser
        ? `'${trimmedId}' 별칭으로 새 방이 안전하게 생성·연결되었습니다.`
        : `'${trimmedId}'의 방 데이터를 불러왔습니다.`,
    });
  };

  return (
    <header className="pointer-events-none fixed top-0 left-0 right-0 z-30 px-5 sm:px-8 pt-4 sm:pt-5">
      <div className="max-w-[1520px] mx-auto flex items-start justify-between gap-4">
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

        {/* Top-Right Clear Navigation + Privacy-Safe User Profile */}
        <div className="pointer-events-auto relative flex items-center gap-2">
          <nav className="flex items-center gap-1.5 sm:gap-2 bg-[#FFF9EB]/95 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-[#0042AF]/30 shadow-[0_6px_20px_-6px_rgba(1,13,110,0.12)]">
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
                setIsUserMenuOpen((prev) => !prev);
                setFeedbackMsg(null);
              }}
              className="px-3 py-1 rounded-full bg-[#010D6E] text-[#FEF1D0] text-[12px] font-semibold hover:bg-[#0042AF] transition-colors flex items-center gap-1.5"
              title="가명 별칭·PIN 저장 및 기본 프로필 설정"
            >
              <span>{currentUserId}의 방</span>
              <span className="text-[10px] opacity-80">▾</span>
            </button>
          </nav>

          {/* Privacy-Safe Pseudonym + PIN + Non-PII Demographic Profile Popover */}
          {isUserMenuOpen && (
            <div className="absolute right-0 top-14 w-[350px] sm:w-[375px] rounded-2xl bg-[#FFFDF7] border border-[#0042AF]/35 shadow-[0_18px_40px_-10px_rgba(1,13,110,0.25)] p-5 z-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13.5px] font-bold text-[#010D6E]">
                  내 방 암호 저장 · 페르소나 기본 정보
                </span>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="text-[12px] text-[#0042AF]/70 hover:text-[#010D6E]"
                >
                  닫기 ✕
                </button>
              </div>

              {/* Section 1: Non-PII Demographic Attributes for Persona Analysis */}
              <div className="mb-4 pb-4 border-b border-[#0042AF]/15 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-[#0042AF]">
                    1. 비식별 페르소나 통계 정보 (선택)
                  </span>
                  <span className="text-[11px] text-[#010D6E]/60">
                    익명 연령·성별 분석용
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
                          gender: e.target.value as DemographicProfile['gender'],
                        })
                      }
                      className="w-full px-2 py-1.5 rounded-lg bg-[#FEF1D0]/65 border border-[#0042AF]/25 text-[12px] text-[#010D6E] focus:outline-none focus:border-[#0042AF]"
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
                      className="w-full px-2 py-1.5 rounded-lg bg-[#FEF1D0]/65 border border-[#0042AF]/25 text-[12px] text-[#010D6E] focus:outline-none focus:border-[#0042AF]"
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
                      className="w-full px-2 py-1.5 rounded-lg bg-[#FEF1D0]/65 border border-[#0042AF]/25 text-[12px] text-[#010D6E] focus:outline-none focus:border-[#0042AF]"
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

              {/* Section 2: Pseudonym + 4-digit PIN Sync */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] font-semibold text-[#0042AF]">
                    2. 가명 별칭 + 4자리 PIN으로 기기 간 동기화
                  </span>
                  {currentUserId !== '게스트' && (
                    <button
                      type="button"
                      onClick={() => {
                        logoutToGuest();
                        setFeedbackMsg({
                          type: 'success',
                          text: '브라우저 전용 게스트 모드로 전환되었습니다.',
                        });
                      }}
                      className="text-[11px] text-[#D4653B] underline"
                    >
                      게스트 전환
                    </button>
                  )}
                </div>
                <p className="text-[11.5px] text-[#010D6E]/75 leading-[1.45] mb-2.5">
                  다른 사람이 내 방을 열람할 수 없도록 <strong>가명 별칭</strong>과 <strong>숫자 4자리 PIN</strong>으로만 암호화해 불러옵니다.
                </p>

                <form onSubmit={handleSaveOrSwitchUser} className="space-y-2">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={inputUserId}
                      onChange={(e) => setInputUserId(e.target.value)}
                      placeholder="가명 별칭 (예: 루바토7, bluefox)"
                      maxLength={20}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-[#FEF1D0]/60 border border-[#0042AF]/30 text-[12.5px] text-[#010D6E] placeholder:text-[#0042AF]/45 focus:outline-none focus:border-[#0042AF]"
                    />
                    <input
                      type="password"
                      inputMode="numeric"
                      value={inputPin}
                      onChange={(e) =>
                        setInputPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                      }
                      placeholder="PIN 4자리"
                      maxLength={4}
                      className="w-[88px] px-2.5 py-1.5 rounded-xl bg-[#FEF1D0]/60 border border-[#0042AF]/30 text-[12.5px] text-[#010D6E] placeholder:text-[#0042AF]/45 focus:outline-none focus:border-[#0042AF] text-center tracking-widest"
                    />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-3 py-1.5 rounded-xl bg-[#0042AF] text-[#FEF1D0] text-[12px] font-semibold hover:bg-[#010D6E] shrink-0 disabled:opacity-50"
                    >
                      {isLoading ? '...' : '저장/입장'}
                    </button>
                  </div>
                </form>

                {feedbackMsg && (
                  <p
                    className={`mt-2 text-[11.5px] font-medium ${
                      feedbackMsg.type === 'error'
                        ? 'text-[#D4653B]'
                        : 'text-[#0042AF]'
                    }`}
                  >
                    · {feedbackMsg.text}
                  </p>
                )}

                <p className="mt-3 pt-2.5 border-t border-[#0042AF]/10 text-[11px] text-[#010D6E]/60 leading-[1.45]">
                  🔒 실명·이메일·전화번호는 입력이 자동 차단되며 수집하지 않습니다. 연령대·성별은 비식별 통계 분석에만 활용됩니다.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
