import React from 'react';
import { act, create } from 'react-test-renderer';
import { beforeEach, expect, it, vi } from 'vitest';
const store = vi.hoisted(() => ({ state: { completedDomains: {}, choiceTelemetryLog: [], curationFeedbackLog: [], dailyShiftLog: [], layer3Vector: {}, layer1Vector: {}, layer2Vector: {} }, isHydrated: true, currentUserId: 'a', recordQuestionChoice: vi.fn(), recordCurationFeedback: vi.fn() }));
vi.mock('../src/lib/persona-store', () => ({ usePersonaStore: () => store }));
vi.mock('next/navigation', () => ({ useParams: () => ({slug:'fashion'}) }));
vi.mock('next/link', () => ({default: ({children}: any) => <span>{children}</span>}));
vi.mock('../src/components/SpecimenPlate', () => ({SpecimenPlate: () => null, QUESTION_OPTION_IMAGES: {}}));
import Page from '../src/app/domain/[slug]/page';
beforeEach(() => { store.isHydrated = true; store.recordQuestionChoice.mockClear(); vi.stubGlobal('window', {location:{search:'?q=10&previewResult=1'}}); });
it('does not write synthetic data or skip questions from query parameters', () => {
  let view: any; act(() => {view = create(<Page/>);});
  expect(store.recordQuestionChoice).not.toHaveBeenCalled();
  expect(JSON.stringify(view.toJSON())).toContain('질문 ');
  expect(view.root.findByType('h2').children[1]).toBe('1');
  act(() => view.unmount());
});
it('waits for hydration before displaying answer controls', () => {
 store.isHydrated = false;
 let view: any; act(() => {view=create(<Page/>);});
 expect(JSON.stringify(view.toJSON())).toContain('저장된 응답을 불러오는 중입니다.');
 expect(view.root.findAllByType('button')).toHaveLength(0);
 act(() => view.unmount());
});
it('records a complete questionnaire only once after all choices', () => {
 let view: any; act(() => {view=create(<Page/>);});
 for(let i=0;i<10;i++) {
  const choice=view.root.findAllByType('button').find((b:any)=>b.props.className?.includes('paper-postcard'));
  expect(choice).toBeDefined();
  act(()=>{choice.props.onClick(); choice.props.onClick();});
 }
 expect(store.recordQuestionChoice).toHaveBeenCalledTimes(1);
 expect(store.recordQuestionChoice.mock.calls[0][0].answers).toHaveLength(10);
 act(() => view.unmount());
});
