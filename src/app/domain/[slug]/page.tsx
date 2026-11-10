'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ALL_MASTER_DOMAINS,
  getDomainBySlug,
  predictUnplayedDomainPhenotype,
} from '@/lib/domains-index';
import { usePersonaStore } from '@/lib/persona-store';
import { getRoomObjectBySlug } from '@/lib/room-objects';
import {
  SpecimenPlate,
  QUESTION_OPTION_IMAGES,
} from '@/components/SpecimenPlate';

export default function DomainDetailPage() {
  const params = useParams<{ slug: string }>();
  const domain = getDomainBySlug(params.slug);
  const roomObj = getRoomObjectBySlug(params.slug);
  const { state, isHydrated, currentUserId, recordQuestionChoice, recordCurationFeedback } =
    usePersonaStore();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<
    {
      questionId: string;
      chosenOption: 'A' | 'B';
      responseTimeMs: number;
    }[]
  >([]);
  const [viewMode, setViewMode] = useState<'questions' | 'result'>('questions');

  const questionStartRef = useRef<number>(Date.now());
  const selectingRef = useRef(false);

  useEffect(() => {
    questionStartRef.current = Date.now();
    selectingRef.current = false;
  }, [currentIdx, viewMode, params.slug]);

  useEffect(() => {
    setCurrentIdx(0);
    setAnswers([]);
    // URL parameters must never create synthetic answers or skip required questions.
    setViewMode(isHydrated && domain && state.completedDomains[domain.id] ? 'result' : 'questions');
  }, [params.slug, currentUserId, isHydrated]);


  if (!domain) {
    return (
      <div className="max-w-[760px] mx-auto px-6 pt-32 pb-24 text-center">
        <h1 className="font-editorial text-[24px] text-[#010D6E] mb-4">
          찾으시는 분야가 없습니다
        </h1>
        <Link href="/" className="btn-cobalt px-5 py-2.5 text-[14px]">
          <span>방 화면으로 돌아가기</span>
        </Link>
      </div>
    );
  }

  if (!isHydrated) {
    return <div role="status" className="max-w-[760px] mx-auto px-6 pt-32 pb-24">저장된 응답을 불러오는 중입니다.</div>;
  }

  const existingCompletion = state.completedDomains[domain.id];
  const showResultView = viewMode === 'result';
  const currentQuestion = domain.questions[currentIdx] ?? domain.questions[0];

  const handleSelectOption = (choice: 'A' | 'B') => {
    if (!isHydrated || selectingRef.current || !currentQuestion || answers.length >= domain.questions.length) return;
    selectingRef.current = true;
    const elapsed = Math.max(250, Date.now() - questionStartRef.current);
    const updated = [
      ...answers,
      {
        questionId: currentQuestion.id,
        chosenOption: choice,
        responseTimeMs: elapsed,
      },
    ];

    if (currentIdx + 1 < domain.questions.length) {
      setAnswers(updated);
      setCurrentIdx(currentIdx + 1);
    } else {
      recordQuestionChoice({
        domain,
        answers: updated,
      });
      setAnswers([]);
      setCurrentIdx(0);
      setViewMode('result');
    }
  };

  const matchedPhenotype = existingCompletion
    ? domain.phenotypes.find(
        (p) => p.id === existingCompletion.matchedPhenotypeId
      ) || domain.phenotypes[0]
    : domain.phenotypes[0];

  const nextUnplayedDomains = ALL_MASTER_DOMAINS.filter(
    (d) => d.id !== domain.id && !state.completedDomains[d.id]
  ).slice(0, 3);

  return (
    <div className="max-w-[980px] mx-auto px-6 pt-28 pb-20">
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="btn-cream px-4 py-2 text-[13px]">
          <span>←</span>
          <span>방 화면으로 돌아가기</span>
        </Link>

        {showResultView ? (
          <button
            type="button"
            onClick={() => {
              setAnswers([]);
              setCurrentIdx(0);
              setViewMode('questions');
            }}
            className="btn-cream px-4 py-2 text-[13px]"
          >
            <span>질문 다시 선택하기</span>
          </button>
        ) : existingCompletion ? (
          <button
            type="button"
            onClick={() => setViewMode('result')}
            className="btn-cream px-4 py-2 text-[13px]"
          >
            <span>이전 결과 보기 →</span>
          </button>
        ) : null}
      </div>

      {!showResultView ? (
        <div className="paper-sheet rounded-3xl p-6 md:p-9">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-[#0042AF]/15">
            <div className="flex items-center gap-4">
              {roomObj && (
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-[#0042AF]/25 bg-[#F7EFE1] shrink-0">
                  <img
                    src={roomObj.artworkUrl}
                    alt={roomObj.objectName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#0042AF] text-[#FEF1D0] text-[11.5px] font-semibold">
                    {domain.shortTitle} 취향 찾기
                  </span>
                  <span className="text-[12.5px] text-[#0042AF]/80 font-medium">
                    {roomObj?.shortObject}
                  </span>
                </div>
                <h1 className="font-editorial text-[20px] sm:text-[23px] text-[#010D6E]">
                  {domain.title}
                </h1>
                <p className="text-[13px] text-[#010D6E]/75 mt-0.5">
                  {domain.subtitle}
                </p>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
              <span className="px-3 py-1 rounded-full bg-[#FEF1D0] border border-[#0042AF]/25 text-[13px] font-semibold text-[#0042AF]">
                질문 {currentIdx + 1} / {domain.questions.length}
              </span>
              <div className="flex items-center gap-1">
                {domain.questions.map((q, i) => (
                  <span
                    key={q.id}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentIdx
                        ? 'w-5 bg-[#D4653B]'
                        : i < currentIdx
                          ? 'w-2.5 bg-[#0042AF]'
                          : 'w-2 bg-[#0042AF]/20'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="text-center max-w-[700px] mx-auto mb-7">
            <span className="inline-block px-3 py-0.5 rounded-full bg-[#FEF1D0]/90 border border-[#0042AF]/20 text-[12px] font-semibold text-[#0042AF] mb-2">
              {currentQuestion.contextHint}
            </span>
            <h2 className="font-editorial text-[20px] sm:text-[24px] text-[#010D6E] leading-[1.45] mb-1.5">
              Q{currentIdx + 1}. {currentQuestion.prompt}
            </h2>
            <p className="text-[13.5px] text-[#0042AF]/85">
              {domain.shortTitle} 전문 용어를 몰라도 괜찮습니다. 두 가지 실제 장면·아이템 중 평소 더 손이 가는 쪽을 골라 주세요.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {(['A', 'B'] as const).map((optKey) => {
              const opt =
                optKey === 'A'
                  ? currentQuestion.optionA
                  : currentQuestion.optionB;
              return (
                <button
                  key={optKey}
                  type="button"
                  onClick={() => handleSelectOption(optKey)}
                  className="paper-postcard text-left rounded-2xl p-5 flex flex-col justify-between group"
                >
                  <div>
                    <SpecimenPlate
                      variant={optKey}
                      domainId={domain.id}
                      questionId={currentQuestion.id}
                      visualTone={opt.visualTone}
                    />
                    <h3 className="font-editorial text-[17.5px] sm:text-[18.5px] text-[#010D6E] leading-[1.45] mb-2">
                      {opt.title}
                    </h3>
                    <p className="text-[13.5px] text-[#010D6E]/80 leading-[1.6]">
                      {opt.description}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#0042AF]/15 flex items-center justify-between text-[13.5px] font-semibold text-[#0042AF]">
                    <span>이쪽이 더 마음에 든다</span>
                    <span>→</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="paper-sheet rounded-3xl p-7 md:p-10">
            <div className="flex flex-col sm:flex-row gap-6 items-start mb-6">
              {roomObj && (
                <div className="w-full sm:w-44 h-44 rounded-2xl overflow-hidden border border-[#0042AF]/30 shrink-0 bg-[#FFF9EB]">
                  <img
                    src={roomObj.artworkUrl}
                    alt={roomObj.objectName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#D4653B] text-[#FFFDF7] text-[11.5px] font-semibold">
                    총 {domain.phenotypes.length}가지 세부 유형 중 나의 매칭 결과
                  </span>
                  <span className="text-[12.5px] font-semibold text-[#0042AF]">
                    {matchedPhenotype.englishCode}
                  </span>
                </div>
                <h1 className="font-editorial text-[24px] md:text-[28px] text-[#010D6E] leading-[1.35] mb-3">
                  “{matchedPhenotype.name}”
                </h1>
                <p className="text-[15px] text-[#010D6E]/85 leading-[1.7]">
                  {matchedPhenotype.deepAnalysis}
                </p>
              </div>
            </div>

            {/* 5-Axis Multi-Dimensional Spectrum Breakdown */}
            <div className="mb-7 rounded-2xl bg-[#FFFDF7] border border-[#0042AF]/20 p-5 sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
                <h2 className="font-editorial text-[17px] text-[#010D6E]">
                  내가 고른 {domain.questions.length}가지 선택에서 드러난 {domain.axes.length}가지 취향 축
                </h2>
                <span className="text-[12px] text-[#0042AF]/75">
                  구체적인 아이템 선택 패턴을 바탕으로 계산된 성향 비율입니다
                </span>
              </div>
              <div className="space-y-4">
                {domain.axes.map((axis) => {
                  const rawScore =
                    existingCompletion?.axisScores?.[axis.axisKey] ??
                    matchedPhenotype.axisSignature?.[axis.axisKey] ??
                    0;
                  const clamped = Math.max(-1, Math.min(1, rawScore));
                  const rightPct = Math.round(((clamped + 1) / 2) * 100);
                  const leftPct = 100 - rightPct;
                  const isLeftDominant = leftPct >= rightPct;

                  return (
                    <div key={axis.axisKey} className="space-y-1.5">
                      <div className="flex items-center justify-between text-[13px]">
                        <span
                          className={
                            isLeftDominant
                              ? 'font-bold text-[#010D6E]'
                              : 'text-[#010D6E]/65'
                          }
                        >
                          {axis.leftLabel}{' '}
                          <strong className="text-[#0042AF]">{leftPct}%</strong>
                        </span>
                        <span
                          className={
                            !isLeftDominant
                              ? 'font-bold text-[#010D6E]'
                              : 'text-[#010D6E]/65'
                          }
                        >
                          <strong className="text-[#D4653B]">{rightPct}%</strong>{' '}
                          {axis.rightLabel}
                        </span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-[#F3E8D3] overflow-hidden flex border border-[#0042AF]/15">
                        <div
                          className="h-full bg-[#0042AF] transition-all duration-500"
                          style={{ width: `${leftPct}%` }}
                        />
                        <div
                          className="h-full bg-[#D4653B] transition-all duration-500"
                          style={{ width: `${rightPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 8 Phenotypes Landscape Comparison */}
            <div className="mb-7">
              <p className="text-[12.5px] font-semibold text-[#0042AF] mb-2.5">
                이 분야의 {domain.phenotypes.length}가지 세부 스타일 유형 중 내 위치
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {domain.phenotypes.map((p) => {
                  const isMine = p.id === matchedPhenotype.id;
                  return (
                    <div
                      key={p.id}
                      className={`rounded-xl p-3 border transition-all ${
                        isMine
                          ? 'bg-[#0042AF] text-[#FEF1D0] border-[#0042AF] shadow-sm'
                          : 'bg-[#FFFDF7] text-[#010D6E] border-[#0042AF]/15 opacity-80'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[13px] font-bold leading-snug">
                          {p.name}
                        </span>
                        {isMine && (
                          <span className="px-2 py-0.5 rounded-full bg-[#D4653B] text-[#FFFDF7] text-[10.5px] font-semibold shrink-0">
                            내 유형
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-[11.5px] line-clamp-2 leading-[1.45] ${
                          isMine ? 'text-[#FEF1D0]/90' : 'text-[#010D6E]/70'
                        }`}
                      >
                        {p.summary}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-[12.5px] font-semibold text-[#0042AF] mb-2.5">
                내가 실제로 고른 {domain.questions.length}가지 아이템 기록
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {domain.questions.map((q, idx) => {
                  const chosenLog = [...state.choiceTelemetryLog]
                    .reverse()
                    .find((l) => l.questionId === q.id);
                  const chosenSide = chosenLog?.chosenOption ?? 'A';
                  const chosenOpt =
                    chosenSide === 'A' ? q.optionA : q.optionB;
                  const imgSrc =
                    QUESTION_OPTION_IMAGES[q.id]?.[chosenSide] ??
                    roomObj?.artworkUrl ??
                    '/artwork/room-colored.jpg';
                  return (
                    <div
                      key={q.id}
                      className="rounded-xl bg-[#FFFDF7] border border-[#0042AF]/20 p-2.5 flex flex-col gap-1.5"
                    >
                      <div className="w-full h-24 rounded-lg overflow-hidden bg-[#F7EFE1] border border-[#0042AF]/15">
                        <img
                          src={`${imgSrc}?v=5`}
                          alt={chosenOpt.title}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-[#0042AF]">
                        Q{idx + 1} · 선택 {chosenSide}
                      </span>
                      <p className="text-[11.5px] text-[#010D6E] font-medium line-clamp-2 leading-[1.35]">
                        {chosenOpt.title}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-5 border-t border-[#0042AF]/15">
              <div className="rounded-2xl bg-[#FEF1D0]/60 p-5 border border-[#0042AF]/20">
                <h2 className="font-editorial text-[16px] text-[#010D6E] mb-3">
                  고를 때 실패 줄이는 기준 3가지
                </h2>
                <ul className="space-y-2 text-[14px] text-[#010D6E]/85">
                  {matchedPhenotype.decisionGuide.map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-bold text-[#D4653B]">
                        {idx + 1}.
                      </span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl bg-[#FFFDF7] p-5 border border-[#0042AF]/20">
                <h2 className="font-editorial text-[16px] text-[#010D6E] mb-3">
                  추천 브랜드 · 레퍼런스
                </h2>
                <div className="space-y-3">
                  {matchedPhenotype.curations.map((rec) => {
                    const feedback = state.curationFeedbackLog.find(
                      (f) => f.curationId === rec.id
                    )?.reaction;
                    return (
                      <div
                        key={rec.id}
                        className="pb-2.5 border-b border-[#0042AF]/10 last:border-b-0 last:pb-0"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[14px] font-semibold text-[#010D6E]">
                            {rec.title}
                          </span>
                          <span className="text-[11.5px] text-[#0042AF]/75">
                            {rec.category}
                          </span>
                        </div>
                        <p className="text-[12.5px] text-[#010D6E]/75 mt-0.5">
                          {rec.reason}
                        </p>
                        <div className="mt-1.5 flex gap-2 text-[11.5px]">
                          <button
                            type="button"
                            onClick={() =>
                              recordCurationFeedback({
                                curationId: rec.id,
                                domainId: domain.id,
                                phenotypeId: matchedPhenotype.id,
                                reaction: 'resonant',
                              })
                            }
                            className={`px-2.5 py-0.5 rounded-full border ${
                              feedback === 'resonant'
                                ? 'bg-[#0042AF] text-[#FEF1D0] border-[#0042AF]'
                                : 'border-[#0042AF]/30 text-[#0042AF]'
                            }`}
                          >
                            마음에 듦 👍
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              recordCurationFeedback({
                                curationId: rec.id,
                                domainId: domain.id,
                                phenotypeId: matchedPhenotype.id,
                                reaction: 'not_me',
                              })
                            }
                            className={`px-2.5 py-0.5 rounded-full border ${
                              feedback === 'not_me'
                                ? 'bg-[#D4653B] text-[#FFFDF7] border-[#D4653B]'
                                : 'border-[#0042AF]/30 text-[#0042AF]/75'
                            }`}
                          >
                            내 취향 아님
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {nextUnplayedDomains.length > 0 && (
            <div className="paper-sheet rounded-3xl p-7">
              <h2 className="font-editorial text-[19px] text-[#010D6E] mb-4">
                이어서 해보면 좋은 다른 분야
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {nextUnplayedDomains.map((nd) => {
                  const pred = predictUnplayedDomainPhenotype(
                    nd,
                    state.layer3Vector,
                    state.completedDomains
                  );
                  return (
                    <Link
                      key={nd.id}
                      href={`/domain/${nd.slug}`}
                      className="rounded-2xl p-4 bg-[#FFFDF7] border border-dashed border-[#0042AF]/40 hover:border-solid hover:border-[#0042AF] transition-all flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-[12px] font-semibold text-[#0042AF] block mb-1">
                          {nd.title}
                        </span>
                        <p className="font-editorial text-[15px] text-[#010D6E] mb-2">
                          예상: {pred.predictedPhenotype.name}
                        </p>
                      </div>
                      <span className="text-[12.5px] text-[#0042AF] font-semibold">
                        사진 3장으로 확인하기 →
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
