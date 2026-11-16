import React from 'react';
import { act, create } from 'react-test-renderer';
import { beforeEach, expect, it, vi } from 'vitest';
import { DAILY_PULSE_QUESTIONS } from '../src/lib/domains-index';

const store = vi.hoisted(() => ({ state: { dailyShiftLog: [] as any[] }, isHydrated: true, currentUserId: 'a', recordDailyPulseShift: vi.fn() }));
vi.mock('../src/lib/persona-store', () => ({ usePersonaStore: () => store }));
vi.mock('../src/components/SpecimenPlate', () => ({ SpecimenPlate: () => null }));
vi.mock('next/link', () => ({ default: ({ children }: any) => <span>{children}</span> }));
import Page from '../src/app/daily/page';

beforeEach(() => {
  vi.stubGlobal('window', { addEventListener: vi.fn(), removeEventListener: vi.fn() }); store.state.dailyShiftLog = []; store.isHydrated = true; });
it('restores completed pulse from persisted state without recording again', () => {
  store.state.dailyShiftLog = [{ timestamp: new Date().toISOString(), pulseId: DAILY_PULSE_QUESTIONS[0].id, phase1Choice: 'A', phase2ChoiceAfterSocialProof: 'B', phase1ResponseTimeMs: 2100 }];
  let view: any;
  act(() => { view = create(<Page />); });
  expect(JSON.stringify(view.toJSON())).toContain('가상 상황을 읽고 선택을 바꾸셨네요');
  expect(JSON.stringify(view.toJSON())).toContain('2.1');
  expect(JSON.stringify(view.toJSON())).toContain('오늘의 답변은 성향 점수에 반영하지 않습니다');
  expect(JSON.stringify(view.toJSON())).toContain(DAILY_PULSE_QUESTIONS[0].yesterdayInsight.keyTakeaway);
  expect(JSON.stringify(view.toJSON())).toContain('더 살펴보기');
  expect(store.recordDailyPulseShift).not.toHaveBeenCalled();
  act(() => view.unmount());
});
it('does not offer answer controls until hydration completes', () => {
  store.isHydrated = false;
  let view: any;
  act(() => { view = create(<Page />); });
  expect(view.root.findAllByType('button')).toHaveLength(0);
  act(() => view.unmount());
});

it('offers a new response for a previous-day completion', () => {
  store.state.dailyShiftLog = [{ timestamp: '2020-01-01T12:00:00Z', pulseId: DAILY_PULSE_QUESTIONS[0].id, phase1Choice: 'A', phase2ChoiceAfterSocialProof: 'B', phase1ResponseTimeMs: 2100 }];
  let view: any;
  act(() => { view = create(<Page />); });
  expect(JSON.stringify(view.toJSON())).toContain('이 답변 선택하기');
  act(() => view.unmount());
});
it('unlocks a completed pulse when an open page crosses Korean midnight', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-10T14:59:59Z'));
  store.state.dailyShiftLog = [{ timestamp: '2026-11-10T14:00:00Z', pulseId: DAILY_PULSE_QUESTIONS[0].id, phase1Choice: 'A', phase2ChoiceAfterSocialProof: 'B', phase1ResponseTimeMs: 2100 }];
  let view: any;
  try {
    act(() => { view = create(<Page />); });
    expect(JSON.stringify(view.toJSON())).toContain('가상 상황을 읽고 선택을 바꾸셨네요');
    act(() => { vi.advanceTimersByTime(1000); });
    expect(JSON.stringify(view.toJSON())).toContain('이 답변 선택하기');
  } finally {
    act(() => view?.unmount());
    vi.useRealTimers();
  }
});

it('switches to each new question accessibly and keeps completed answers separate', () => {
  store.state.dailyShiftLog = [{ timestamp: new Date().toISOString(), pulseId: 'daily-pulse-8', phase1Choice: 'B', phase2ChoiceAfterSocialProof: 'A', phase1ResponseTimeMs: 3200 }];
  let view: any;
  act(() => { view = create(<Page />); });
  const selectors = () => view.root.findAllByProps({ 'aria-pressed': false }).concat(view.root.findAllByProps({ 'aria-pressed': true }));
  expect(selectors()).toHaveLength(8);
  for (let index = 2; index < 8; index++) {
    const button = selectors().find((button: any) => JSON.stringify(button.props.children).includes(DAILY_PULSE_QUESTIONS[index].domainTitle));
    act(() => button.props.onClick());
    expect(JSON.stringify(view.toJSON())).toContain(DAILY_PULSE_QUESTIONS[index].questionText);
    expect(view.root.findAllByProps({ 'aria-pressed': true })).toHaveLength(1);
  }
  expect(JSON.stringify(view.toJSON())).toContain('3.2');
  expect(JSON.stringify(view.toJSON())).toContain('가상 상황을 읽고 선택을 바꾸셨네요');
  const first = selectors().find((button: any) => JSON.stringify(button.props.children).includes(DAILY_PULSE_QUESTIONS[0].domainTitle));
  act(() => first.props.onClick());
  expect(JSON.stringify(view.toJSON())).toContain('이 답변 선택하기');
  act(() => view.unmount());
});

