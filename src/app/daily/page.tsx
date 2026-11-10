'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { koreanDay } from '@/lib/daily-date';
import { DAILY_PULSE_QUESTIONS } from '@/lib/domains-index';
import { usePersonaStore } from '@/lib/persona-store';
import { SpecimenPlate } from '@/components/SpecimenPlate';

export default function DailyPulsePage() {
  const { state, isHydrated, currentUserId, recordDailyPulseShift } = usePersonaStore();
  const [questionIdx, setQuestionIdx] = useState(0);
  const [draftPhase, setPhase] = useState<'phase1' | 'phase2' | 'done'>('phase1');
  const [draftPhase1Choice, setPhase1Choice] = useState<'A' | 'B' | null>(null);
  const [draftPhase1TimeMs, setPhase1TimeMs] = useState<number>(1500);
  const [draftPhase2Choice, setPhase2Choice] = useState<'A' | 'B' | null>(null);

  const startRef = useRef<number>(Date.now());
  const pulse = DAILY_PULSE_QUESTIONS[questionIdx];
  const [today, setToday] = useState(() => koreanDay(Date.now()));
  useEffect(() => {
    const refreshDay = () => setToday(koreanDay(Date.now()));
    const timer = setInterval(refreshDay, 1000);
    window.addEventListener('focus', refreshDay);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', refreshDay);
    };
  }, []);
  // A completed pulse is persisted in the account/guest store, not component state.
  const saved = state.dailyShiftLog.filter((entry) => entry.pulseId === pulse.id && koreanDay(entry.timestamp) === today).at(-1);
  const phase = saved ? 'done' : draftPhase;
  const phase1Choice = saved?.phase1Choice ?? draftPhase1Choice;
  const phase2Choice = saved?.phase2ChoiceAfterSocialProof ?? draftPhase2Choice;
  const phase1TimeMs = saved?.phase1ResponseTimeMs ?? draftPhase1TimeMs;

  useEffect(() => {
    setPhase('phase1');
    setPhase1Choice(null);
    setPhase2Choice(null);
    startRef.current = Date.now();
  }, [currentUserId, today]);

  if (!isHydrated) {
    return <div className="px-6 pt-28" role="status">저장된 응답을 불러오는 중입니다.</div>;
  }


  const handlePhase1Select = (choice: 'A' | 'B') => {
    const elapsed = Math.max(250, Date.now() - startRef.current);
    setPhase1Choice(choice);
    setPhase1TimeMs(elapsed);
    setPhase('phase2');
  };

  const handlePhase2Select = (finalChoice: 'A' | 'B') => {
    if (!phase1Choice || saved) return;
    setPhase2Choice(finalChoice);
    recordDailyPulseShift({
      pulseId: pulse.id,
      phase1Choice,
      phase1ResponseTimeMs: phase1TimeMs,
      phase2ChoiceAfterSocialProof: finalChoice,
    });
    setPhase('done');
  };

  const handleSwitchQuestion = (idx: number) => {
    setQuestionIdx(idx);
    setPhase('phase1');
    setPhase1Choice(null);
    setPhase2Choice(null);
    startRef.current = Date.now();
  };

  const didShift =
    phase1Choice && phase2Choice && phase1Choice !== phase2Choice;

  return (
    <div className="max-w-[980px] mx-auto px-6 pt-28 pb-20 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="font-display italic text-[17px] text-[#0042AF] mb-1">
            Daily Question
          </p>
          <h1 className="font-editorial text-[28px] sm:text-[34px] text-[#010D6E]">
            오늘의 질문 — 상황이 달라지면 내 선택도 바뀔까?
          </h1>
        </div>

        <div className="flex gap-2">
          {DAILY_PULSE_QUESTIONS.map((q, idx) => (
            <button
              key={q.id}
              type="button"
              onClick={() => handleSwitchQuestion(idx)}
              className={`px-4 py-2 rounded-full text-[13px] transition-all ${
                questionIdx === idx
                  ? 'bg-[#0042AF] text-[#FEF1D0] font-semibold'
                  : 'bg-[#FFF9EB] text-[#010D6E] border border-[#0042AF]/30 hover:border-[#0042AF]'
              }`}
            >
              질문 {idx + 1} · {q.domainTitle}
            </button>
          ))}
        </div>
      </div>

      <section className="paper-sheet rounded-3xl p-7 md:p-10">
        <p className="text-[13px] text-[#D4653B] font-semibold mb-2">
          {pulse.dayLabel}
        </p>
        <h2 className="font-editorial text-[22px] md:text-[26px] text-[#010D6E] leading-[1.42] mb-7">
          “{pulse.questionText}”
        </h2>

        {phase === 'phase1' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {(['A', 'B'] as const).map((optKey) => {
              const opt = optKey === 'A' ? pulse.optionA : pulse.optionB;
              return (
                <button
                  key={optKey}
                  type="button"
                  onClick={() => handlePhase1Select(optKey)}
                  className="paper-postcard text-left rounded-2xl p-6 flex flex-col justify-between group"
                >
                  <div>
                    <SpecimenPlate
                      variant={optKey}
                      domainId={pulse.domainId}
                      questionId={pulse.id}
                      visualTone={opt.label}
                    />
                    <h3 className="font-editorial text-[18px] text-[#010D6E] leading-[1.45] mb-2">
                      {opt.label}
                    </h3>
                    <p className="text-[14px] text-[#010D6E]/75 leading-[1.6]">
                      {opt.desc}
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-[#0042AF]/15 flex items-center justify-between text-[13px] text-[#0042AF]">
                    <span>이 답변 선택하기</span>
                    <span>→</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {phase === 'phase2' && (
          <div className="rounded-2xl bg-[#FEF1D0]/70 border border-[#0042AF]/25 p-6">
            <p className="font-display italic text-[16px] text-[#D4653B] mb-2">
              가상 상황입니다 · 실제 참여자 통계가 아닙니다
            </p>
            <p className="font-editorial text-[19px] text-[#010D6E] leading-[1.55] mb-5">
              {pulse.socialProofNudge.nudgePrompt}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => handlePhase2Select(phase1Choice!)}
                className="btn-cobalt px-5 py-3 text-[14px] justify-center"
              >
                처음 고른 내 생각({phase1Choice})을 그대로 유지할래요
              </button>
              <button
                type="button"
                onClick={() =>
                  handlePhase2Select(phase1Choice === 'A' ? 'B' : 'A')
                }
                className="btn-cream px-5 py-3 text-[14px] justify-center"
              >
                주변 이야기를 듣고 다른 쪽({phase1Choice === 'A' ? 'B' : 'A'}
                )으로 바꿀래요
              </button>
            </div>
          </div>
        )}

        {phase === 'done' && (
          <div className="rounded-2xl bg-[#FEF1D0]/75 border border-[#0042AF]/25 p-6">
            <h3 className="font-editorial text-[19px] text-[#010D6E] mb-2">
              {didShift
                ? '가상 상황을 읽고 선택을 바꾸셨네요'
                : '가상 상황을 읽은 뒤에도 처음 선택을 유지하셨네요'}
            </h3>
            <p className="text-[14px] text-[#010D6E]/80">
              처음 고르기까지 {(phase1TimeMs / 1000).toFixed(1)}초가 걸렸습니다. 이 시간만으로 확신이나 성격을 판단하지 않습니다.
            </p>
          </div>
        )}
      </section>

      <section className="paper-sheet rounded-3xl p-7 md:p-10 space-y-5">
        <p className="font-display italic text-[16px] text-[#0042AF]">
          선택 뒤에 남는 질문 · 편집 노트
        </p>
        <h2 className="font-editorial text-[22px] text-[#010D6E]">
          {pulse.yesterdayInsight.questionSummary}
        </h2>
        <p className="text-[15px] text-[#010D6E]/80 leading-[1.75]">
          {pulse.yesterdayInsight.crowdMajorityText}
        </p>
        <p className="text-[15px] text-[#010D6E] font-medium leading-[1.75] pl-4 border-l-2 border-[#D4653B]">
          {pulse.yesterdayInsight.personaDivergenceText}
        </p>
        <p className="text-[14px] text-[#0042AF] pt-2">
          · {pulse.yesterdayInsight.keyTakeaway}
        </p>
        <div className="pt-4">
          <Link href="/" className="btn-cream px-5 py-2.5 text-[13.5px]">
            <span>← Room Rubato 나의 방으로 돌아가기</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
