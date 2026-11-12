'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePersonaStore } from '@/lib/persona-store';
import { tasteLessons, TasteLesson } from '@/lib/taste-lessons';
import { emptyJournal, journalKey, parseJournal, updateJournal, suggestNext, TasteJournal, JournalEntry, ObservationChoice } from '@/lib/taste-journal';
import { TasteStudyDiagram } from './TasteStudyDiagram';
import { RhythmListening } from './RhythmListening';
import { ArtworkStudy } from './ArtworkStudy';
import { StudyPaths } from './StudyPaths';
import { TasteJournalCloudSync } from './TasteJournalCloudSync';
const cloudSyncEnabled = process.env.NEXT_PUBLIC_TASTE_CLOUD_SYNC === 'true';

const choices: { value: ObservationChoice; label: string }[] = [{ value:'a',label:'A 쪽' },{value:'b',label:'B 쪽'},{value:'both',label:'둘 다'},{value:'unsure',label:'아직 모르겠어요'}];
const stages = ['먼저 보기', '단서 읽기', '다시 보기'];
const button = 'min-h-11 rounded-xl border border-[#0042AF]/25 px-4 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4';

export function TasteNotebook({initialLesson}:{initialLesson?:string} = {}) {
  const { authUser, isHydrated } = usePersonaStore();
  const owner = authUser?.userUuid || 'guest';
  const [loadedOwner,setLoadedOwner] = useState<string|null>(null);
  const [journal,setJournal] = useState<TasteJournal>(emptyJournal);
  const [storageError,setStorageError] = useState('');
  const [hasRestoreBackup,setHasRestoreBackup] = useState(false);
  const [selected,setSelected] = useState<string|null>(null);
  const [stage,setStage] = useState(0);
  const [variation,setVariation] = useState(60);
  const [category,setCategory] = useState('전체');
  const [view,setView] = useState<'explore'|'saved'|'record'>('explore');
  const [notice,setNotice] = useState('');
  const [draftEntryState,setDraftEntry] = useState<JournalEntry|null>(null);
  const [draftOwner,setDraftOwner] = useState<string|null>(null);
  const draftBase = useRef<JournalEntry|null>(null);
  const lessonHeading = useRef<HTMLHeadingElement>(null);
  const notebookHeading = useRef<HTMLHeadingElement>(null);
  const hadLesson = useRef(false);
  useEffect(() => { if(selected){lessonHeading.current?.focus();hadLesson.current=true;}else if(hadLesson.current){notebookHeading.current?.focus();hadLesson.current=false;} }, [selected,stage]);
  useEffect(()=>{
    if (!isHydrated) return;
    try { setJournal(parseJournal(localStorage.getItem(journalKey(owner))));setStorageError(''); }
    catch { setJournal(emptyJournal());setStorageError('브라우저 저장소를 사용할 수 없어요. 이번 탐색은 가능하지만 창을 닫으면 기록이 사라질 수 있어요.'); }
    try { setHasRestoreBackup(!!localStorage.getItem(`${journalKey(owner)}:before-cloud-restore`)); } catch { setHasRestoreBackup(false); }
    setLoadedOwner(owner);setDraftEntry(null);setSelected(null);setStage(0);setNotice('');
    const sync = (event: StorageEvent) => { if(event.key===journalKey(owner)) setJournal(parseJournal(event.newValue)); };
    window.addEventListener('storage',sync);return ()=>window.removeEventListener('storage',sync);
  },[owner,isHydrated]);
  const ready = isHydrated && loadedOwner===owner;
  const openedLink = useRef<string|null>(null);
  useEffect(()=>{
    if(draftEntryState && draftOwner===owner)return;
    if(!ready || !initialLesson || !tasteLessons.some(item=>item.id===initialLesson))return;
    const key=`${owner}:${initialLesson}`;
    if(openedLink.current===key)return;
    openedLink.current=key;
    const saved=journal.entries[initialLesson];
    setSelected(initialLesson);setStage(saved?.after?2:saved?.before?1:0);
    setVariation(saved?.afterSetting??saved?.beforeSetting??60);
  },[ready,owner,initialLesson,journal,draftEntryState,draftOwner]);
  const draftEntry = ready&&draftOwner===owner?draftEntryState:null;
  useEffect(()=>{if(selected)lessonHeading.current?.focus();},[!!draftEntry]);
  const currentJournal = ready?journal:emptyJournal();
  const lesson = tasteLessons.find(n=>n.id===selected);
  const persistedEntry = lesson?currentJournal.entries[lesson.id]:undefined;
  const entry = draftEntry?.lessonId===lesson?.id && draftEntry ? draftEntry : persistedEntry;
  const reviewOnly = !!persistedEntry?.completedAt && draftEntry?.lessonId!==lesson?.id;
  const variationLabel = lesson?.diagram==='perspective'?'B 그림의 소실점 위치':lesson?.diagram==='rhythm'?'B 배열의 간격 변화':lesson?.diagram==='space'?'B 구획의 불투명도':lesson?.diagram==='context'?'B 구성의 어긋남':lesson?.diagram==='contrast'?'두 배경의 명도':lesson?.diagram==='complexity'?'B 도형의 크기':'B 도형의 명암 대비';
  const completed = tasteLessons.filter(n=>currentJournal.entries[n.id]?.completedAt);
  const nextId = suggestNext(tasteLessons.map(n=>n.id),currentJournal);
  const categories = ['전체',...new Set(tasteLessons.map(n=>n.category))];
  const visible = useMemo(()=>tasteLessons.filter(n=>(category==='전체'||n.category===category)&&(view==='explore'||(view==='saved'?currentJournal.entries[n.id]?.bookmarked:currentJournal.entries[n.id]))),[category,view,currentJournal]);
  function save(id:string,patch:Parameters<typeof updateJournal>[3],commitDraft=false) {
    if(!ready) return false;
    if(draftEntry?.lessonId===id&&!commitDraft){setDraftEntry({...draftEntry,...patch,updatedAt:new Date().toISOString()});return true;}
    const version = tasteLessons.find(n=>n.id===id)!.version;
    let base=journal;
    if(commitDraft&&draftEntry){
      try{
        base=parseJournal(localStorage.getItem(journalKey(owner)));
        if(JSON.stringify(base.entries[id])!==JSON.stringify(draftBase.current)){setJournal(base);setNotice('다른 탭에서 기록이 바뀌었어요. 현재 수정은 저장하지 않았습니다. 메모를 따로 보관한 뒤 수정을 취소하고 최신 기록을 확인해 주세요.');return false;}
      }catch{setNotice('기존 기록을 확인할 수 없어 수정을 저장하지 않았어요. 메모를 따로 보관해 주세요.');return false;}
    }
    try { if(!storageError) base=parseJournal(localStorage.getItem(journalKey(owner))); } catch { /* in-memory fallback */ }
    const updated=updateJournal(base,id,version,patch);
    if(!commitDraft)setJournal(updated);
    try {localStorage.setItem(journalKey(owner),JSON.stringify(updated));setJournal(updated);setStorageError('');return true;}
    catch {setStorageError(commitDraft?'수정을 저장하지 못했어요. 수정 중인 메모를 복사해 보관해 주세요. 기존 기록은 유지됩니다.':'기록을 브라우저에 저장하지 못했어요. 창을 닫기 전에 내보내기로 보관해 주세요.');return false;}
  }
  function open(n:TasteLesson) {
    if(draftEntry&&!window.confirm('저장하지 않은 수정을 버리고 다른 탐색을 열까요? 기존 기록은 유지돼요.'))return;
    const saved = currentJournal.entries[n.id];
    setSelected(n.id);setDraftEntry(null);
    setStage(saved?.after ? 2 : saved?.before ? 1 : 0);
    setVariation(saved?.afterSetting ?? saved?.beforeSetting ?? 60);
    setNotice('');
  }
  function deleteEntry(id:string) {
    if (!ready || !window.confirm('이 브라우저의 이 탐색 기록과 메모, 저장 표시를 지울까요? 이 작업은 되돌릴 수 없어요. 기존 설문 응답은 유지됩니다.')) return;
    let base=journal;
    try { if(!storageError) base=parseJournal(localStorage.getItem(journalKey(owner))); } catch { /* retain memory fallback */ }
    const entries={...base.entries};delete entries[id];
    const updated:TasteJournal={version:1,entries};
    try {
      localStorage.setItem(journalKey(owner),JSON.stringify(updated));
      setJournal(updated);setDraftEntry(null);draftBase.current=null;setStorageError('');setStage(0);setVariation(60);setNotice('이 탐색 기록을 지웠어요.');
    } catch {setStorageError('기록을 지우지 못했어요. 브라우저 저장소 설정을 확인해 주세요.');}
  }
  function replaceFromCloud(value: TasteJournal): boolean {
    if (!ready) return false;
    if(draftEntry&&!window.confirm('저장하지 않은 수정을 버리고 서버 기록을 불러올까요? 저장된 브라우저 기록만 복구용 사본에 보관됩니다.'))return false;
    try {
      // Retain the browser copy before explicit replacement. Never upload this backup.
      // One user-visible backup per account, containing committed journal edits, not unsaved drafts.
      localStorage.setItem(`${journalKey(owner)}:before-cloud-restore`, JSON.stringify(currentJournal));
      setHasRestoreBackup(true);
      localStorage.setItem(journalKey(owner), JSON.stringify(value));
      setJournal(value); setDraftEntry(null);draftBase.current=null; setSelected(null); setStage(0); setStorageError('');
      return true;
    } catch { setStorageError('브라우저 기록을 보관할 수 없어 서버 기록 불러오기를 중단했어요.'); return false; }
  }
  function exportRestoreBackup() {
    try {
      const raw = localStorage.getItem(`${journalKey(owner)}:before-cloud-restore`);
      if (!raw) return;
      const url = URL.createObjectURL(new Blob([raw], {type:'application/json'}));
      const a=document.createElement('a'); a.href=url; a.download='room-rubato-before-cloud-restore.json'; a.click(); URL.revokeObjectURL(url);
    } catch { setStorageError('이전 브라우저 기록을 내보내지 못했어요.'); }
  }
  function clearRestoreBackup() {
    if (!window.confirm('서버 기록을 불러오기 전에 보관한 이전 브라우저 사본만 삭제할까요? 현재 관찰실 기록은 유지돼요.')) return;
    try { localStorage.removeItem(`${journalKey(owner)}:before-cloud-restore`); setHasRestoreBackup(false); }
    catch { setStorageError('이전 브라우저 사본을 지우지 못했어요.'); }
  }
  function exportNotes() {
    const text=tasteLessons.filter(n=>currentJournal.entries[n.id]).map(n=>{
      const e=currentJournal.entries[n.id];const label=(c?:ObservationChoice)=>choices.find(x=>x.value===c)?.label||'기록 없음';
      return `${n.title}\n첫 선택: ${label(e.before)} / 다시 선택: ${label(e.after)}\n도식 설정(점수 아님): ${e.beforeSetting ?? '없음'} → ${e.afterSetting ?? '없음'}\n메모: ${e.memo||'없음'}\n출처: ${n.sources.map(s=>s.url).join('\n')}\n`;
    }).join('\n---\n');
    const url=URL.createObjectURL(new Blob([`Room Rubato · 내 감상 기록\n개인 감상 기록이며 성격 검사 결과가 아닙니다.\n\n${text}`],{type:'text/plain;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='room-rubato-notes.txt';a.click();URL.revokeObjectURL(url);
  }
  const pick=(phase:'before'|'after')=><div className="mt-5 grid grid-cols-2 gap-2" aria-label={phase==='before'?'첫 감상 선택':'다시 감상한 선택'}>{choices.map(c=><button type="button" key={c.value} disabled={!ready||reviewOnly} aria-pressed={entry?.[phase]===c.value} className={`${button} ${entry?.[phase]===c.value?'bg-[#0042AF] text-white':'bg-white'}`} onClick={()=>save(lesson!.id,phase==='before'?{before:c.value,beforeSetting:lesson!.diagram==='syncopation'?undefined:variation,after:undefined,afterSetting:undefined,completedAt:undefined}:{after:c.value,afterSetting:lesson!.diagram==='syncopation'?undefined:variation})}>{c.label}</button>)}</div>;
  return <section className="mx-auto max-w-6xl px-5 pb-20 pt-32 text-[#010D6E]" aria-labelledby="notebook-heading">
    <header className="grid gap-6 border-b border-[#0042AF]/20 pb-8 md:grid-cols-[1.5fr_1fr]">
      <div><p className="text-sm tracking-wide text-[#0042AF]">ROOM RUBATO / 관찰실</p><h1 id="notebook-heading" ref={notebookHeading} tabIndex={-1} className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">좋아하는 이유를 찾아보는 시간</h1><p className="mt-4 max-w-xl leading-7">직접 바꿔 보고, 용어를 배우고, 다시 골라보세요. 같은 것을 두 번 보면서 생긴 차이를 나만의 말로 남기는 여덟 가지 탐색입니다.</p></div>
      <div className="rounded-2xl bg-[#010D6E] p-5 text-white"><p className="text-sm opacity-80">내가 살펴본 단서</p><p className="mt-1 text-3xl">{completed.length}<span className="text-base opacity-70"> / {tasteLessons.length}</span></p><p className="mt-2 text-sm leading-6">한 편에 3–4분. 순서대로 하지 않아도, 하루를 건너뛰어도 기록은 남아요.</p>{ready&&<button type="button" className="mt-4 min-h-11 rounded-xl bg-[#FEF1D0] px-4 text-sm text-[#010D6E]" onClick={()=>open(tasteLessons.find(n=>n.id===(nextId||tasteLessons[0].id))!)}>{completed.length===0?'첫 탐색 시작':nextId?'아직 안 본 단서 살펴보기':'다시 보고 싶은 단서 찾기'} →</button>}</div>
    </header>
    <p className="mt-4 text-xs leading-5 text-[#010D6E]/70">선택과 메모는 {authUser?'현재 계정별로 구분해':'게스트 기록으로'} <strong>이 브라우저에만</strong> 먼저 저장돼요. {cloudSyncEnabled&&authUser?'계정 저장은 아래에서 직접 선택할 수 있어요.':'다른 기기와 동기화되지 않아요.'} 사이트 데이터를 지우면 브라우저 기록이 사라져요. 기존 취향·성격 점수에 반영하지 않습니다.</p>
    {cloudSyncEnabled&&authUser&&ready&&<TasteJournalCloudSync key={owner} owner={owner} journal={currentJournal} onReplace={replaceFromCloud} onExport={exportNotes}/>}
    {ready&&hasRestoreBackup&&<div className="mt-3 rounded-xl bg-white/70 p-3 text-sm"><p>서버 기록을 불러오기 전 브라우저 사본을 이 기기에 보관 중이에요. 다음 불러오기 때 교체돼요.</p><div className="mt-2 flex flex-wrap gap-2"><button className={button} onClick={exportRestoreBackup}>이전 브라우저 사본 내보내기</button><button className={button} onClick={clearRestoreBackup}>이전 브라우저 사본 지우기</button></div></div>}
    {storageError&&<p role="alert" className="mt-3 rounded-xl bg-amber-100 p-3 text-sm">{storageError}</p>}
    {!ready&&<p role="status" className="mt-4">기록을 불러오는 중이에요.</p>}
    <div className="my-6 flex flex-wrap items-center gap-2" aria-label="노트 보기 방식">{([{id:'explore',label:'전체 탐색'},{id:'saved',label:'다시 볼 단서'},{id:'record',label:'내 기록'}] as const).map(v=><button key={v.id} className={`${button} ${view===v.id?'bg-[#0042AF] text-white':'bg-white/60'}`} aria-pressed={view===v.id} onClick={()=>{if(draftEntry&&!window.confirm('저장하지 않은 수정을 버리고 이동할까요? 기존 기록은 유지돼요.'))return;setDraftEntry(null);setView(v.id);setSelected(null);setCategory('전체');}}>{v.label}</button>)}<button className={`${button} ml-auto`} disabled={!ready||!Object.keys(currentJournal.entries).length} onClick={exportNotes}>기록 내보내기</button></div>
    {lesson ? <article className="rounded-3xl border border-[#0042AF]/20 bg-white/85 p-5 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3"><button className={button} onClick={()=>{if(draftEntry&&!window.confirm('저장하지 않은 수정을 버리고 목록으로 갈까요? 기존 기록은 유지돼요.'))return;setDraftEntry(null);setSelected(null);}}>← 목록으로</button><button className={button} aria-pressed={!!entry?.bookmarked} onClick={()=>save(lesson.id,{bookmarked:!entry?.bookmarked})}>{entry?.bookmarked?'✓ 다시 볼 단서에 저장됨':'＋ 다시 볼 단서에 저장'}{draftEntry?' (수정 저장 전)':''}</button>{entry&&<button className={button} onClick={()=>deleteEntry(lesson.id)}>이 탐색 기록 지우기</button>}</div>
      <p className="mt-6 text-xs text-[#0042AF]">{lesson.category} · 약 {lesson.minutes}분</p><h2 ref={lessonHeading} tabIndex={-1} className="mt-2 text-2xl font-semibold sm:text-3xl focus:outline-none">{lesson.title}</h2><p className="mt-3 leading-7">{lesson.subtitle}</p>
      {reviewOnly&&<aside className="mt-4 rounded-xl bg-[#edf2ee] p-4 text-sm leading-6"><p>완료한 기록을 다시 보고 있어요. 선택과 메모는 그대로 유지됩니다. 도식은 자유롭게 움직여 비교할 수 있어요.</p><dl className="mt-3 space-y-2"><dt className="font-semibold">첫 질문: {lesson.prompt}</dt><dd>{choices.find(c=>c.value===persistedEntry?.before)?.label||'미선택'}{persistedEntry?.beforeSetting!==undefined?` · 도식 설정 ${persistedEntry.beforeSetting}`:''}</dd><dt className="font-semibold">다시 본 질문: {lesson.reflection}</dt><dd>{choices.find(c=>c.value===persistedEntry?.after)?.label||'미선택'}{persistedEntry?.afterSetting!==undefined?` · 도식 설정 ${persistedEntry.afterSetting}`:''}</dd></dl><p className="mt-2 text-xs">질문이나 설정도 달라졌다면 선택의 차이가 학습만으로 생겼다고 볼 수는 없어요.</p><button className={`${button} mt-3`} onClick={()=>{draftBase.current={...persistedEntry!};setDraftOwner(owner);setDraftEntry({...persistedEntry!});}}>현재 기록 편집하기</button></aside>}{draftEntry&&<aside className="mt-4 rounded-xl bg-amber-50 p-4 text-sm leading-6"><p>수정 중이에요. 아래에서 저장하기 전까지 기존 기록은 유지돼요. 저장하면 기존 기록을 교체합니다.</p><button className={`${button} mt-3`} onClick={()=>{setDraftEntry(null);setStage(2);setVariation(persistedEntry?.afterSetting??persistedEntry?.beforeSetting??60);setNotice('수정을 취소했어요. 기존 기록을 유지합니다.');}}>수정 취소 · 기존 기록 보기</button></aside>}
      {stage>0&&<button className={`${button} mt-4`} onClick={()=>{setStage(0);setNotice('');}}>첫 관찰 다시 보기</button>}
      <ol className="my-6 grid grid-cols-3 gap-2" aria-label="탐색 단계">{stages.map((s,i)=><li key={s} className={`border-b-2 pb-3 text-sm ${stage===i?'border-[#0042AF] font-semibold':'border-[#0042AF]/15 text-[#010D6E]/60'}`} aria-current={stage===i?'step':undefined}>{i+1}. {lesson.diagram==='syncopation'&&i!==1?(i===0?'먼저 듣기':'다시 듣기'):s}</li>)}</ol>
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div><TasteStudyDiagram kind={lesson.diagram} variation={variation} labels={[lesson.a,lesson.b]}/>{lesson.diagram==='syncopation'?<RhythmListening key={lesson.id}/>:<label className="mt-5 block text-sm">{lesson.diagram==='perspective'?'B 그림의 소실점 위치':lesson.diagram==='rhythm'?'B 배열의 간격 변화':lesson.diagram==='space'?'B 구획의 불투명도':lesson.diagram==='context'?'B 구성의 어긋남':lesson.diagram==='contrast'?'두 배경의 명도':lesson.diagram==='complexity'?'B 도형의 크기':'B 도형의 명암 대비'}<input aria-label={variationLabel} aria-valuetext={`${variation} / 100 · 설명용 도식 설정, 점수 아님`} type="range" min="0" max="100" value={variation} onChange={e=>setVariation(Number(e.target.value))} className="mt-3 min-h-11 w-full accent-[#0042AF]"/></label>}{lesson.diagram==='syncopation'?<p className="mt-3 text-xs leading-5 text-[#010D6E]/65">도식의 세로선은 일정한 박, 점은 비교할 소리의 위치입니다. 소리를 듣기 어려우면 점과 박의 위치를 비교해도 좋아요.</p>:<><p className="text-xs leading-5 text-[#010D6E]/65">직접 만든 설명용 도식입니다. 선택한 순간의 도식 설정을 기록에 함께 남겨요. 같은 조건으로 비교하려면 처음 설정으로 되돌려 보세요.</p><button className={`${button} mt-3`} onClick={()=>setVariation(60)}>도식 기본 설정으로</button>{entry?.beforeSetting!==undefined&&<button className={`${button} mt-3 ml-2`} onClick={()=>setVariation(entry.beforeSetting!)}>첫 선택 당시 설정으로 ({entry.beforeSetting})</button>}</>}</div>
        <div>{stage===0&&<><h3 className="text-xl font-semibold">{lesson.prompt}</h3><p className="mt-3 text-sm leading-6">{lesson.diagram==='syncopation'?'A와 B를 차례로 들어보세요. 소리를 듣기 어렵다면 도식으로 비교할 수 있어요.':'먼저 도식을 움직여 보세요.'} 이유가 분명하지 않아도 괜찮아요. 판단하기 어렵다는 것도 기록할 수 있어요.</p>{pick('before')}<button disabled={!entry?.before} className={`${button} mt-6 w-full bg-[#010D6E] text-white disabled:opacity-40`} onClick={()=>setStage(1)}>선택했어요 · 관찰할 단서 읽기 →</button></>}
        {stage===1&&<><p className="text-sm font-semibold text-[#0042AF]">{lesson.term}</p>{lesson.explanation.map(p=><p key={p} className="mt-4 leading-7">{p}</p>)}<div className="mt-5 rounded-xl bg-[#F2EFE7] p-4"><h3 className="font-semibold">이것부터 찾아보세요</h3><ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6">{lesson.lookFor.map(p=><li key={p}>{p}</li>)}</ul></div><p className="mt-4 text-xs leading-6 text-[#010D6E]/70">{lesson.distinction}</p><button className={`${button} mt-5 w-full bg-[#010D6E] text-white`} onClick={()=>setStage(2)}>이제 다시 보고 기록하기 →</button></>}
        {stage===2&&<><h3 className="text-xl font-semibold">{lesson.reflection}</h3>{pick('after')}{entry?.before&&entry?.after&&<p className="mt-4 rounded-xl bg-[#edf2ee] p-4 text-sm leading-6">{entry.before===entry.after?'두 번 같은 답을 골랐어요. 그 사이에 선택을 설명할 말이 늘었는지도 살펴보세요.':'두 번의 답이 달라졌어요. 설명, 질문, 도식 설정 중 무엇이 달라졌는지 기록해 보세요. 성향이 바뀌었다는 뜻은 아닙니다.'}</p>}<label className="mt-5 block text-sm font-semibold" htmlFor="observation-memo">어디에 눈이 갔나요? <span className="font-normal">(선택)</span></label><textarea id="observation-memo" readOnly={reviewOnly} aria-readonly={reviewOnly} maxLength={1500} value={entry?.memo||''} onChange={e=>save(lesson.id,{memo:e.target.value})} placeholder="예: 막대보다 사이의 빈틈이 먼저 보였다. 방에 놓는다면 일정한 간격이 좋다." className="mt-2 min-h-28 w-full rounded-xl border border-[#0042AF]/25 bg-white p-3 text-sm leading-6"/><button disabled={!entry?.after||reviewOnly} className={`${button} mt-4 w-full bg-[#010D6E] text-white disabled:opacity-40`} onClick={()=>{if(!save(lesson.id,{...(draftEntry||{}),completedAt:persistedEntry?.completedAt||new Date().toISOString()},true))return;setDraftEntry(null);setNotice('탐색 기록을 남겼어요. 아래에서 이어볼 단서를 골라보세요.');}}>{draftEntry?'수정한 기록 저장하기':'이번 탐색 마치기'}</button><p className="mt-3 text-sm" role="status">{notice}</p></>}
        </div>
      </div>
      <ArtworkStudy key={lesson.id} lessonId={lesson.id}/>
      {lesson.diagram==='syncopation'&&<aside className="mt-6 rounded-2xl border border-[#0042AF]/20 bg-white p-5 text-sm leading-7"><h3 className="font-semibold">다른 음악의 반복도 들어볼까요? · 선택 활동</h3><p className="mt-2">위 합성 클릭은 장단을 재현한 소리가 아닙니다. 아래 기관 자료를 따로 듣고, 되풀이되는 흐름에서 무엇이 같고 다른지 내 말로 적어보세요. 음악 사이의 구조나 선호가 같다고 가정하지 않습니다.</p><ul className="mt-3 space-y-3"><li><a className="underline" target="_blank" rel="noopener noreferrer" href="https://academy.gugak.go.kr/open/open/lecture/detail.do?currentMenuId=900006007&openLectureSeq=1536&srchListType=SERIES&srchOpenCategorySeq=">국립국악원 · 장단맞춰, 쿵딱! ↗</a><p className="text-xs">굿거리장단과 자진모리장단을 소개하는 교육 영상입니다. 원본 영상과 활동지는 기관 사이트에서 확인해 주세요.</p></li><li><a className="underline" target="_blank" rel="noopener noreferrer" href="https://www.carnegiehall.org/Education/Programs/Music-Educators-Toolbox/1-Performing-and-Composing-Four-Beat-Patterns">Carnegie Hall · 네 박 패턴 연주와 만들기 ↗</a><p className="text-xs">네 박 패턴을 연주하고 만드는 초등 음악교육 사례입니다. 모든 음악의 리듬이나 성인 취향을 설명하는 검사는 아닙니다.</p></li></ul><p className="mt-3 text-xs opacity-70">외부 영상·악보·활동지는 복제하지 않습니다. 이 비교 제안은 Room Rubato가 작성했으며 기관 공동 개발을 뜻하지 않습니다.</p></aside>}
      <section className="mt-8 rounded-2xl bg-[#FEF1D0]/70 p-5"><h3 className="font-semibold">화면 밖에서 해보기</h3><p className="mt-2 leading-7">{lesson.activity}</p></section>
      <section className="mt-6 border-t border-[#0042AF]/15 pt-5"><h3 className="text-sm font-semibold">설명의 근거와 더 읽을 자료</h3><ul className="mt-2 space-y-2">{lesson.sources.map(s=><li key={s.url}><a className="inline-block py-2 text-sm text-[#0042AF] underline underline-offset-4" href={s.url} target="_blank" rel="noopener noreferrer">{s.title} ↗ <span className="sr-only">새 탭</span></a><span className="ml-2 text-xs text-[#010D6E]/60">{s.kind}</span></li>)}</ul><p className="mt-3 text-xs leading-5 text-[#010D6E]/65">출처를 바탕으로 Room Rubato가 만든 활동입니다. 원문 저자가 이 활동이나 결과를 검증한 것은 아닙니다. 자료 검토: 2026.11.11 · 콘텐츠 v{lesson.version}</p></section>
      <section className="mt-6"><h3 className="text-sm font-semibold">같은 단서를 다른 곳에서</h3><div className="mt-3 flex flex-wrap gap-2">{lesson.related.map(id=>{const n=tasteLessons.find(n=>n.id===id)!;return <button key={id} className={button} onClick={()=>open(n)}>{n.title} →</button>;})}</div></section>
    </article> : <>
      {view==='explore'&&category==='전체'&&<StudyPaths journal={currentJournal} onOpen={open} ready={ready}/>}
      <div className="mb-5 flex flex-wrap gap-2" aria-label="분야 필터">{categories.map(c=><button key={c} className={`min-h-11 rounded-full px-4 text-sm ${category===c?'bg-[#010D6E]/10 font-semibold':'hover:bg-white/60'}`} aria-pressed={category===c} onClick={()=>setCategory(c)}>{c}</button>)}</div>
      {visible.length===0&&<p className="rounded-2xl bg-white/70 p-8 leading-7">{view==='saved'?'다시 보고 싶은 단서를 저장하면 여기 모여요.':'아직 기록이 없어요. 전체 탐색에서 관심 있는 단서 하나를 골라보세요.'}</p>}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{visible.map(n=>{const e=currentJournal.entries[n.id];return <article key={n.id} className="flex flex-col overflow-hidden rounded-2xl border border-[#0042AF]/15 bg-white/80"><TasteStudyDiagram kind={n.diagram} labels={[n.a,n.b]}/><div className="flex flex-1 flex-col p-5"><p className="text-xs text-[#0042AF]">{n.category} · 약 {n.minutes}분 {e?.completedAt?'· 살펴봄':''}</p><h2 className="mt-3 text-xl font-semibold">{n.title}</h2><p className="mt-2 text-sm leading-6">{n.subtitle}</p>{view==='record'&&e&&<div className="mt-4 border-l-2 border-[#0042AF]/30 pl-3 text-sm leading-6"><p>처음 {choices.find(c=>c.value===e.before)?.label||'미선택'} → 다시 {choices.find(c=>c.value===e.after)?.label||'미선택'}</p>{e.beforeSetting!==undefined&&e.afterSetting!==undefined&&e.beforeSetting!==e.afterSetting&&<p className="mt-1 text-xs">두 선택 때 도식 설정도 달랐어요 ({e.beforeSetting} → {e.afterSetting}).</p>}{e.memo&&<p className="mt-2 whitespace-pre-wrap break-words">{e.memo}</p>}</div>}<button disabled={!ready} className={`${button} mt-5 w-full bg-[#0042AF] text-white`} onClick={()=>open(n)}>{e?.completedAt?'다시 살펴보기':e?.before?'이어서 살펴보기':'직접 살펴보기'} →</button></div></article>;})}</div>
    </>}
  </section>;
}
