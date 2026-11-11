'use client';
import React from 'react';
import { usePersonaStore } from '@/lib/persona-store';

function download(value: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = `room-rubato-unsaved-${new Date().toISOString().slice(0,10)}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function PersonaSyncStatus() {
  const { state, syncError, syncConflict, retrySync, reloadServerProfile, recoveryDraft, clearRecoveryDraft } = usePersonaStore();
  if (!syncError && !recoveryDraft) return null;
  return <aside className="relative z-20 mx-auto w-full max-w-[1380px] border-y border-amber-700/30 bg-amber-50 px-6 py-4 text-sm" aria-label="설문 저장 상태">
    {syncError && <p role="alert">{syncError}</p>}
    {recoveryDraft && <p>이 브라우저에 서버 저장이 확인되지 않은 이전 설문 기록이 남아 있어요. 자동으로 서버 기록에 합치지 않았어요.</p>}
    <div className="mt-2 flex flex-wrap gap-2">
      {syncError && !syncConflict && <button className="min-h-11 rounded border px-3" onClick={retrySync}>다시 시도</button>}
      {syncError && <button className="min-h-11 rounded border px-3" onClick={() => download(state)}>현재 기록 내려받기</button>}
      {syncConflict && <button className="min-h-11 rounded border px-3" onClick={() => {
        if (window.confirm('화면을 서버의 최신 기록으로 바꿀까요? 이 기기의 저장되지 않은 기록은 먼저 내려받아 보관해 주세요. 복구용 사본은 브라우저에 남습니다.')) void reloadServerProfile();
      }}>서버 기록 불러오기</button>}
      {recoveryDraft && <><button className="min-h-11 rounded border px-3" onClick={() => download(recoveryDraft)}>이전 미저장 기록 내려받기</button><button className="min-h-11 rounded border px-3" onClick={() => {
        if (window.confirm('브라우저에 남은 복구용 사본을 지울까요? 서버의 기록은 바뀌지 않습니다. 필요하면 먼저 내려받아 주세요.')) clearRecoveryDraft();
      }}>복구용 사본 지우기</button></>}
    </div>
    <p className="mt-2 text-xs text-amber-950/70">내려받은 파일에는 개인 응답이 포함됩니다. 공유하지 말고 안전한 곳에 보관해 주세요.</p>
  </aside>;
}
