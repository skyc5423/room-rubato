import React from 'react';
import {CurationSources} from '../src/components/CurationSources';
import { act, create } from 'react-test-renderer';
import { beforeEach, expect, it, vi } from 'vitest';
import { SurveyResetControl } from '../src/components/SurveyResetControl';
import { RoomCanvas } from '../src/components/RoomCanvas';
import { DomainExplorer } from '../src/components/DomainExplorer';
import { DAILY_PULSE_QUESTIONS, ALL_MASTER_DOMAINS } from '../src/lib/domains-index';

const store = vi.hoisted(() => ({ state: { dailyShiftLog: [] as any[], completedDomains: {}, layer3Vector: {}, layer1Vector: {}, layer2Vector: {}, choiceTelemetryLog: [], curationFeedbackLog: [] }, isHydrated: true, currentUserId: 'a', recordQuestionChoice: vi.fn(), recordDailyPulseShift: vi.fn(), deletePersonaData: vi.fn() }));
vi.mock('../src/lib/persona-store', () => ({ usePersonaStore: () => store }));
vi.mock('../src/components/SpecimenPlate', () => ({ SpecimenPlate: () => null, QUESTION_OPTION_IMAGES: {} }));
vi.mock('next/link', () => ({ default: ({ children }: any) => <span>{children}</span> }));
vi.mock('../src/components/RoomDialog', () => ({ RoomDialog: ({children}: any) => <div>{children}</div> }));
vi.mock('../src/components/RoomCanvas', () => ({ RoomCanvas: () => null }));
import Page from '../src/app/page';

beforeEach(() => {
  vi.stubGlobal('window', { addEventListener: vi.fn(), removeEventListener: vi.fn() }); store.state.dailyShiftLog = []; store.isHydrated = true; });
it('restores completed pulse from persisted state without recording again', () => {
  store.state.dailyShiftLog = [{ timestamp: new Date().toISOString(), pulseId: DAILY_PULSE_QUESTIONS[0].id, phase1Choice: 'A', phase2ChoiceAfterSocialProof: 'B', phase1ResponseTimeMs: 2100 }];
  let view: any;
  act(() => { view = create(<Page />); });
  expect(JSON.stringify(view.toJSON())).toContain('처음에는 선택 A를 고르셨다가');

  expect(store.recordDailyPulseShift).not.toHaveBeenCalled();
  act(() => view.unmount());
});
it('does not offer answer controls until hydration completes', () => {
  store.isHydrated = false;
  let view: any;
  act(() => { view = create(<Page />); });
  expect(JSON.stringify(view.toJSON())).toContain('저장된 응답을 불러오는 중입니다.');
  act(() => view.unmount());
});

it('offers a new response for a previous-day completion', () => {
  store.state.dailyShiftLog = [{ timestamp: '2020-01-01T12:00:00Z', pulseId: DAILY_PULSE_QUESTIONS[0].id, phase1Choice: 'A', phase2ChoiceAfterSocialProof: 'B', phase1ResponseTimeMs: 2100 }];
  let view: any;
  act(() => { view = create(<Page />); });
  expect(JSON.stringify(view.toJSON())).toContain('오늘의 질문 · 옷과 첫인상');
  act(() => view.unmount());
});
it('unlocks a completed pulse when an open page crosses Korean midnight', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-10T14:59:59Z'));
  store.state.dailyShiftLog = [{ timestamp: '2026-11-10T14:00:00Z', pulseId: DAILY_PULSE_QUESTIONS[0].id, phase1Choice: 'A', phase2ChoiceAfterSocialProof: 'B', phase1ResponseTimeMs: 2100 }];
  let view: any;
  try {
    act(() => { view = create(<Page />); });
    expect(JSON.stringify(view.toJSON())).toContain('처음에는 선택 A를 고르셨다가');
    act(() => { vi.advanceTimersByTime(1000); });
    expect(JSON.stringify(view.toJSON())).toContain('오늘의 질문 · 옷과 첫인상');
  } finally {
    act(() => view?.unmount());
    vi.useRealTimers();
  }
});


