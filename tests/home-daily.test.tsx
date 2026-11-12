import React from 'react';
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
