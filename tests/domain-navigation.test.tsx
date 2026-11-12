import React from 'react';
import {CurationSources} from '../src/components/CurationSources';
import { act, create } from 'react-test-renderer';
import { beforeEach, expect, it, vi } from 'vitest';
const route=vi.hoisted(()=>({slug:'fashion'}));
const store = vi.hoisted(() => ({ state: { completedDomains: {}, choiceTelemetryLog: [], curationFeedbackLog: [], dailyShiftLog: [], layer3Vector: {}, layer1Vector: {}, layer2Vector: {} }, isHydrated: true, currentUserId: 'a', recordQuestionChoice: vi.fn(), recordCurationFeedback: vi.fn() }));
vi.mock('../src/lib/persona-store', () => ({ usePersonaStore: () => store }));
vi.mock('next/navigation', () => ({ useParams: () => route }));
vi.mock('next/link', () => ({default: ({children}: any) => <span>{children}</span>}));
vi.mock('../src/components/SpecimenPlate', () => ({SpecimenPlate: () => null, QUESTION_OPTION_IMAGES: {}}));
import Page from '../src/app/domain/[slug]/page';
beforeEach(() => { route.slug='fashion';store.isHydrated = true; store.recordQuestionChoice.mockClear(); vi.stubGlobal('window', {location:{search:'?q=10&previewResult=1'}}); });
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


it('shows two music guides and static curation scope without mutating the saved result',async()=>{
 const {ALL_MASTER_DOMAINS}=await import('../src/lib/domains-index');const domain=ALL_MASTER_DOMAINS.find(d=>d.slug==='music')!;const phenotype=domain.phenotypes.find(p=>p.decisionGuide.length===2&&p.curations.some(c=>c.id==='cur-mus-4'))!;expect(phenotype).toBeDefined();route.slug='music';
 (store.state.completedDomains as any)[domain.id]={domainId:domain.id,matchedPhenotypeId:phenotype.id,axisScores:{},completedAt:'2026-11-12'};const before=JSON.stringify(store.state);let view:any;
 try{act(()=>{view=create(<Page/>);});const text=JSON.stringify(view.toJSON());expect(view.root.findAllByType('a').map((a:any)=>a.props.href)).toEqual(expect.arrayContaining(['https://www.xiph.org/flac/faq.html','https://www.nidcd.nih.gov/health/noise-induced-hearing-loss']));expect(view.root.findAllByType(CurationSources).map((c:any)=>c.props.id)).toEqual(phenotype.curations.map(c=>c.id));expect(view.root.findAllByType('p').filter((p:any)=>p.children.join('')==='저장된 선택 없음')).toHaveLength(domain.questions.length);expect(text).toContain('함께 살펴볼 기준');expect(text).not.toContain('기준 3가지');expect(text).not.toContain('실패 줄이는');expect(text).toContain('유형별로 미리 정한 탐색 예시');expect(text).toContain('현재 제품·서비스의 조건을 직접 비교');
 const guideList=view.root.findAllByType('ul').find((u:any)=>u.findAllByType('li').some((li:any)=>li.findAllByType('span').some((span:any)=>span.children.includes(phenotype.decisionGuide[0]))));expect(guideList.findAllByType('li')).toHaveLength(2);expect(JSON.stringify(store.state)).toBe(before);expect(store.recordQuestionChoice).not.toHaveBeenCalled();
 }finally{act(()=>view?.unmount());store.state.completedDomains={};}
});

it('does not fabricate missing or invalid choices in the result strip',async()=>{
 const {ALL_MASTER_DOMAINS}=await import('../src/lib/domains-index');const domain=ALL_MASTER_DOMAINS.find(d=>d.slug==='fashion')!;
 (store.state.completedDomains as any)[domain.id]={domainId:domain.id,matchedPhenotypeId:domain.phenotypes[0].id,axisScores:{},completedAt:'2026-11-12'};
 const log=[{domainId:domain.id,questionId:domain.questions[0].id,chosenOption:'A'},{domainId:domain.id,questionId:domain.questions[1].id,chosenOption:'B'},{domainId:domain.id,questionId:domain.questions[2].id,chosenOption:'A'},{domainId:domain.id,questionId:domain.questions[2].id,chosenOption:'C'},{domainId:999,questionId:domain.questions[3].id,chosenOption:'A'}];
 (store.state.choiceTelemetryLog as any)=log;const before=JSON.stringify(store.state);store.recordQuestionChoice.mockClear();let view:any;
 try{act(()=>{view=create(<Page/>);});
 const strip=view.root.findAllByType('div').find((d:any)=>d.props.className?.includes('grid-cols-2')&&d.props.className?.includes('sm:grid-cols-5'));expect(strip).toBeDefined();
 const paragraphs=strip.findAllByType('p').map((p:any)=>p.children.join(''));expect(paragraphs).toContain(domain.questions[0].optionA.title);expect(paragraphs).toContain(domain.questions[1].optionB.title);expect(paragraphs.filter((t:string)=>t==='저장된 선택 없음')).toHaveLength(domain.questions.length-2);expect(strip.findAllByType('img')).toHaveLength(2);
 expect(JSON.stringify(store.state)).toBe(before);expect(store.recordQuestionChoice).not.toHaveBeenCalled();
 }finally{act(()=>view?.unmount());store.state.completedDomains={};store.state.choiceTelemetryLog=[];}
});

it('does not replace an unknown saved type with the first type',async()=>{
 const {ALL_MASTER_DOMAINS}=await import('../src/lib/domains-index');const domain=ALL_MASTER_DOMAINS.find(d=>d.slug==='fashion')!;
 (store.state.completedDomains as any)[domain.id]={domainId:domain.id,matchedPhenotypeId:'removed-type',axisScores:{[domain.axes[0].axisKey]:0.4},completedAt:'2026-11-12'};
 (store.state.choiceTelemetryLog as any)=[{domainId:domain.id,questionId:domain.questions[0].id,chosenOption:'B'}];const before=JSON.stringify(store.state);store.recordQuestionChoice.mockClear();let view:any;
 try{act(()=>{view=create(<Page/>);});
 const text=JSON.stringify(view.toJSON());expect(text).toContain('저장된 유형을 확인할 수 없어요');expect(text).not.toContain(domain.phenotypes[0].name);expect(text).not.toContain('둘러볼 브랜드');expect(text).toContain('0.4');expect(view.root.findAllByType('li').some((li:any)=>li.children.join('').includes(domain.questions[0].optionB.title))).toBe(true);
 expect(JSON.stringify(store.state)).toBe(before);expect(store.recordQuestionChoice).not.toHaveBeenCalled();
 const retry=view.root.findAllByType('button').find((b:any)=>b.findAllByType('span').some((span:any)=>span.children.includes('질문 다시 선택하기')));act(()=>retry.props.onClick());expect(store.recordQuestionChoice).not.toHaveBeenCalled();expect(JSON.stringify(store.state)).toBe(before);
 }finally{act(()=>view?.unmount());store.state.completedDomains={};store.state.choiceTelemetryLog=[];}
});