it('cancels an in-flight question transition when the room dialog closes', () => {
  vi.useFakeTimers();
  let view: any;
  try {
    act(() => {view=create(<Page/>);});
    const open=view.root.findAllByType('button').find((b:any) => b.props['aria-label'] === '패션 (코트와 거울)');
    expect(open).toBeDefined();
    act(() => open.props.onClick());
    const option=view.root.findAllByType('button').find((b:any) => b.props.className?.includes('paper-postcard'));
    act(() => option.props.onClick());
    const close=view.root.findAllByType('button').find((b:any) => b.children.includes('방으로 돌아가기 ✕'));
    act(() => close.props.onClick());
    act(() => {vi.advanceTimersByTime(500);});
    expect(store.recordQuestionChoice).not.toHaveBeenCalled();
  } finally {act(()=>view?.unmount());vi.useRealTimers();}
});

it('does not claim personal traits or peer results before any questionnaire is complete', () => {
  let view: any;
  act(() => { view = create(<Page />); });
  const text = JSON.stringify(view.toJSON());
  expect(text).toContain('아직 완료한 분야가 없어요');
  expect(text).toContain('아직 응답이 없어 개인화하지 않았습니다');
  expect(text).not.toContain('공통점 3가지');
  expect(text).not.toContain('나와 비슷한 사람들의 선택');
  expect(text).not.toContain('클래식한 기본템을 선호함');
  act(() => view.unmount());
});

it('opens the saved result from a completed domain list instead of restarting questions',()=>{
 const domain=ALL_MASTER_DOMAINS[0];
 (store.state.completedDomains as any)[domain.id]={matchedPhenotypeId:domain.phenotypes[0].id,axisScores:{},avgResponseTimeMs:2000};
 let view:any;
 try{
  act(()=>{view=create(<Page/>);});
  act(()=>view.root.findByType(DomainExplorer).props.onSelect(domain.id));
  expect(JSON.stringify(view.toJSON())).toContain('나의 매칭 결과');
 }finally{act(()=>view?.unmount());store.state.completedDomains={};}
});

it('uses only saved axes in the room result and never fills missing axes from the type',()=>{
 const domain=ALL_MASTER_DOMAINS[0];const phenotype=domain.phenotypes[0];
 (store.state.completedDomains as any)[domain.id]={domainId:domain.id,matchedPhenotypeId:phenotype.id,axisScores:{[domain.axes[0].axisKey]:0.8},avgResponseTimeMs:2000};store.recordQuestionChoice.mockClear();
 let view:any;
 try{
  act(()=>{view=create(<Page/>);});act(()=>view.root.findByType(DomainExplorer).props.onSelect(domain.id));
  const text=JSON.stringify(view.toJSON());expect(text).toContain(`‘${domain.axes[0].rightLabel}’`);expect(text).not.toContain(phenotype.deepAnalysis);expect(text).toContain('저장된 점수 없음');expect(store.recordQuestionChoice).not.toHaveBeenCalled();
 }finally{act(()=>view?.unmount());store.state.completedDomains={};}
});

it('keeps zero axes neutral and highlights small positive scores on the right',async()=>{
 const {ALL_MASTER_DOMAINS}=await import('../src/lib/domains-index');
 const domain=ALL_MASTER_DOMAINS.find(d=>d.slug==='fashion')!;const axis=domain.axes[0];
 for(const score of [0,0.001]){
  (store.state.completedDomains as any)[domain.id]={domainId:domain.id,matchedPhenotypeId:domain.phenotypes[0].id,axisScores:{[axis.axisKey]:score},completedAt:'2026-11-12'};
  let view:any;
  try{act(()=>{view=create(<Page/>);});
  act(()=>view.root.findByType(DomainExplorer).props.onSelect(domain.id));

   const spans=view.root.findAllByType('span');
   expect(spans.find((s:any)=>s.children.includes(axis.leftLabel)).props.className).not.toContain('font-bold');
   expect(spans.find((s:any)=>s.children.includes(axis.rightLabel)).props.className.includes('font-bold')).toBe(score>0);
  }finally{act(()=>view?.unmount());store.state.completedDomains={};}
 }
});

