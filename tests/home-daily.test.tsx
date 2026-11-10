import React from 'react';
import { act, create } from 'react-test-renderer';
import { beforeEach, expect, it, vi } from 'vitest';
import { DAILY_PULSE_QUESTIONS } from '../src/lib/domains-index';

const store = vi.hoisted(() => ({ state: { dailyShiftLog: [] as any[], completedDomains: {}, layer3Vector: {}, layer1Vector: {}, layer2Vector: {}, choiceTelemetryLog: [], curationFeedbackLog: [] }, isHydrated: true, currentUserId: 'a', recordQuestionChoice: vi.fn(), recordDailyPulseShift: vi.fn() }));
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
