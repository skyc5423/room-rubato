'use client';

import React from 'react';
import { SurveyResetControl } from '@/components/SurveyResetControl';
import Link from 'next/link';
import { usePersonaStore } from '@/lib/persona-store';
import { ALL_MASTER_DOMAINS } from '@/lib/domains-index';
import { getRoomObjectByDomainId } from '@/lib/room-objects';

export default function ResearchPage() {
  const { state } = usePersonaStore();
  const completedList = Object.values(state.completedDomains);

  return (
    <div className="min-h-[100svh] bg-[#FEF1D0] text-[#010D6E] pt-6 sm:pt-28 pb-20 px-6">
      <div className="max-w-[980px] mx-auto space-y-10">
        {/* Header */}
        <div className="border-b border-[#0042AF]/20 pb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="font-display italic text-[17px] text-[#0042AF] mb-1">
              My Taste Summary
            </p>
            <h1 className="font-editorial text-[26px] md:text-[34px] text-[#010D6E] leading-[1.35] mb-3">
              내가 고른 취향
            </h1>
            <p className="text-[14.5px] text-[#0042AF]/85 leading-[1.7] max-w-[680px]">
              본인이 완료한 분야의 선택과 응답 시간을 모았습니다. 서비스 연구·개선에는 사용하지 않습니다. 아래 점수는 운영자가 정한 문항 가중치의 요약이며, 검증된 성격 검사·진단이나 다른 사람과 비교한 백분위가 아닙니다.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <SurveyResetControl className="px-4 py-2 rounded-full border border-[#0042AF]/30 text-[12.5px] text-[#0042AF] hover:border-[#0042AF]"/>
          </div>
        </div>

        {/* Colored Objects Summary */}
        <section className="paper-sheet rounded-3xl p-7">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-editorial text-[20px] text-[#010D6E]">
              지금까지 알아본 취향 분야 ({completedList.length} / 12)
            </h2>
            <Link
              href="/"
              className="text-[13px] text-[#0042AF] underline underline-offset-4"
            >
              방으로 돌아가기 →
            </Link>
          </div>

          {completedList.length === 0 ? (
            <p className="text-[14px] text-[#0042AF]/80 py-6">
              아직 완료한 분야가 없습니다. 방으로 돌아가 물건을 클릭하고 질문을 시작해 보세요.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {completedList.map((item) => {
                const dom = ALL_MASTER_DOMAINS.find(
                  (d) => d.id === item.domainId
                );
                const robj = getRoomObjectByDomainId(item.domainId);
                if (!dom || !robj) return null;
                const pheno =
                  dom.phenotypes.find(
                    (p) => p.id === item.matchedPhenotypeId
                  ) ?? dom.phenotypes[0];

                return (
                  <div
                    key={item.domainId}
                    className="rounded-2xl p-4 bg-[#FFFDF7] border border-[#0042AF]/25"
                  >
                    <div className="flex items-center justify-between text-[12px] text-[#0042AF] mb-1.5">
                      <span className="font-num font-bold">
                        {robj.code} · {robj.shortObject}
                      </span>
                      <span>평균 {(item.avgResponseTimeMs / 1000).toFixed(1)}초</span>
                    </div>
                    <p className="font-editorial text-[15px] text-[#010D6E] mb-1">
                      {pheno.name}
                    </p>
                    <p className="text-[12px] text-[#010D6E]/70">
                      {dom.title}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Personal experimental summary; not a research dataset. */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <section className="paper-sheet rounded-3xl p-6">
            <div className="font-display italic text-[15px] text-[#0042AF] mb-1">
              Layer 01 · Experimental Scores
            </div>
            <h2 className="font-editorial text-[18px] text-[#010D6E] mb-4">
              문항 가중치 요약 · 실험 중
            </h2>
            <div className="space-y-2 text-[13.5px]">
              {[
                { label: '경험 개방성', val: state.layer1Vector.openness },
                { label: '계획성과 정돈', val: state.layer1Vector.conscientiousness },
                { label: '외향적 에너지', val: state.layer1Vector.extraversion },
                { label: '공감과 온기', val: state.layer1Vector.agreeableness },
                {
                  label: '변화 수용 vs 기본 보존',
                  val: state.layer1Vector.opennessVsConservation,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between py-1.5 border-b border-[#0042AF]/10 last:border-0"
                >
                  <span className="text-[#010D6E]/80">{row.label}</span>
                  <span className="font-num font-semibold text-[#0042AF]">
                    {completedList.length === 0 ? '응답 없음' : row.val >= 0 ? `+${row.val.toFixed(2)}` : row.val.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="paper-sheet rounded-3xl p-6">
            <div className="font-display italic text-[15px] text-[#0042AF] mb-1">
              Layer 02 · Rubato Tempo
            </div>
            <h2 className="font-editorial text-[18px] text-[#010D6E] mb-4">
              남들의 속도와 나의 속도
            </h2>
            <div className="space-y-2 text-[13.5px]">
              {[
                {
                  label: '주변 의견 동조 경향',
                  val: state.layer2Vector.socialConformity,
                },
                {
                  label: '전문가 평점 민감도',
                  val: state.layer2Vector.authoritySensitivity,
                },
                {
                  label: '익숙한 안전 vs 새로운 시도',
                  val: state.layer2Vector.riskAversion,
                },
                {
                  label: '긴 안목 vs 즉각적 즐거움',
                  val: state.layer2Vector.timeDiscounting,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between py-1.5 border-b border-[#0042AF]/10 last:border-0"
                >
                  <span className="text-[#010D6E]/80">{row.label}</span>
                  <span className="font-num font-semibold text-[#0042AF]">
                    {completedList.length === 0 ? '응답 없음' : row.val >= 0 ? `+${row.val.toFixed(2)}` : row.val.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="paper-sheet rounded-3xl p-6">
            <div className="font-display italic text-[15px] text-[#0042AF] mb-1">
              Layer 03 · Common Traits
            </div>
            <h2 className="font-editorial text-[18px] text-[#010D6E] mb-4">
              공통 취향 특징 5가지
            </h2>
            <div className="space-y-2 text-[13.5px]">
              {[
                { label: '단순함 vs 디테일', val: state.layer3Vector.complexity },
                { label: '익숙한 기본 vs 새로운 시도', val: state.layer3Vector.novelty },
                { label: '차분함 vs 강렬함', val: state.layer3Vector.intensity },
                { label: '직관적 인상 vs 스토리·배경', val: state.layer3Vector.conceptualism },
                { label: '모던함 vs 따뜻함', val: state.layer3Vector.warmth },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between py-1.5 border-b border-[#0042AF]/10 last:border-0"
                >
                  <span className="text-[#010D6E]/80">{row.label}</span>
                  <span className="font-num font-semibold text-[#0042AF]">
                    {completedList.length === 0 ? '응답 없음' : row.val >= 0 ? `+${row.val.toFixed(2)}` : row.val.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Raw JSON Ground-Truth Export */}
        <section className="paper-sheet rounded-3xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="font-display italic text-[15px] text-[#0042AF]">
              Ground-Truth JSON Snapshot
            </span>
            <span className="text-[12px] text-[#0042AF]/75">
              선택 시간(responseTimeMs) · 동조 변화(didShift) 포함
            </span>
          </div>
          <pre className="bg-[#FEF1D0]/75 border border-[#0042AF]/20 rounded-2xl p-4 text-[12px] text-[#010D6E] overflow-x-auto max-h-[300px]">
            {JSON.stringify(state, null, 2)}
          </pre>
        </section>
      </div>
    </div>
  );
}