it('keeps reset pending state mounted through room hover and question opening', async()=>{
 let resolve!:(value:any)=>void;store.deletePersonaData.mockReturnValue(new Promise(r=>resolve=r));window.confirm=vi.fn(()=>true);
 let view:any;act(()=>{view=create(<Page/>);});
 const control=view.root.findByType(SurveyResetControl);let request:Promise<void>;
 act(()=>{request=control.findByType('button').props.onClick();});
 act(()=>view.root.findByType(RoomCanvas).props.onHoverObject(ALL_MASTER_DOMAINS[0].id));
 expect(view.root.findByType(SurveyResetControl)).toBe(control);expect(control.findByType('button').props.disabled).toBe(true);
 act(()=>view.root.findByType(RoomCanvas).props.onSelectObject(ALL_MASTER_DOMAINS[0].id));
 expect(view.root.findByType(SurveyResetControl)).toBe(control);
 await act(async()=>{resolve({ok:false,error:'저장 상태를 확인해 주세요.'});await request;});
 expect(control.findByProps({role:'alert'}).children.join('')).toContain('저장 상태');act(()=>view.unmount());
});

it('shows the actual two music guides and static curation scope in the room result',()=>{
 const domain=ALL_MASTER_DOMAINS.find(d=>d.slug==='music')!;const phenotype=domain.phenotypes.find(p=>p.decisionGuide.length===2&&p.curations.some(c=>c.id==='cur-mus-4'))!;expect(phenotype).toBeDefined();
 (store.state.completedDomains as any)[domain.id]={domainId:domain.id,matchedPhenotypeId:phenotype.id,axisScores:{},completedAt:'2026-11-12'};const before=JSON.stringify(store.state);store.recordQuestionChoice.mockClear();
 let view:any;
 try{act(()=>{view=create(<Page/>);});act(()=>view.root.findByType(DomainExplorer).props.onSelect(domain.id));
 const text=JSON.stringify(view.toJSON());expect(view.root.findAllByType('a').map((a:any)=>a.props.href)).toEqual(expect.arrayContaining(['https://www.xiph.org/flac/faq.html','https://www.nidcd.nih.gov/health/noise-induced-hearing-loss']));expect(view.root.findAllByType(CurationSources).map((c:any)=>c.props.id)).toEqual(phenotype.curations.map(c=>c.id));expect(view.root.findAllByType('p').filter((p:any)=>p.children.join('')==='저장된 선택 없음')).toHaveLength(domain.questions.length);expect(text).toContain('함께 살펴볼 기준');expect(text).not.toContain('기준 3가지');expect(text).not.toContain('실패 줄이는');expect(text).toContain('유형별로 미리 정한 탐색 예시');expect(text).toContain('실시간 판매·이용 가능 여부');
 const guideList=view.root.findAllByType('ul').find((u:any)=>u.findAllByType('li').some((li:any)=>li.findAllByType('span').some((span:any)=>span.children.includes(phenotype.decisionGuide[0]))));expect(guideList.findAllByType('li')).toHaveLength(2);for(const guide of phenotype.decisionGuide)expect(guideList.findAllByType('span').some((span:any)=>span.children.includes(guide))).toBe(true);
 expect(JSON.stringify(store.state)).toBe(before);expect(store.recordQuestionChoice).not.toHaveBeenCalled();
 }finally{act(()=>view?.unmount());store.state.completedDomains={};}
});

