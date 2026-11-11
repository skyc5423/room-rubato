import type { Metadata } from 'next';
import './globals.css';
import { PersonaProvider } from '@/lib/persona-store';
import { Navbar } from '@/components/Navbar';
import { PersonaSyncStatus } from '@/components/PersonaSyncStatus';

export const metadata: Metadata = {
  title: 'Room Rubato — 아는 취향으로 찾는 모르는 취향',
  description:
    '음악·기술처럼 내가 잘 아는 분야의 취향을 단서로, 패션·인테리어·미술처럼 막막했던 분야의 내 취향을 찾아주는 방',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen flex flex-col bg-[#FEF1D0] text-[#010D6E] antialiased relative overflow-x-hidden">
        {/* Warm paper grain texture overlay */}
        <svg
          className="pointer-events-none fixed inset-0 z-40 h-full w-full opacity-[0.04] mix-blend-multiply"
          aria-hidden="true"
        >
          <filter id="warm-paper-noise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.82"
              numOctaves="3"
              stitchTiles="stitch"
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#warm-paper-noise)" />
        </svg>

        <a href="#main-content" className="skip-link">본문으로 바로가기</a>
        <PersonaProvider>
          <Navbar />
          <PersonaSyncStatus />
          <main id="main-content" tabIndex={-1} className="flex-1 relative z-10">{children}</main>
          <footer className="border-t border-[#0042AF]/15 bg-[#F6E2B3]/40">
            <div className="max-w-[1380px] mx-auto px-6 py-7 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-[#0042AF]">
              <div className="flex items-center gap-3">
                <span className="font-display italic font-semibold text-[18px] text-[#010D6E]">
                  Room Rubato
                </span>
                <span className="opacity-30">·</span>
                <span className="text-[#010D6E]/80">
                  내가 잘 아는 분야의 취향을 단서로 아직 몰랐던 내 취향을 찾습니다
                </span>
              </div>
              <div className="text-[12px] text-[#0042AF]/75">
                12가지 일상 분야의 취향 탐색기
              </div>
            </div>
          </footer>
        </PersonaProvider>
      </body>
    </html>
  );
}
