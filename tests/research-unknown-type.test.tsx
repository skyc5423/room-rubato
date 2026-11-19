import React from 'react';
import {act,create} from 'react-test-renderer';
import {expect,it,vi} from 'vitest';
import {ALL_MASTER_DOMAINS} from '../src/lib/domains-index';
const store=vi.hoisted(()=>({state:{completedDomains:{},choiceTelemetryLog:[],curationFeedbackLog:[],dailyShiftLog:[],layer1Vector:{openness:0,conscientiousness:0,extraversion:0,agreeableness:0,opennessVsConservation:0},layer2Vector:{socialConformity:0,authoritySensitivity:0,riskAversion:0,timeDiscounting:0},layer3Vector:{complexity:0,novelty:0,intensity:0,conceptualism:0,warmth:0}},authUser:null,isHydrated:true,syncError:null as string|null}));
vi.mock('../src/lib/persona-store',()=>({usePersonaStore:()=>store}));
vi.mock('../src/components/SavedRecordInspector',()=>({SavedRecordInspector:()=>null}));
vi.mock('../src/components/SurveyResetControl',()=>({SurveyResetControl:()=>null}));
vi.mock('next/link',()=>({default:({children,href}:any)=><a href={href}>{children}</a>}));
import Page from '../src/app/research/page';
it('labels an unavailable saved type in summary tiles and links to its actual record',()=>{
 const domain=ALL_MASTER_DOMAINS[0];(store.state.completedDomains as any)[domain.id]={domainId:domain.id,matchedPhenotypeId:'removed-type',axisScores:{},avgResponseTimeMs:2000};const before=JSON.stringify(store.state);let view:any;
 try{act(()=>{view=create(<Page/>);});expect(JSON.stringify(view.toJSON())).toContain('저장된 유형 확인 필요');expect(JSON.stringify(view.toJSON())).not.toContain(domain.phenotypes[0].name);expect(view.root.findAllByType('a').map((a:any)=>a.props.href)).toContain(`/domain/${domain.slug}`);expect(JSON.stringify(store.state)).toBe(before);
 }finally{act(()=>view?.unmount());store.state.completedDomains={};}
});
it('keeps a valid saved type label unchanged',()=>{
 const domain=ALL_MASTER_DOMAINS[0];(store.state.completedDomains as any)[domain.id]={domainId:domain.id,matchedPhenotypeId:domain.phenotypes[1].id,axisScores:{},avgResponseTimeMs:2000};let view:any;
 try{act(()=>{view=create(<Page/>);});expect(JSON.stringify(view.toJSON())).toContain(domain.phenotypes[1].name);expect(JSON.stringify(view.toJSON())).not.toContain('저장된 유형 확인 필요');}finally{act(()=>view?.unmount());store.state.completedDomains={};}
});

it.each([null,'0.5',false,NaN,Infinity,-Infinity,2])('renders unavailable rather than crashing for legacy vector %s',(invalid)=>{
 const domain=ALL_MASTER_DOMAINS[0];(store.state.completedDomains as any)[domain.id]={domainId:domain.id,matchedPhenotypeId:domain.phenotypes[0].id,axisScores:{},avgResponseTimeMs:2000};
 const prior=store.state.layer1Vector.openness;(store.state.layer1Vector as any).openness=invalid;const before=store.state.layer1Vector.openness;let view:any;
 try{act(()=>{view=create(<Page/>);});expect(view.root.findAllByType('span').map((node:any)=>node.children.join(''))).toContain('저장된 점수 확인 불가');expect(Object.is(store.state.layer1Vector.openness,before)).toBe(true);}finally{act(()=>view?.unmount());store.state.layer1Vector.openness=prior;store.state.completedDomains={};}
});
it.each([null,undefined,'bad','2000',-1000,Infinity])('does not coerce invalid summary time %s',(value)=>{
 const domain=ALL_MASTER_DOMAINS[0];(store.state.completedDomains as any)[domain.id]={domainId:domain.id,matchedPhenotypeId:domain.phenotypes[0].id,axisScores:{},avgResponseTimeMs:value};let view:any;
 try{act(()=>{view=create(<Page/>);});expect(view.root.findAllByType('span').map((node:any)=>node.children.join(''))).toContain('응답 시간 확인 불가');expect((store.state.completedDomains as any)[domain.id].avgResponseTimeMs).toBe(value);}finally{act(()=>view?.unmount());store.state.completedDomains={};}
});
it.each([[0,'+0.00'],[-0.5,'-0.50'],[0.5,'+0.50']])('preserves genuine valid score %s',(value,label)=>{
 const domain=ALL_MASTER_DOMAINS[0];(store.state.completedDomains as any)[domain.id]={domainId:domain.id,matchedPhenotypeId:domain.phenotypes[0].id,axisScores:{},avgResponseTimeMs:0};const prior=store.state.layer1Vector.openness;store.state.layer1Vector.openness=value as number;let view:any;
 try{act(()=>{view=create(<Page/>);});const spans=view.root.findAllByType('span').map((node:any)=>node.children.join(''));expect(spans).toContain(label);expect(spans).toContain('평균 0.0초');}finally{act(()=>view?.unmount());store.state.layer1Vector.openness=prior;store.state.completedDomains={};}
});

it.each([null,'read failure'])('does not describe unread records as an empty completed profile: %s',error=>{
 let view:any;store.isHydrated=false;store.syncError=error;const before=JSON.stringify(store.state);
 try{act(()=>{view=create(<Page/>);});const text=JSON.stringify(view.toJSON());expect(text).toContain(error?'기록을 아직 불러오지 못했어요':'저장된 기록을 불러오는 중입니다');expect(text).not.toContain('아직 완료한 분야가 없습니다');expect(text).not.toContain('응답 없음');expect(view.root.findAllByType('h2')).toHaveLength(0);expect(JSON.stringify(store.state)).toBe(before);
 store.isHydrated=true;store.syncError=null;act(()=>view.update(<Page/>));expect(JSON.stringify(view.toJSON())).toContain('아직 완료한 분야가 없습니다');
 }finally{act(()=>view?.unmount());store.isHydrated=true;store.syncError=null;}
});
it('describes weighted answers without claiming comparison with other people or measurement of traits',()=>{
 let view:any;try{act(()=>{view=create(<Page/>);});const text=JSON.stringify(view.toJSON());expect(text).not.toContain('남들의 속도와 나의 속도');expect(text).not.toContain('실험 중');expect(text).toContain('상황별 선택의 가중치');expect(text).toContain('다른 이용자의 응답이나 속도와 비교한 값이 아닙니다');expect(text).toContain('0이라고 중립적인 성격이나 취향이라는 뜻은 아닙니다');}finally{act(()=>view?.unmount());}
});