it('does not fabricate missing or invalid choices in the result strip',async()=>{
 const {ALL_MASTER_DOMAINS}=await import('../src/lib/domains-index');const domain=ALL_MASTER_DOMAINS.find(d=>d.slug==='fashion')!;
 (store.state.completedDomains as any)[domain.id]={domainId:domain.id,matchedPhenotypeId:domain.phenotypes[0].id,axisScores:{},completedAt:'2026-11-12'};
 const log=[{domainId:domain.id,questionId:domain.questions[0].id,chosenOption:'A'},{domainId:domain.id,questionId:domain.questions[1].id,chosenOption:'B'},{domainId:domain.id,questionId:domain.questions[2].id,chosenOption:'A'},{domainId:domain.id,questionId:domain.questions[2].id,chosenOption:'C'},{domainId:999,questionId:domain.questions[3].id,chosenOption:'A'}];
 (store.state.choiceTelemetryLog as any)=log;const before=JSON.stringify(store.state);store.recordQuestionChoice.mockClear();let view:any;
 try{act(()=>{view=create(<Page/>);});act(()=>view.root.findByType(DomainExplorer).props.onSelect(domain.id));
 const strip=view.root.findAllByType('div').find((d:any)=>d.props.className==='grid grid-cols-2 sm:grid-cols-5 gap-2.5');expect(strip).toBeDefined();
 const paragraphs=strip.findAllByType('p').map((p:any)=>p.children.join(''));expect(paragraphs).toContain(domain.questions[0].optionA.title);expect(paragraphs).toContain(domain.questions[1].optionB.title);expect(paragraphs.filter((t:string)=>t==='저장된 선택 없음')).toHaveLength(domain.questions.length-2);expect(strip.findAllByType('img')).toHaveLength(2);
 expect(JSON.stringify(store.state)).toBe(before);expect(store.recordQuestionChoice).not.toHaveBeenCalled();
 }finally{act(()=>view?.unmount());store.state.completedDomains={};store.state.choiceTelemetryLog=[];}
});

it('does not replace an unknown saved type with the first type',async()=>{
 const {ALL_MASTER_DOMAINS}=await import('../src/lib/domains-index');const domain=ALL_MASTER_DOMAINS.find(d=>d.slug==='fashion')!;
 (store.state.completedDomains as any)[domain.id]={domainId:domain.id,matchedPhenotypeId:'removed-type',axisScores:{[domain.axes[0].axisKey]:0.4},completedAt:'2026-11-12'};
 (store.state.choiceTelemetryLog as any)=[{domainId:domain.id,questionId:domain.questions[0].id,chosenOption:'B'}];const before=JSON.stringify(store.state);store.recordQuestionChoice.mockClear();let view:any;
 try{act(()=>{view=create(<Page/>);});expect(JSON.stringify(view.toJSON())).toContain('저장된 유형 확인 필요');act(()=>view.root.findByType(RoomCanvas).props.onHoverObject(domain.id));expect(JSON.stringify(view.toJSON())).not.toContain(domain.phenotypes[0].name);act(()=>view.root.findByType(DomainExplorer).props.onSelect(domain.id));
 const text=JSON.stringify(view.toJSON());expect(text).toContain('저장된 유형을 확인할 수 없어요');expect(text).not.toContain(domain.phenotypes[0].name);expect(text).not.toContain('둘러볼 브랜드');expect(text).toContain('0.4');expect(view.root.findAllByType('li').some((li:any)=>li.children.join('').includes(domain.questions[0].optionB.title))).toBe(true);
 expect(JSON.stringify(store.state)).toBe(before);expect(store.recordQuestionChoice).not.toHaveBeenCalled();
 const retry=view.root.findAllByType('button').find((b:any)=>b.children.join('').includes('다시 선택하기'));act(()=>retry.props.onClick());expect(store.recordQuestionChoice).not.toHaveBeenCalled();expect(JSON.stringify(store.state)).toBe(before);
 }finally{act(()=>view?.unmount());store.state.completedDomains={};store.state.choiceTelemetryLog=[];}
});
