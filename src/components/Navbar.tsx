'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePersonaStore } from '@/lib/persona-store';

export function Navbar() {
  const pathname = usePathname();
  const { state, isHydrated, currentUserId, savedUsers, switchUser } =
    usePersonaStore();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [inputUserId, setInputUserId] = useState('');

  const completedCount = isHydrated
    ? Object.keys(state.completedDomains).length
    : 3;

  const handleSaveOrSwitchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputUserId.trim();
    if (!trimmed) return;
    await switchUser(trimmed);
    setInputUserId('');
    setIsUserMenuOpen(false);
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

        {/* Top-Right Clear Navigation + User ID Switcher */}
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
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="px-3 py-1 rounded-full bg-[#010D6E] text-[#FEF1D0] text-[12px] font-semibold hover:bg-[#0042AF] transition-colors flex items-center gap-1.5"
              title="내 이름(ID)으로 방 저장 및 불러오기"
            >
              <span>{currentUserId}의 방</span>
              <span className="text-[10px] opacity-80">▾</span>
            </button>
          </nav>

          {/* User Profile Save / Switch Dropdown */}
          {isUserMenuOpen && (
            <div className="absolute right-0 top-14 w-[310px] rounded-2xl bg-[#FFFDF7] border border-[#0042AF]/35 shadow-[0_18px_40px_-10px_rgba(1,13,110,0.22)] p-4 z-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-bold text-[#010D6E]">
                  이름(ID)으로 내 방 저장 · 전환
                </span>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="text-[12px] text-[#0042AF]/70 hover:text-[#010D6E]"
                >
                  닫기 ✕
                </button>
              </div>
              <p className="text-[12px] text-[#010D6E]/75 leading-[1.5] mb-3">
                로그인 없이 내 이름이나 영문 ID만 입력하면 선택한 결과가 서버에 자동 저장됩니다.
              </p>

              <form onSubmit={handleSaveOrSwitchUser} className="flex gap-1.5 mb-3">
                <input
                  type="text"
                  value={inputUserId}
                  onChange={(e) => setInputUserId(e.target.value)}
                  placeholder="예: 상민, sangmin, 지원"
                  className="flex-1 px-3 py-1.5 rounded-xl bg-[#FEF1D0]/60 border border-[#0042AF]/30 text-[13px] text-[#010D6E] placeholder:text-[#0042AF]/45 focus:outline-none focus:border-[#0042AF]"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-[#0042AF] text-[#FEF1D0] text-[12.5px] font-semibold hover:bg-[#010D6E] shrink-0"
                >
                  입장
                </button>
              </form>

              {savedUsers.length > 0 && (
                <div className="pt-2.5 border-t border-[#0042AF]/15">
                  <span className="block text-[11.5px] font-semibold text-[#0042AF] mb-1.5">
                    저장된 방 목록 ({savedUsers.length})
                  </span>
                  <div className="max-h-[150px] overflow-y-auto space-y-1">
                    {savedUsers.map((u) => (
                      <button
                        key={u.userId}
                        type="button"
                        onClick={async () => {
                          await switchUser(u.userId);
                          setIsUserMenuOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[12.5px] flex items-center justify-between transition-colors ${
                          u.userId === currentUserId
                            ? 'bg-[#0042AF] text-[#FEF1D0] font-semibold'
                            : 'hover:bg-[#FEF1D0] text-[#010D6E]'
                        }`}
                      >
                        <span>{u.userId}의 방</span>
                        <span className="text-[11px] opacity-80">
                          {u.completedCount} / 12 완료
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
