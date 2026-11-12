import React from 'react';
import {act,create,ReactTestRenderer} from 'react-test-renderer';
import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {CurationSources} from '../src/components/CurationSources';
import {curationSources} from '../src/lib/curation-sources';
import {ALL_MASTER_DOMAINS} from '../src/lib/domains-index';

it('attaches bounded primary references to existing curation IDs only',()=>{
 const ids=new Set(ALL_MASTER_DOMAINS.flatMap(d=>d.phenotypes.flatMap(p=>p.curations.map(c=>c.id))));
 expect(Object.keys(curationSources)).toHaveLength(6);
 for(const [id,sources] of Object.entries(curationSources)){
  expect(ids.has(id)).toBe(true);
  expect(sources.length).toBeGreaterThan(0);
  for(const source of sources){expect(new URL(source.url).protocol).toBe('https:');expect(source.scope.length).toBeGreaterThan(35);}
 }
 expect(curationSources['cur-gas-12'][0].scope).toContain('초콜릿 평가');
 expect(curationSources['cur-eco-2'][0].scope).toContain('국내 예금 보호제도');
 expect(curationSources['cur-wrk-1'][0].title).toContain('WH-1000XM5');
});
it('uses optional native disclosure and safe explicit links, without embedded requests or storage',()=>{
 let view:ReactTestRenderer;
 act(()=>{view=create(<CurationSources id="cur-mus-4"/>);});
 expect(view!.root.findByType('details').props.open).toBeUndefined();
 expect(view!.root.findByType('summary').children.join('')).toBe('설명에 사용한 자료');
 expect(view!.root.findAllByType('a')).toHaveLength(2);
 for(const link of view!.root.findAllByType('a')){expect(link.props.target).toBe('_blank');expect(link.props.rel).toBe('noopener noreferrer');}
 expect(JSON.stringify(view!.toJSON())).toContain('기관이 추천하거나');
 act(()=>view!.unmount());
 const source=readFileSync('src/components/CurationSources.tsx','utf8');
 expect(source).not.toMatch(/iframe|fetch\(|localStorage|sessionStorage|usePersonaStore|recordCurationFeedback/);
});
it('does not invent source coverage for unreviewed examples',()=>{
 let view:ReactTestRenderer;
 act(()=>{view=create(<CurationSources id="not-reviewed"/>);});
 expect(view!.toJSON()).toBeNull();act(()=>view!.unmount());
});