it.each([null,undefined,'bad',-1000])('never substitutes draft duration for an invalid saved daily time %s',(value)=>{
 store.state.dailyShiftLog=[{timestamp:new Date().toISOString(),pulseId:DAILY_PULSE_QUESTIONS[0].id,phase1Choice:'A',phase2ChoiceAfterSocialProof:'B',phase1ResponseTimeMs:value}];let view:any;
 try{act(()=>{view=create(<Page/>);});expect(JSON.stringify(view.toJSON())).toContain('저장된 응답 시간을 확인할 수 없어요');expect(store.state.dailyShiftLog[0].phase1ResponseTimeMs).toBe(value);expect(store.recordDailyPulseShift).not.toHaveBeenCalled();}finally{act(()=>view?.unmount());}
});
it('preserves an actual saved zero duration',()=>{
 store.state.dailyShiftLog=[{timestamp:new Date().toISOString(),pulseId:DAILY_PULSE_QUESTIONS[0].id,phase1Choice:'A',phase2ChoiceAfterSocialProof:'B',phase1ResponseTimeMs:0}];let view:any;
 try{act(()=>{view=create(<Page/>);});expect(view.root.findAllByType('p').some((p:any)=>p.children.join('').includes('처음 고르기까지 0.0초'))).toBe(true);expect(store.state.dailyShiftLog[0].phase1ResponseTimeMs).toBe(0);}finally{act(()=>view?.unmount());}
});
it('records a rapid repeated final choice only once',()=>{
 store.recordDailyPulseShift.mockClear();let view:any;act(()=>{view=create(<Page/>);});
 act(()=>view.root.findAllByType('button').find((b:any)=>b.props.className?.includes('paper-postcard')).props.onClick());
 const keep=view.root.findAllByType('button').find((b:any)=>JSON.stringify(b.children).includes('유지하기'));
 act(()=>{keep.props.onClick();keep.props.onClick();});expect(store.recordDailyPulseShift).toHaveBeenCalledTimes(1);act(()=>view.unmount());store.recordDailyPulseShift.mockClear();
});
it('returns to a fresh question after the completed daily record is reset',()=>{
 let view:any;act(()=>{view=create(<Page/>);});
 act(()=>view.root.findAllByType('button').find((b:any)=>b.props.className?.includes('paper-postcard')).props.onClick());
 act(()=>view.root.findAllByType('button').find((b:any)=>JSON.stringify(b.children).includes('유지하기')).props.onClick());
 store.state.dailyShiftLog=[{timestamp:new Date().toISOString(),pulseId:DAILY_PULSE_QUESTIONS[0].id,phase1Choice:'A',phase2ChoiceAfterSocialProof:'A',phase1ResponseTimeMs:1000}];act(()=>view.update(<Page/>));
 store.state.dailyShiftLog=[];act(()=>view.update(<Page/>));
 expect(JSON.stringify(view.toJSON())).toContain('이 답변 선택하기');act(()=>view.unmount());store.recordDailyPulseShift.mockClear();
});

// Stored records are untrusted display input, not permission to repair or re-answer them.
it('survives malformed daily log members without rewriting saved records', () => {
  store.recordDailyPulseShift.mockClear();
  store.state.dailyShiftLog = [null, false, 42, {}, {timestamp: {}, pulseId: DAILY_PULSE_QUESTIONS[0].id}, { timestamp: new Date().toISOString(), pulseId: DAILY_PULSE_QUESTIONS[0].id, phase1Choice: 'A', phase2ChoiceAfterSocialProof: 'B' }];
  const before = JSON.stringify(store.state.dailyShiftLog); let view:any;
  try { act(() => { view=create(<Page/>); }); expect(JSON.stringify(view.toJSON())).not.toContain('저장된 선택을 확인할 수 없어요'); expect(JSON.stringify(store.state.dailyShiftLog)).toBe(before); expect(store.recordDailyPulseShift).not.toHaveBeenCalled(); }
  finally { act(() => view?.unmount()); }
});
it.each([[null, 'B'], ['A', undefined], ['C', 'B'], [{}, 'A'], ['B', 'b']])('does not invent a daily result for invalid choices %s / %s', (first, second) => {
  store.recordDailyPulseShift.mockClear();
  store.state.dailyShiftLog = [{ timestamp: new Date().toISOString(), pulseId: DAILY_PULSE_QUESTIONS[0].id, phase1Choice: 'A', phase2ChoiceAfterSocialProof: 'A' }, { timestamp: new Date().toISOString(), pulseId: DAILY_PULSE_QUESTIONS[0].id, phase1Choice: first, phase2ChoiceAfterSocialProof: second }];
  const before = JSON.stringify(store.state.dailyShiftLog); let view:any;
  try { act(() => { view=create(<Page/>); }); const text=JSON.stringify(view.toJSON()); expect(text).toContain('저장된 선택을 확인할 수 없어요'); expect(text).not.toContain('유지하셨'); expect(text).not.toContain('바꾸셨'); expect(JSON.stringify(store.state.dailyShiftLog)).toBe(before); expect(store.recordDailyPulseShift).not.toHaveBeenCalled(); }
  finally { act(() => view?.unmount()); }
});
