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

it('uses recorded result axes rather than static claims about selected scenes',async()=>{
 const {ALL_MASTER_DOMAINS}=await import('../src/lib/domains-index');
 const domain=ALL_MASTER_DOMAINS.find(d=>d.slug==='fashion')!;
 const phenotype=domain.phenotypes[0];
 (store.state.completedDomains as any)[domain.id]={domainId:domain.id,matchedPhenotypeId:phenotype.id,axisScores:{[domain.axes[0].axisKey]:-0.8},completedAt:'2026-11-12'};
 let view:any;
 try{
  act(()=>{view=create(<Page/>);});
  const text=JSON.stringify(view.toJSON());expect(text).toContain(`‘${domain.axes[0].leftLabel}’`);expect(text).not.toContain(phenotype.deepAnalysis);expect(text).toContain('저장된 점수 없음');expect(store.recordQuestionChoice).not.toHaveBeenCalled();
 }finally{act(()=>view?.unmount());store.state.completedDomains={};}
});

it('keeps zero axes neutral and highlights small positive scores on the right',async()=>{
 const {ALL_MASTER_DOMAINS}=await import('../src/lib/domains-index');
 const domain=ALL_MASTER_DOMAINS.find(d=>d.slug==='fashion')!;const axis=domain.axes[0];
 for(const score of [0,0.001]){
  (store.state.completedDomains as any)[domain.id]={domainId:domain.id,matchedPhenotypeId:domain.phenotypes[0].id,axisScores:{[axis.axisKey]:score},completedAt:'2026-11-12'};
  let view:any;
  try{act(()=>{view=create(<Page/>);});

   const spans=view.root.findAllByType('span');
   expect(spans.find((s:any)=>s.children.includes(axis.leftLabel)).props.className).not.toContain('font-bold');
   expect(spans.find((s:any)=>s.children.includes(axis.rightLabel)).props.className.includes('font-bold')).toBe(score>0);
  }finally{act(()=>view?.unmount());store.state.completedDomains={};}
 }
});
