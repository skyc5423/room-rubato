'use client';

import { HomeObservationPreview } from '@/components/HomeObservationPreview';
import { NotebookReturn } from '@/components/NotebookReturn';
import { koreanDay } from '@/lib/daily-date';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ALL_MASTER_DOMAINS,
  DAILY_PULSE_QUESTIONS,
  getDomainById,
  predictUnplayedDomainPhenotype,
} from '@/lib/domains-index';
import { usePersonaStore } from '@/lib/persona-store';
import {
  getRoomObjectByDomainId,
  ROOM_OBJECTS,
} from '@/lib/room-objects';
import { RoomCanvas } from '@/components/RoomCanvas';
import { RoomDialog } from '@/components/RoomDialog';
import { DomainExplorer } from '@/components/DomainExplorer';
import {
  SpecimenPlate,
  QUESTION_OPTION_IMAGES,
} from '@/components/SpecimenPlate';

export default function HomePage() {
  const {
    state,
    isHydrated,
    currentUserId,
    recordQuestionChoice,
    recordDailyPulseShift,
    recordCurationFeedback,
    resetAllData,
  } = usePersonaStore();

  // Room interactive state
  const [hoveredDomainId, setHoveredDomainId] = useState<number | null>(null);
  const [activeDomainId, setActiveDomainId] = useState<number | null>(null);
  const [overlayMode, setOverlayMode] = useState<'choose' | 'note'>('choose');
  const [newlyBloomedDomainId, setNewlyBloomedDomainId] = useState<
    number | null
  >(null);

  // In-room choice state
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<
    { questionId: string; chosenOption: 'A' | 'B'; responseTimeMs: number }[]
  >([]);
  const [stampedOption, setStampedOption] = useState<'A' | 'B' | null>(null);
  const questionStartRef = useRef<number>(Date.now());
  const choiceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const choiceLockedRef = useRef(false);
  const cancelPendingChoice = () => {
    if (choiceTimerRef.current) clearTimeout(choiceTimerRef.current);
    choiceTimerRef.current = null;
    choiceLockedRef.current = false;
  };
  useEffect(() => {
    setActiveDomainId(null);
    cancelPendingChoice();
    return cancelPendingChoice;
  }, [currentUserId]);

  // Section 3: Daily question state
  const [activePulseIdx, setActivePulseIdx] = useState(0);
  const [draftPulsePhase, setPulsePhase] = useState<'initial' | 'nudge' | 'letter'>(
    'initial'
  );
  const [draftPhase1Choice, setPhase1Choice] = useState<'A' | 'B' | null>(null);
  const [draftPhase1Rt, setPhase1Rt] = useState<number>(1500);
  const [draftPhase2Choice, setPhase2Choice] = useState<'A' | 'B' | null>(null);
  const pulseStartRef = useRef<number>(Date.now());

  const completedDomainIds = useMemo(
    () => Object.keys(state.completedDomains).map(Number),
    [state.completedDomains]
  );

  const unplayedDomains = useMemo(
    () =>
      ALL_MASTER_DOMAINS.filter((d) => !state.completedDomains[d.id]),
    [state.completedDomains]
  );

  // Predict tastes in unplayed domains based on completed ones
  const bridgedUnplayed = useMemo(() => {
    return unplayedDomains
      .map((domain) => {
        const pred = predictUnplayedDomainPhenotype(
          domain,
          state.layer3Vector,
          state.completedDomains
        );
        const roomObj = getRoomObjectByDomainId(domain.id)!;
        return {
          domain,
          roomObj,
          ...pred,
        };
      })
      .sort((a, b) => b.heuristicScore - a.heuristicScore);
  }, [unplayedDomains, state.layer3Vector, state.completedDomains]);

  // Info card when hovering an object in the room
  const hoveredContext = useMemo(() => {
    if (!hoveredDomainId) return null;
    const domain = getDomainById(hoveredDomainId);
    const roomObj = getRoomObjectByDomainId(hoveredDomainId);
    if (!domain || !roomObj) return null;

    const completed = state.completedDomains[hoveredDomainId];
    if (completed) {
      const matched =
        domain.phenotypes.find((p) => p.id === completed.matchedPhenotypeId) ??
        domain.phenotypes[0];
      return {
        isCompleted: true,
        domain,
        roomObj,
        headline: `내 ${domain.shortTitle} 취향: ${matched.name}`,
        body: matched.summary,
      };
    } else {
      const pred = predictUnplayedDomainPhenotype(
        domain,
        state.layer3Vector,
        state.completedDomains
      );
      return {
        isCompleted: false,
        domain,
        roomObj,
        headline: completedDomainIds.length > 0 ? `살펴볼 스타일: ${pred.predictedPhenotype.name}` : `${domain.shortTitle} 살펴보기`,
        body:
          completedDomainIds.length > 0
            ? pred.bridgeExplanation
            : roomObj.emptyWhisper,
      };
    }
  }, [
    hoveredDomainId,
    state.completedDomains,
    state.layer3Vector,
    completedDomainIds.length,
  ]);

  const handleSelectRoomObject = (domainId: number) => {
    if (!isHydrated) return;
    cancelPendingChoice();
    setActiveDomainId(domainId);
    setHoveredDomainId(null);
    setQuestionIndex(0);
    setAnswers([]);
    setStampedOption(null);
    questionStartRef.current = Date.now();
    // 방의 물건을 클릭하면 항상 3문항(문항당 2개 이미지, 총 6개 이미지) 선택 화면부터 시작
    setOverlayMode('choose');
  };

  const handleOpenResultNote = (domainId: number) => {
    cancelPendingChoice();
    setActiveDomainId(domainId);
    setHoveredDomainId(null);
    setOverlayMode('note');
  };

  const handleStartRechoose = () => {
    setQuestionIndex(0);
    setAnswers([]);
    setStampedOption(null);
    questionStartRef.current = Date.now();
    setOverlayMode('choose');
  };

  const handleCloseOverlay = () => {
    cancelPendingChoice();
    setActiveDomainId(null);
    setStampedOption(null);
  };

  const activeDomain =
    activeDomainId !== null ? getDomainById(activeDomainId) ?? null : null;
  const activeRoomObj =
    activeDomainId !== null
      ? getRoomObjectByDomainId(activeDomainId) ?? null
      : null;

  const handlePickPostcardOption = (chosen: 'A' | 'B') => {
    if (!isHydrated || !activeDomain || stampedOption !== null || choiceLockedRef.current) return;
    choiceLockedRef.current = true;
    const currentQ = activeDomain.questions[questionIndex];
    if (!currentQ) return;

    const elapsed = Math.max(250, Date.now() - questionStartRef.current);
    setStampedOption(chosen);

    const nextAnswers = [
      ...answers,
      {
        questionId: currentQ.id,
        chosenOption: chosen,
        responseTimeMs: elapsed,
      },
    ];

    choiceTimerRef.current = setTimeout(() => {
      choiceTimerRef.current = null;
      choiceLockedRef.current = false;
      if (questionIndex + 1 < activeDomain.questions.length) {
        setAnswers(nextAnswers);
        setQuestionIndex((prev) => prev + 1);
        setStampedOption(null);
        questionStartRef.current = Date.now();
      } else {
        recordQuestionChoice({
          domain: activeDomain,
          answers: nextAnswers,
        });
        setNewlyBloomedDomainId(activeDomain.id);
        setStampedOption(null);
        setOverlayMode('note');
        setTimeout(() => {
          setNewlyBloomedDomainId(null);
        }, 2200);
      }
    }, 360);
  };

  const activeCompletedResult =
    activeDomainId !== null ? state.completedDomains[activeDomainId] : null;
  const activeMatchedPhenotype = useMemo(() => {
    if (!activeDomain) return null;
    if (activeCompletedResult) {
      return (
        activeDomain.phenotypes.find(
          (p) => p.id === activeCompletedResult.matchedPhenotypeId
        ) ?? activeDomain.phenotypes[0]
      );
    }
    return predictUnplayedDomainPhenotype(
      activeDomain,
      state.layer3Vector,
      state.completedDomains
    ).predictedPhenotype;
  }, [
    activeDomain,
    activeCompletedResult,
    state.layer3Vector,
    state.completedDomains,
  ]);

  const describeResponseTempo = (avgMs?: number) => {
    if (!avgMs) return '이 분야에서 고른 답을 정리한 결과예요.';
    const sec = (avgMs / 1000).toFixed(1);
    return `문항당 평균 ${sec}초가 기록됐습니다. 읽는 속도나 중단 시간도 포함될 수 있어, 응답 시간만으로 취향의 확신을 판단하지 않습니다.`;
  };

  const roomCommonTraits = useMemo(() => {
    if (completedDomainIds.length === 0) return [];
    const l3 = state.layer3Vector;
    const lines: string[] = [];
    if (l3.complexity <= -0.2) lines.push('이번 응답에서는 장식이 적고 단순한 쪽을 더 골랐어요.');
    else if (l3.complexity >= 0.2) lines.push('이번 응답에서는 질감과 디테일이 많은 쪽을 더 골랐어요.');
    if (l3.conceptualism >= 0.2) lines.push('이번 응답에서는 원리와 배경을 강조한 쪽을 더 골랐어요.');
    else if (l3.conceptualism <= -0.2) lines.push('이번 응답에서는 설명보다 바로 느껴지는 인상을 더 골랐어요.');
    if (l3.novelty >= 0.2) lines.push('이번 응답에서는 익숙한 것보다 새로운 시도를 더 골랐어요.');
    else if (l3.novelty <= -0.2) lines.push('이번 응답에서는 새로운 시도보다 익숙한 스타일을 더 골랐어요.');
    return lines;
  }, [state.layer3Vector, completedDomainIds.length]);

  const currentPulse =
    DAILY_PULSE_QUESTIONS[activePulseIdx] ?? DAILY_PULSE_QUESTIONS[0];

  const [today, setToday] = useState(() => koreanDay(Date.now()));
  useEffect(() => {
    const refreshDay = () => setToday(koreanDay(Date.now()));
    const timer = setInterval(refreshDay, 1000);
    window.addEventListener('focus', refreshDay);
    return () => { clearInterval(timer); window.removeEventListener('focus', refreshDay); };
  }, []);
  useEffect(() => {
    setPulsePhase('initial');
    setPhase1Choice(null);
    setPhase2Choice(null);
    pulseStartRef.current = Date.now();
  }, [currentUserId, today]);
  const savedPulse = state.dailyShiftLog.filter(
    (entry) => entry.pulseId === currentPulse.id && koreanDay(entry.timestamp) === today
  ).at(-1);
  const pulsePhase = savedPulse ? 'letter' : draftPulsePhase;
  const phase1Choice = savedPulse?.phase1Choice ?? draftPhase1Choice;
  const phase2Choice = savedPulse?.phase2ChoiceAfterSocialProof ?? draftPhase2Choice;
  const phase1Rt = savedPulse?.phase1ResponseTimeMs ?? draftPhase1Rt;

  const handlePulsePhase1 = (choice: 'A' | 'B') => {
    if (!isHydrated || savedPulse) return;
    const rt = Math.max(300, Date.now() - pulseStartRef.current);
    setPhase1Choice(choice);
    setPhase1Rt(rt);
    setPulsePhase('nudge');
  };

  const handlePulsePhase2 = (finalChoice: 'A' | 'B') => {
    if (!isHydrated || savedPulse || !phase1Choice) return;
    setPhase2Choice(finalChoice);
    recordDailyPulseShift({
      pulseId: currentPulse.id,
      phase1Choice,
      phase1ResponseTimeMs: phase1Rt,
      phase2ChoiceAfterSocialProof: finalChoice,
    });
    setPulsePhase('letter');
  };

  return (
    <div className="w-full">
      <section aria-labelledby="observation-entry" className="border-b border-[#0042AF]/20 bg-[#F6F3E9] px-5 pb-8 pt-32 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <header className="mb-8 max-w-3xl"><p className="text-sm tracking-wide text-[#0042AF]">ROOM RUBATO · 관찰실</p><h1 id="observation-entry" className="mt-3 text-3xl font-semibold leading-tight text-[#010D6E]">작품을 보고, 좋아하는 이유를 찾아보세요.</h1></header>
          <div className="grid gap-8 lg:grid-cols-[2fr_1fr] lg:items-start"><HomeObservationPreview embedded/><NotebookReturn withArtworkPreview/></div>
        </div>
      </section>
      <DomainExplorer completedIds={completedDomainIds} ready={isHydrated} onSelect={id=>{if(!isHydrated)return;if(state.completedDomains[id])handleOpenResultNote(id);else handleSelectRoomObject(id);}} />
      {/* =====================================================================
          SCENE 1: INTERACTIVE ILLUSTRATED ROOM (100SVH)
         ===================================================================== */}
      <section
        id="room-stage"
        className="relative w-full h-[100svh] min-h-[700px] max-h-[1150px] overflow-hidden border-b border-[#0042AF]/20"
      >
        <RoomCanvas
          completedDomains={state.completedDomains}
          hoveredDomainId={hoveredDomainId}
          activeDomainId={
            activeDomainId !== null && overlayMode === 'choose'
              ? activeDomainId
              : null
          }
          newlyBloomedDomainId={newlyBloomedDomainId}
          onHoverObject={setHoveredDomainId}
          onSelectObject={handleSelectRoomObject}
        />

        {/* Bottom Floating Guide Bar / Hovered Object Preview */}
        {activeDomainId === null && (
          <div className="pointer-events-none absolute bottom-4 sm:bottom-6 left-5 sm:left-8 right-5 sm:right-8 z-20 flex flex-col md:flex-row items-start md:items-end justify-between gap-4 max-w-[1460px] mx-auto">
            {hoveredContext ? (
              <div className="pointer-events-auto max-w-[580px] paper-sheet rounded-2xl p-4 sm:p-5 transition-all duration-300 flex items-center gap-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-[#0042AF]/30 shrink-0 bg-[#FFF9EB]">
                  <img
                    src={hoveredContext.roomObj.artworkUrl}
                    alt={hoveredContext.roomObj.objectName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold text-[13px] text-[#0042AF]">
                        [{hoveredContext.domain.shortTitle}]
                      </span>
                      <span className="text-[14px] font-semibold text-[#010D6E] truncate">
                        {hoveredContext.roomObj.objectName}
                      </span>
                    </div>
                    <span
                      className={`shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        hoveredContext.isCompleted
                          ? 'bg-[#0042AF] text-[#FEF1D0]'
                          : 'bg-[#D4653B] text-[#FFFDF7]'
                      }`}
                    >
                      {hoveredContext.isCompleted
                        ? '취향 찾기 완료'
                        : `클릭해서 시작 (${hoveredContext.domain.questions.length}문항)`}
                    </span>
                  </div>

                  <p className="font-editorial text-[14.5px] text-[#010D6E] mb-1">
                    {hoveredContext.headline}
                  </p>
                  <p className="text-[12.5px] text-[#010D6E]/80 leading-relaxed line-clamp-2">
                    {hoveredContext.body}
                  </p>
                </div>
              </div>
            ) : (
              <div className="pointer-events-auto bg-[#FFF9EB]/95 backdrop-blur-md border border-[#0042AF]/30 rounded-full px-4 sm:px-5 py-2.5 shadow-[0_8px_24px_-8px_rgba(1,13,110,0.14)] flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
                <span className="font-medium text-[#010D6E]">
                  <strong>색이 채워진 물건 {completedDomainIds.length}개</strong>는 답한 분야예요. 아직 안 본 분야는 물건이나 위의 목록에서 골라보세요.
                </span>
                <span className="opacity-30 hidden sm:inline">|</span>
                {completedDomainIds.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => { if (window.confirm("저장된 취향 결과와 응답 기록을 모두 지울까요? 이 작업은 되돌릴 수 없습니다. 계정과 동의 기록은 유지됩니다.")) resetAllData(); }}
                    className="text-[#0042AF] hover:text-[#010D6E] underline underline-offset-4 font-semibold"
                  >
                    전체 초기화
                  </button>
                ) : null}
              </div>
            )}

            <a
              href="#threads-spread"
              className="pointer-events-auto hidden sm:inline-flex items-center gap-2 bg-[#FFF9EB]/95 backdrop-blur-md px-4 py-2.5 rounded-full border border-[#0042AF]/30 text-[13px] font-semibold text-[#010D6E] hover:border-[#0042AF] transition-all shadow-sm"
            >
              <span>취향 연결 결과 보기</span>
              <span className="text-[#0042AF]">↓</span>
            </a>
          </div>
        )}

        {/* =================================================================
            IN-ROOM MODAL: 3-QUESTION VISUAL CHOICE OR RESULT VIEW
           ================================================================= */}
        {activeDomain && activeRoomObj && (
          <RoomDialog onClose={handleCloseOverlay}>
            {overlayMode === 'choose' ? (
              /* MODE A: 3-STEP VISUAL COMPARISON (WITH DEDICATED OPTION IMAGES) */
              <div className="w-full max-w-[980px] my-auto paper-sheet rounded-3xl p-5 sm:p-8">
                {/* Top Header Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-[#0042AF]/15">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#0042AF] text-[#FEF1D0] text-[12px] font-semibold">
                      {activeDomain.shortTitle} 취향 찾기
                    </span>
                    <span className="font-editorial text-[17px] sm:text-[19px] text-[#010D6E]">
                      {activeRoomObj.objectName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[13px] font-semibold text-[#0042AF]">
                        질문 {questionIndex + 1} / {activeDomain.questions.length}
                      </span>
                      <div className="flex items-center gap-1">
                        {activeDomain.questions.map((q, i) => (
                          <span
                            key={q.id}
                            className={`h-1.5 rounded-full transition-all ${
                              i === questionIndex
                                ? 'w-4 bg-[#D4653B]'
                                : i < questionIndex
                                  ? 'w-2 bg-[#0042AF]'
                                  : 'w-1.5 bg-[#0042AF]/20'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {activeCompletedResult && (
                      <button
                        type="button"
                        onClick={() => setOverlayMode('note')}
                        className="px-3 py-1.5 rounded-full bg-[#FFF9EB] border border-[#0042AF]/30 text-[12.5px] font-medium text-[#0042AF] hover:border-[#0042AF] transition-colors"
                      >
                        이전 결과 보기 →
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleCloseOverlay}
                      className="px-3.5 py-1.5 rounded-full bg-[#FEF1D0] border border-[#0042AF]/30 text-[13px] font-medium text-[#010D6E] hover:border-[#0042AF] transition-colors"
                    >
                      방으로 돌아가기 ✕
                    </button>
                  </div>
                </div>

                {/* Clear Question Prompt */}
                <div className="text-center max-w-[720px] mx-auto mb-6">
                  {activeDomain.questions[questionIndex]?.contextHint && (
                    <span className="inline-block px-3 py-0.5 rounded-full bg-[#FEF1D0]/90 border border-[#0042AF]/20 text-[12px] font-semibold text-[#0042AF] mb-2">
                      {activeDomain.questions[questionIndex]?.contextHint}
                    </span>
                  )}
                  <h2 className="font-editorial text-[20px] sm:text-[24px] text-[#010D6E] leading-[1.42] mb-1.5">
                    Q{questionIndex + 1}. {activeDomain.questions[questionIndex]?.prompt}
                  </h2>
                  <p className="text-[13.5px] text-[#0042AF]/85">
                    전문 용어를 몰라도 괜찮습니다. 두 가지 실제 아이템 중 평소 더 마음이 가는 쪽을 골라 주세요.
                  </p>
                </div>

                {/* Two Visual Option Cards (Option A & Option B) */}
                {activeDomain.questions[questionIndex] && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 items-stretch">
                    {(
                      [
                        {
                          key: 'A' as const,
                          opt: activeDomain.questions[questionIndex].optionA,
                        },
                        {
                          key: 'B' as const,
                          opt: activeDomain.questions[questionIndex].optionB,
                        },
                      ] as const
                    ).map(({ key, opt }) => {
                      const isStamped = stampedOption === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handlePickPostcardOption(key)}
                          className={`paper-postcard text-left rounded-2xl p-5 flex flex-col justify-between relative group ${
                            isStamped
                              ? 'ring-2 ring-[#D4653B] bg-[#FFF5DF]'
                              : ''
                          }`}
                        >
                          {isStamped && (
                            <div className="pointer-events-none absolute top-4 right-4 z-20 px-3 py-1 rounded-full bg-[#D4653B] text-[#FFFDF7] text-[12px] font-semibold shadow-md">
                              선택 완료 ✓
                            </div>
                          )}

                          <div>
                            <SpecimenPlate
                              variant={key}
                              domainId={activeDomain.id}
                              questionId={
                                activeDomain.questions[questionIndex].id
                              }
                              visualTone={opt.visualTone}
                            />

                            <h3 className="font-editorial text-[17px] sm:text-[18.5px] text-[#010D6E] leading-[1.45] mb-2">
                              {opt.title}
                            </h3>

                            <p className="text-[13.5px] text-[#010D6E]/80 leading-[1.6]">
                              {opt.description}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-[#0042AF]/15 flex items-center justify-between text-[13.5px] font-semibold text-[#0042AF] group-hover:text-[#010D6E]">
                            <span>이쪽이 더 마음에 든다</span>
                            <span className="transition-transform group-hover:translate-x-1">
                              →
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* MODE B: CLEAR RESULT VIEW */
              activeMatchedPhenotype && (
                <div className="w-full max-w-[780px] my-auto paper-sheet rounded-3xl p-6 sm:p-9 relative">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-[#0042AF]/15">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#0042AF] text-[#FEF1D0] text-[12px] font-semibold">
                        {activeDomain.shortTitle} 취향 결과
                      </span>
                      <span className="font-semibold text-[15px] text-[#010D6E]">
                        {activeRoomObj.objectName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleStartRechoose}
                        className="px-3 py-1.5 rounded-full border border-[#0042AF]/30 text-[12.5px] text-[#0042AF] hover:bg-[#FEF1D0] transition-colors"
                      >
                        다시 선택하기
                      </button>
                      <button
                        type="button"
                        onClick={handleCloseOverlay}
                        className="px-4 py-1.5 rounded-full bg-[#0042AF] text-[#FEF1D0] text-[12.5px] font-semibold hover:bg-[#010D6E] transition-colors"
                      >
                        방으로 돌아가기 ✕
                      </button>
                    </div>
                  </div>

                  {/* Title, Object Illustration & Clear Analysis */}
                  <div className="mb-6 flex flex-col sm:flex-row gap-5 items-start">
                    <div className="w-full sm:w-40 h-40 rounded-2xl overflow-hidden border border-[#0042AF]/30 shrink-0 bg-[#FFF9EB] shadow-sm">
                      <img
                        src={activeRoomObj.artworkUrl}
                        alt={activeRoomObj.objectName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#D4653B] text-[#FFFDF7] text-[11px] font-semibold">
                          총 {activeDomain.phenotypes.length}가지 세부 유형 중 나의 매칭 결과
                        </span>
                        <span className="text-[12px] font-semibold text-[#0042AF]">
                          {activeMatchedPhenotype.englishCode}
                        </span>
                      </div>
                      <h2 className="font-editorial text-[21px] sm:text-[25px] text-[#010D6E] leading-[1.38] mb-2.5">
                        “{activeMatchedPhenotype.name}”
                      </h2>
                      <p className="text-[14px] text-[#010D6E]/85 leading-[1.7] mb-3">
                        {activeMatchedPhenotype.deepAnalysis}
                      </p>
                      <p className="text-[12.5px] text-[#0042AF] bg-[#FEF1D0]/70 rounded-xl px-3.5 py-2 border border-[#0042AF]/20">
                        {describeResponseTempo(
                          activeCompletedResult?.avgResponseTimeMs
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Multi-Axis Spectrum Bars */}
                  <div className="mb-6 rounded-2xl bg-[#FFFDF7] border border-[#0042AF]/20 p-4 sm:p-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3.5">
                      <h3 className="font-editorial text-[16px] text-[#010D6E]">
                        선택에서 드러난 {activeDomain.axes.length}가지 취향 축 분석
                      </h3>
                      <span className="text-[11.5px] text-[#0042AF]/75">
                        {activeDomain.questions.length}개 실생활 문항 응답 기반
                      </span>
                    </div>
                    <div className="space-y-3.5">
                      {activeDomain.axes.map((axis) => {
                        const rawScore =
                          activeCompletedResult?.axisScores?.[axis.axisKey] ??
                          activeMatchedPhenotype.axisSignature?.[
                            axis.axisKey
                          ] ??
                          0;
                        const clamped = Math.max(-1, Math.min(1, rawScore));
                        const rightPct = Math.round(((clamped + 1) / 2) * 100);
                        const leftPct = 100 - rightPct;
                        const isLeftDominant = leftPct >= rightPct;

                        return (
                          <div key={axis.axisKey} className="space-y-1">
                            <div className="flex items-center justify-between text-[12.5px]">
                              <span
                                className={
                                  isLeftDominant
                                    ? 'font-bold text-[#010D6E]'
                                    : 'text-[#010D6E]/65'
                                }
                              >
                                {axis.leftLabel}{' '}
                                <strong className="text-[#0042AF]">
                                  {leftPct}%
                                </strong>
                              </span>
                              <span
                                className={
                                  !isLeftDominant
                                    ? 'font-bold text-[#010D6E]'
                                    : 'text-[#010D6E]/65'
                                }
                              >
                                <strong className="text-[#D4653B]">
                                  {rightPct}%
                                </strong>{' '}
                                {axis.rightLabel}
                              </span>
                            </div>
                            <div className="w-full h-2.5 rounded-full bg-[#F3E8D3] overflow-hidden flex border border-[#0042AF]/15">
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

                  {/* All Phenotypes Badges */}
                  <div className="mb-6">
                    <p className="text-[12.5px] font-semibold text-[#0042AF] mb-2">
                      이 분야의 {activeDomain.phenotypes.length}가지 세부 유형 중 내 위치
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {activeDomain.phenotypes.map((p) => {
                        const isMine = p.id === activeMatchedPhenotype.id;
                        return (
                          <div
                            key={p.id}
                            className={`rounded-xl px-3 py-2 border text-[12px] ${
                              isMine
                                ? 'bg-[#0042AF] text-[#FEF1D0] border-[#0042AF] font-bold shadow-sm'
                                : 'bg-[#FFFDF7] text-[#010D6E]/75 border-[#0042AF]/15'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="truncate">{p.name}</span>
                              {isMine && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#D4653B] text-white shrink-0">
                                  MY
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Question Option Illustrations Strip */}
                  <div className="mb-6">
                    <p className="text-[12.5px] font-semibold text-[#0042AF] mb-2.5">
                      내가 고른 {activeDomain.questions.length}가지 실제 아이템
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {activeDomain.questions.map((q, idx) => {
                        const chosenLog = [...state.choiceTelemetryLog]
                          .reverse()
                          .find((l) => l.questionId === q.id);
                        const chosenSide = chosenLog?.chosenOption ?? 'A';
                        const chosenOpt =
                          chosenSide === 'A' ? q.optionA : q.optionB;
                        const imgSrc =
                          QUESTION_OPTION_IMAGES[q.id]?.[chosenSide] ??
                          activeRoomObj.artworkUrl;
                        return (
                          <div
                            key={q.id}
                            className="rounded-xl bg-[#FFFDF7] border border-[#0042AF]/20 p-2 flex flex-col gap-1"
                          >
                            <div className="w-full h-20 rounded-lg overflow-hidden bg-[#F7EFE1] border border-[#0042AF]/15">
                              <img
                                src={`${imgSrc}?v=5`}
                                alt={chosenOpt.title}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <span className="text-[10.5px] font-semibold text-[#0042AF]">
                              Q{idx + 1} · 선택 {chosenSide}
                            </span>
                            <p className="text-[11px] text-[#010D6E] font-medium line-clamp-2 leading-[1.3]">
                              {chosenOpt.title}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Practical Shopping / Decision Guide */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                    <div className="rounded-2xl bg-[#FEF1D0]/55 border border-[#0042AF]/20 p-4 sm:p-5">
                      <h3 className="font-editorial text-[15.5px] text-[#010D6E] mb-3">
                        고를 때 실패 줄이는 기준 3가지
                      </h3>
                      <ul className="space-y-2 text-[13.5px] text-[#010D6E]/85 leading-relaxed">
                        {activeMatchedPhenotype.decisionGuide.map(
                          (guide, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="font-bold text-[#D4653B]">
                                {i + 1}.
                              </span>
                              <span>{guide}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    <div className="rounded-2xl bg-[#FFFDF7] border border-[#0042AF]/20 p-4 sm:p-5">
                      <h3 className="font-editorial text-[15.5px] text-[#010D6E] mb-3">
                        추천 브랜드 · 레퍼런스
                      </h3>
                      <div className="space-y-2.5">
                        {activeMatchedPhenotype.curations.map((rec) => {
                          const existingReaction =
                            state.curationFeedbackLog.find(
                              (f) => f.curationId === rec.id
                            )?.reaction;
                          return (
                            <div
                              key={rec.id}
                              className="pb-2.5 border-b border-[#0042AF]/10 last:border-b-0 last:pb-0"
                            >
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="text-[13.5px] font-semibold text-[#010D6E]">
                                  {rec.title}
                                </span>
                                <span className="text-[11px] text-[#0042AF]/75">
                                  {rec.category}
                                </span>
                              </div>
                              <p className="text-[12px] text-[#010D6E]/75 mt-0.5">
                                {rec.reason}
                              </p>
                              <div className="mt-1.5 flex items-center gap-2 text-[11px]">
                                <button
                                  type="button"
                                  onClick={() =>
                                    recordCurationFeedback({
                                      curationId: rec.id,
                                      domainId: activeDomain.id,
                                      phenotypeId: activeMatchedPhenotype.id,
                                      reaction: 'resonant',
                                    })
                                  }
                                  className={`px-2.5 py-0.5 rounded-full border transition-colors ${
                                    existingReaction === 'resonant'
                                      ? 'bg-[#0042AF] text-[#FEF1D0] border-[#0042AF]'
                                      : 'border-[#0042AF]/25 text-[#0042AF] hover:border-[#0042AF]'
                                  }`}
                                >
                                  마음에 듦 👍
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    recordCurationFeedback({
                                      curationId: rec.id,
                                      domainId: activeDomain.id,
                                      phenotypeId: activeMatchedPhenotype.id,
                                      reaction: 'not_me',
                                    })
                                  }
                                  className={`px-2.5 py-0.5 rounded-full border transition-colors ${
                                    existingReaction === 'not_me'
                                      ? 'bg-[#D4653B] text-[#FFFDF7] border-[#D4653B]'
                                      : 'border-[#0042AF]/25 text-[#0042AF]/70 hover:border-[#0042AF]'
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

                  {/* Bottom Navigation */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#0042AF]/15">
                    <button
                      type="button"
                      onClick={handleCloseOverlay}
                      className="btn-cream px-5 py-2.5 text-[13.5px] w-full sm:w-auto justify-center"
                    >
                      방 화면으로 돌아가기
                    </button>

                    {bridgedUnplayed[0] && (
                      <button
                        type="button"
                        onClick={() =>
                          handleSelectRoomObject(bridgedUnplayed[0].domain.id)
                        }
                        className="btn-cobalt px-5 py-2.5 text-[13.5px] w-full sm:w-auto justify-center"
                      >
                        <span>
                          이어서 [{bridgedUnplayed[0].domain.shortTitle}] 취향도 찾아보기
                        </span>
                        <span>→</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            )}
          </RoomDialog>
        )}
      </section>

      {/* =====================================================================
          SCENE 2: TASTE CONNECTION SPREAD (KNOWN -> UNKNOWN)
         ===================================================================== */}
      <section
        id="threads-spread"
        className="relative py-20 sm:py-24 px-5 sm:px-8 max-w-[1360px] mx-auto"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-[13px] font-bold text-[#0042AF] mb-1.5">
              취향 연결 리포트
            </p>
            <h2 className="font-editorial text-[26px] sm:text-[32px] text-[#010D6E] leading-tight">
              내 선택과 연결해 살펴볼 다른 분야
            </h2>
          </div>
          <p className="text-[14px] text-[#010D6E]/80 max-w-[460px]">
            {completedDomainIds.length > 0 ? '앞에서 고른 색감·질감과 연결해 다른 분야의 스타일을 골라봤어요. 분야가 달라지면 취향도 다를 수 있으니, 직접 비교해 보세요.' : '아직 응답이 없어 취향을 요약하지 않았어요. 궁금한 분야 하나부터 골라보세요.'}
          </p>
        </div>

        <div className="relative paper-sheet rounded-[28px] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          <div
            className="hidden lg:block pointer-events-none absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-10 z-10"
            style={{
              background:
                'linear-gradient(90deg, rgba(1,13,110,0) 0%, rgba(1,13,110,0.08) 50%, rgba(1,13,110,0) 100%)',
            }}
          >
            <div className="h-full w-[1px] mx-auto border-l border-dashed border-[#0042AF]/35" />
          </div>

          {/* LEFT PAGE: COMPLETED DOMAINS */}
          <div className="lg:col-span-6 p-7 sm:p-10 border-b lg:border-b-0 border-[#0042AF]/15 flex flex-col justify-between bg-[#FFFDF7]/60">
            <div>
              <div className="flex items-center justify-between text-[12.5px] font-semibold text-[#0042AF] mb-4">
                <span>1. 내가 답한 분야</span>
                <span>{completedDomainIds.length}개 완료</span>
              </div>

              <h3 className="font-editorial text-[20px] sm:text-[22px] text-[#010D6E] leading-snug mb-4">
                {completedDomainIds.length > 0 ? '이번 선택에서 보이는 특징' : '아직 완료한 분야가 없어요'}
              </h3>

              <div className="space-y-2 mb-7 text-[14px] text-[#010D6E]/85 leading-[1.7] bg-[#FEF1D0]/55 rounded-2xl p-5 border border-[#0042AF]/20">
                {roomCommonTraits.length === 0 && (
                  <p>{completedDomainIds.length === 0 ? '답변을 마치면 여기에 선택 기록을 정리해 드려요.' : '현재 응답만으로는 한 방향의 특징을 요약하기 어려워요. 이것도 자연스러운 결과예요.'}</p>
                )}
                <ul className="space-y-2">
                  {roomCommonTraits.map((line, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#D4653B] font-bold">
                        {idx + 1}.
                      </span>
                      <span className="font-medium text-[#010D6E]">{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                {completedDomainIds.map((id) => {
                  const dom = getDomainById(id);
                  const robj = getRoomObjectByDomainId(id);
                  const res = state.completedDomains[id];
                  if (!dom || !robj || !res) return null;
                  const pheno =
                    dom.phenotypes.find(
                      (p) => p.id === res.matchedPhenotypeId
                    ) ?? dom.phenotypes[0];

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        document
                          .getElementById('room-stage')
                          ?.scrollIntoView({ behavior: 'smooth' });
                        setTimeout(() => handleOpenResultNote(id), 420);
                      }}
                      className="w-full text-left rounded-2xl p-3.5 bg-[#FFF9EB] hover:bg-[#FEF1D0] border border-[#0042AF]/25 transition-all flex items-center justify-between gap-4 group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#0042AF]/25 shrink-0 bg-[#FFFDF7]">
                          <img
                            src={robj.artworkUrl}
                            alt={robj.objectName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded bg-[#0042AF] text-[#FEF1D0] text-[11px] font-semibold">
                              {dom.shortTitle}
                            </span>
                            <span className="text-[13.5px] font-semibold text-[#010D6E] truncate">
                              {robj.objectName}
                            </span>
                          </div>
                          <p className="font-editorial text-[15px] text-[#010D6E] truncate">
                            {pheno.name}
                          </p>
                        </div>
                      </div>
                      <span className="text-[12px] font-semibold text-[#0042AF] group-hover:translate-x-1 transition-transform shrink-0">
                        결과 보기 →
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT PAGE: PREDICTED UNPLAYED DOMAINS */}
          <div className="lg:col-span-6 p-7 sm:p-10 flex flex-col justify-between bg-[#FFF9EB]">
            <div>
              <div className="flex items-center justify-between text-[12.5px] font-semibold text-[#D4653B] mb-4">
                <span>2. 다음에 살펴볼 분야</span>
                <span>남은 분야 {unplayedDomains.length}개</span>
              </div>

              <h3 className="font-editorial text-[20px] sm:text-[22px] text-[#010D6E] leading-snug mb-2">
                {completedDomainIds.length > 0 ? '내 선택과 연결해 제안하는 스타일' : '여기서 시작해 보세요'}
              </h3>
              <p className="text-[13.5px] text-[#010D6E]/75 mb-6">
                분야별 질문에 답하며 어떤 스타일이 마음에 드는지 비교해 보세요.
              </p>

              <div className="space-y-4">
                {bridgedUnplayed.slice(0, 3).map((item) => (
                  <div
                    key={item.domain.id}
                    className="group rounded-2xl p-4 sm:p-5 bg-[#FFFDF7] border border-dashed border-[#0042AF]/45 hover:border-solid hover:border-[#0042AF] transition-all flex gap-4 items-start"
                  >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-[#0042AF]/25 shrink-0 bg-[#FFF9EB]">
                      <img
                        src={item.roomObj.artworkUrl}
                        alt={item.roomObj.objectName}
                        className="w-full h-full object-cover transition-all duration-500"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 truncate">
                          <span className="px-2 py-0.5 rounded bg-[#FEF1D0] border border-[#0042AF]/30 text-[11.5px] font-semibold text-[#010D6E]">
                            {item.domain.shortTitle}
                          </span>
                          <span className="text-[14.5px] font-semibold text-[#010D6E] truncate">
                            {item.roomObj.objectName}
                          </span>
                        </div>
                      </div>

                      <p className="font-editorial text-[15.5px] text-[#010D6E] mb-1.5">
                        {completedDomainIds.length > 0 ? `살펴볼 스타일: 「${item.predictedPhenotype.name}」` : `${item.domain.shortTitle}의 다양한 스타일`}
                      </p>

                      <p className="text-[13px] text-[#010D6E]/80 leading-[1.6] mb-3">
                        {item.bridgeExplanation}
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          document
                            .getElementById('room-stage')
                            ?.scrollIntoView({ behavior: 'smooth' });
                          setTimeout(
                            () => handleSelectRoomObject(item.domain.id),
                            420
                          );
                        }}
                        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0042AF] hover:text-[#010D6E]"
                      >
                        <span>{item.domain.questions.length}문항으로 직접 해보기</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* All 12 Quick Buttons */}
            <div className="mt-8 pt-5 border-t border-[#0042AF]/15">
              <p className="text-[12px] font-semibold text-[#0042AF] mb-2.5">
                전체 12개 분야 바로가기
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ROOM_OBJECTS.map((robj) => {
                  const done = Boolean(state.completedDomains[robj.domainId]);
                  return (
                    <button
                      key={robj.domainId}
                      type="button"
                      aria-label={`${robj.domainLabel} (${robj.shortObject})`}
                      onClick={() => handleSelectRoomObject(robj.domainId)}
                      className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors flex items-center gap-1.5 ${
                        done
                          ? 'bg-[#0042AF] text-[#FEF1D0]'
                          : 'bg-[#FEF1D0]/80 text-[#010D6E] border border-[#0042AF]/35 hover:bg-[#FEF1D0]'
                      }`}
                    >
                      <span>{robj.domainLabel}</span>
                      <span className="opacity-70">({robj.shortObject})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SCENE 3: DAILY QUESTION — MY CHOICE VS OTHER PEOPLE
         ===================================================================== */}
      <section
        id="yesterday-letter"
        className="py-16 sm:py-20 px-5 sm:px-8 max-w-[1140px] mx-auto"
      >
        <div className="paper-sheet rounded-[28px] p-7 sm:p-11 relative">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-7 border-b border-[#0042AF]/15">
            <div>
              <p className="text-[13px] font-bold text-[#0042AF] mb-1">
                {DAILY_PULSE_QUESTIONS.length}개 질문 중 하나를 골라보세요. 같은 질문에도 다음 날 다시 답할 수 있어요.
              </p>
              <h2 className="font-editorial text-[24px] sm:text-[28px] text-[#010D6E]">
                오늘의 질문 — 상황이 달라지면 내 선택도 바뀔까?
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="오늘의 질문 선택">
              {DAILY_PULSE_QUESTIONS.map((q, idx) => (
                <button
                  key={q.id}
                  type="button"
                  aria-pressed={activePulseIdx === idx}
                  onClick={() => {
                    setActivePulseIdx(idx);
                    setPulsePhase('initial');
                    setPhase1Choice(null);
                    setPhase2Choice(null);
                    pulseStartRef.current = Date.now();
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-[12.5px] transition-colors ${
                    activePulseIdx === idx
                      ? 'bg-[#0042AF] text-[#FEF1D0] font-semibold'
                      : 'bg-[#FEF1D0] text-[#010D6E] hover:bg-[#F6E2B3]'
                  }`}
                >
                  질문 {idx + 1} · {q.domainTitle}
                </button>
              ))}
            </div>
          </div>

          {!isHydrated && <p role="status">저장된 응답을 불러오는 중입니다.</p>}
          {isHydrated && pulsePhase === 'initial' && (
            <div>
              <p className="text-[13px] text-[#D4653B] font-semibold mb-2">
                {currentPulse.dayLabel}
              </p>
              <h3 className="font-editorial text-[20px] sm:text-[23px] text-[#010D6E] leading-snug mb-6">
                Q. {currentPulse.questionText}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                {(['A', 'B'] as const).map((key) => {
                  const opt =
                    key === 'A' ? currentPulse.optionA : currentPulse.optionB;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handlePulsePhase1(key)}
                      className="paper-postcard text-left rounded-2xl p-6 flex flex-col justify-between group"
                    >
                      <div>
                        <SpecimenPlate
                          variant={key}
                          domainId={currentPulse.domainId}
                          questionId={currentPulse.id}
                          visualTone={opt.label}
                        />
                        <h4 className="font-editorial text-[18px] text-[#010D6E] leading-snug mb-2">
                          {opt.label}
                        </h4>
                        <p className="text-[13.5px] text-[#010D6E]/75">
                          {opt.desc}
                        </p>
                      </div>
                      <div className="mt-5 pt-3 border-t border-[#0042AF]/15 flex items-center justify-between text-[13.5px] font-semibold text-[#0042AF]">
                        <span>이쪽으로 선택하기</span>
                        <span>→</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {pulsePhase === 'nudge' && phase1Choice && (
            <div className="max-w-[760px] mx-auto py-4">
              <p className="text-[13px] font-bold text-[#D4653B] mb-2">
                가상 상황에서 다시 골라보기
              </p>
              <h3 className="font-editorial text-[20px] sm:text-[22px] text-[#010D6E] leading-relaxed mb-4">
                {currentPulse.socialProofNudge.nudgePrompt}
              </h3>
              <p className="text-[14px] text-[#0042AF]/85 mb-6">
                처음에는 <strong>{phase1Choice}</strong>를 골랐어요. 가상 상황을 읽고, 답을 유지할지 바꿀지 선택해 주세요.
              </p>

              <div className="flex flex-col sm:flex-row gap-3.5">
                <button
                  type="button"
                  onClick={() => handlePulsePhase2(phase1Choice)}
                  className="btn-cobalt px-6 py-3 text-[14px] justify-center"
                >
                  처음 고른 {phase1Choice} 유지하기
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handlePulsePhase2(phase1Choice === 'A' ? 'B' : 'A')
                  }
                  className="btn-cream px-6 py-3 text-[14px] justify-center"
                >
                  다른 쪽({phase1Choice === 'A' ? 'B' : 'A'}
                  )으로 바꾸기
                </button>
              </div>
            </div>
          )}

          {pulsePhase === 'letter' && (
            <div className="space-y-6">
              <div className="rounded-2xl bg-[#FEF1D0]/70 border border-[#0042AF]/25 p-5 sm:p-6">
                <p className="text-[13px] text-[#D4653B] font-semibold mb-1">
                  나의 선택 결과
                </p>
                <p className="font-editorial text-[17px] text-[#010D6E]">
                  {phase1Choice === phase2Choice
                    ? `가상 상황을 읽은 뒤에도 처음 고른 선택 ${phase2Choice}를 그대로 유지하셨습니다.`
                    : `처음에는 선택 ${phase1Choice}를 고르셨다가, 가상 상황을 읽고 선택 ${phase2Choice}로 바꾸셨습니다.`}
                </p>
              </div>

              <div className="rounded-2xl bg-[#FFFDF7] border border-[#0042AF]/20 p-6 sm:p-8 space-y-3.5">
                <p className="text-[13px] font-bold text-[#0042AF]">
                  선택 뒤에 남는 질문 · 편집 노트
                </p>
                <h4 className="font-editorial text-[19px] sm:text-[21px] text-[#010D6E] leading-snug">
                  {currentPulse.yesterdayInsight.questionSummary}
                </h4>
                <p className="text-[14.5px] text-[#010D6E]/80 leading-[1.7]">
                  {currentPulse.yesterdayInsight.crowdMajorityText}
                </p>
                <p className="text-[14.5px] text-[#010D6E] font-medium leading-[1.7] pl-4 border-l-2 border-[#D4653B]">
                  {currentPulse.yesterdayInsight.personaDivergenceText}
                </p>
                <p className="text-[13.5px] text-[#0042AF] pt-1">
                  · {currentPulse.yesterdayInsight.keyTakeaway}
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setActivePulseIdx((idx) => (idx + 1) % DAILY_PULSE_QUESTIONS.length);
                    setPulsePhase('initial');
                    setPhase1Choice(null);
                    setPhase2Choice(null);
                    pulseStartRef.current = Date.now();
                  }}
                  className="text-[13px] font-semibold text-[#0042AF] underline underline-offset-4"
                >
                  다른 질문 보기
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
