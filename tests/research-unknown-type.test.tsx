import React from 'react';
import {act,create} from 'react-test-renderer';
import {expect,it,vi} from 'vitest';
import {ALL_MASTER_DOMAINS} from '../src/lib/domains-index';
const store=vi.hoisted(()=>({state:{completedDomains:{},choiceTelemetryLog:[],curationFeedbackLog:[],dailyShiftLog:[],layer1Vector:{openness:0,conscientiousness:0,extraversion:0,agreeableness:0,opennessVsConservation:0},layer2Vector:{socialConformity:0,authoritySensitivity:0,riskAversion:0,timeDiscounting:0},layer3Vector:{complexity:0,novelty:0,intensity:0,conceptualism:0,warmth:0}},authUser:null,isHydrated:true}));
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
