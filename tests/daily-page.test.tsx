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
