'use client';

import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { journalFromCloud, type JournalCloudClient, type JournalCloudRow, type JournalCloudWrite } from '@/lib/taste-journal-cloud';
import type { TasteJournal } from '@/lib/taste-journal';

const defaultClient: JournalCloudClient = {
  async load(owner) {
    if (!supabase) throw new Error('계정 저장 서비스가 설정되지 않았어요.');
    const { data, error } = await supabase.from('taste_journals').select('state, revision').eq('user_id', owner).maybeSingle();
    if (error) throw new Error('서버 기록을 불러오지 못했어요. 브라우저 기록은 그대로 남아 있어요.');
    return data;
  },
  async save(write) {
    if (!supabase) throw new Error('계정 저장 서비스가 설정되지 않았어요.');
    const { data, error } = await supabase.rpc('save_taste_journal', {
      p_owner_id: write.ownerId, p_expected_revision: write.expectedRevision, p_write_id: write.writeId, p_state: write.state,
    });
    if (error?.message.includes('JOURNAL_REVISION_CONFLICT')) return { status: 'conflict' };
    if (error || typeof data !== 'string' || !data) throw new Error('계정 저장 결과를 확인하지 못했어요. 같은 요청 재확인으로 중복 없이 확인할 수 있어요.');
    return { status: 'saved', revision: data };
  },
};
const button = 'min-h-11 rounded-xl border border-[#0042AF]/25 px-4 py-2 text-sm disabled:opacity-40';

/** Manual, opt-in synchronization. No browser journal is uploaded on mount/login. */
export function TasteJournalCloudSync({ owner, journal, onReplace, onExport, client = defaultClient }: {
  owner: string; journal: TasteJournal; onReplace: (value: TasteJournal) => boolean;
  onExport: () => void; client?: JournalCloudClient;
}) {
  const currentOwner = useRef(owner); currentOwner.current = owner;
  const alive = useRef(true);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [remote, setRemote] = useState<JournalCloudRow | null>(null);
  const [revision, setRevision] = useState<string | null>(null);
  const [pending, setPending] = useState<JournalCloudWrite | null>(null);
  const [conflict, setConflict] = useState(false);
  const [message, setMessage] = useState('');
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const journalRef = useRef(journal); journalRef.current = journal;
  const generation = useRef(0);
  useEffect(() => {
    alive.current = true; ++generation.current; busyRef.current = false;
    setLoaded(false); setRemote(null); setRevision(null); setPending(null); setConflict(false); setMessage(''); setSavedSnapshot(null); setBusy(false);
    return () => { alive.current = false; ++generation.current; };
  }, [owner]);
  const isCurrent = (id: number, uid: string) => alive.current && generation.current === id && currentOwner.current === uid;

  async function load() {
    if (busyRef.current) return;
    const id = generation.current, uid = owner;
    busyRef.current = true; setBusy(true); setMessage('');
    try {
      const row = await client.load(uid);
      journalFromCloud(row);
      if (!isCurrent(id, uid)) return;
      setRemote(row); setRevision(row?.revision ?? null); setLoaded(true);
      // Fetching a newer revision does not permit overwriting a conflict silently.
      setMessage(row ? '계정 기록을 확인했어요. 불러오기 전 브라우저 기록을 내보낼 수 있어요.' : '계정에 저장된 관찰실 기록은 아직 없어요.');
    } catch (error) {
      if (isCurrent(id, uid)) setMessage(error instanceof Error ? error.message : '서버 기록을 확인하지 못했어요.');
    } finally { if (isCurrent(id, uid)) { busyRef.current = false; setBusy(false); } }
  }
  async function save(retry = false) {
    if (busyRef.current || !loaded || conflict) return;
    if (!retry && !window.confirm('이 브라우저의 관찰실 선택·메모·저장 표시를 현재 계정의 서버 기록으로 저장할까요? 서버 기록은 이 내용으로 교체됩니다. 기존 설문 응답은 변경하지 않습니다.')) return;
    const request = retry ? pending : { ownerId: owner, expectedRevision: revision, writeId: crypto.randomUUID(), state: journalRef.current };
    if (!request) return;
    const id = generation.current, uid = owner;
    busyRef.current = true; setBusy(true); setPending(request); setMessage('');
    try {
      const result = await client.save(request);
      if (!isCurrent(id, uid)) return;
      if (result.status === 'conflict') {
        setConflict(true); setPending(null); setRemote(null);
        setMessage('다른 기기에서 기록이 바뀌어 저장을 멈췄어요. 브라우저 기록은 그대로 있어요. 먼저 내보낸 뒤 서버 기록을 확인해 주세요.');
      } else {
        setRevision(result.revision); setRemote({ state: request.state, revision: result.revision }); setPending(null);
        setSavedSnapshot(JSON.stringify(request.state));
        setMessage('계정에 저장했어요. 저장을 누른 뒤 수정한 내용은 다시 저장해야 해요.');
      }
    } catch (error) {
      if (isCurrent(id, uid)) setMessage(error instanceof Error ? error.message : '저장 결과를 확인하지 못했어요. 브라우저 기록을 보관해 주세요.');
    } finally { if (isCurrent(id, uid)) { busyRef.current = false; setBusy(false); } }
  }
  function restore() {
    if (!loaded || busyRef.current || pending || !remote) return;
    if (!window.confirm('현재 브라우저 기록을 확인한 서버 기록으로 바꿀까요? 브라우저에만 있는 내용은 교체되므로 먼저 내보내기를 권장해요. 기존 설문 응답은 변경하지 않습니다.')) return;
    try {
      const restored = journalFromCloud(remote);
      if (!onReplace(restored)) { setMessage('브라우저에 기록을 저장하지 못해 불러오기를 중단했어요.'); return; }
      setConflict(false); setSavedSnapshot(JSON.stringify(restored)); setMessage('확인한 서버 기록을 이 브라우저로 불러왔어요.');
    } catch (error) { setMessage(error instanceof Error ? error.message : '기록을 불러오지 못했어요.'); }
  }
  return <section className="mt-4 rounded-xl border border-[#0042AF]/20 bg-white/70 p-4" aria-label="관찰실 계정 저장">
    <h2 className="font-semibold">다른 기기에서 이어보기</h2>
    <p className="mt-2 text-sm leading-6">자동 동기화가 아닙니다. 서버 기록을 확인한 뒤 직접 저장하거나 불러와 주세요. 선택·메모는 저장 버튼을 누를 때만 계정에 전송하며, 기존 설문 점수에는 반영하지 않아요.</p>
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" className={button} disabled={busy || !!pending} onClick={load}>서버 기록 확인</button>
      <button type="button" className={button} disabled={!loaded || busy || conflict || !!pending} onClick={() => save()}>이 브라우저 기록 계정에 저장</button>
      <button type="button" className={button} disabled={!remote || busy || !!pending} onClick={restore}>확인한 서버 기록 불러오기</button>
      <button type="button" className={button} onClick={onExport}>브라우저 기록 내보내기</button>
      {pending && <button type="button" className={button} disabled={busy} onClick={() => save(true)}>같은 저장 요청 재확인</button>}
    </div>
    {busy && <p className="mt-2 text-sm" role="status">계정 기록을 확인하고 있어요.</p>}
    {message && <p className="mt-2 text-sm leading-6" role={conflict || pending ? 'alert' : 'status'}>{message}</p>}
    {savedSnapshot !== null && savedSnapshot !== JSON.stringify(journal) && <p className="mt-2 text-sm">계정에 아직 저장하지 않은 브라우저 변경이 있어요.</p>}
  </section>;
}
