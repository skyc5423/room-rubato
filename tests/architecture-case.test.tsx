import React from 'react';
import {act,create,ReactTestRenderer} from 'react-test-renderer';
import {it,expect,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {ArchitectureCaseStudy} from '../src/components/ArchitectureCaseStudy';
it('offers distinct sight and walking layers with matching accessible explanations and no storage',()=>{
 const write=vi.fn();vi.stubGlobal('localStorage',{setItem:write});let view:ReactTestRenderer;
 act(()=>{view=create(<ArchitectureCaseStudy/>);});
 const choose=(name:string)=>act(()=>view!.root.findAllByType('button').find(b=>b.children.join('')===name)!.props.onClick());
 expect(view!.root.findAllByProps({'data-layer':'sight'})).toHaveLength(1);expect(view!.root.findAllByProps({'data-layer':'walk'})).toHaveLength(0);
 choose('동선만 보기');expect(view!.root.findAllByProps({'data-layer':'sight'})).toHaveLength(0);expect(view!.root.findAllByProps({'data-layer':'walk'})).toHaveLength(1);expect(view!.root.findByType('svg').props['aria-label']).toContain('벽과 유리를 통과하지');
 choose('함께 비교하기');expect(view!.root.findAllByProps({'data-layer':'sight'})).toHaveLength(1);expect(view!.root.findAllByProps({'data-layer':'walk'})).toHaveLength(1);expect(view!.root.findAllByType('button').filter(b=>b.props['aria-pressed'])).toHaveLength(1);
 choose('시선만 보기');expect(view!.root.findAllByProps({'data-layer':'walk'})).toHaveLength(0);expect(write).not.toHaveBeenCalled();act(()=>view!.unmount());vi.unstubAllGlobals();
});
it('separates institution facts, research limits and original observation without copied media',()=>{
 let view:ReactTestRenderer;act(()=>{view=create(<ArchitectureCaseStudy/>);});const text=JSON.stringify(view!.toJSON());
 for(const wording of ['기관이 설명하는 공간','한국 연구에서 읽는 관점','Room Rubato의 관찰 제안','효과를 검증한 연구는 아닙니다','도면을 재현하지 않았으며','조작은 기록되지'])expect(text).toContain(wording);
 expect(view!.root.findAllByType('img')).toHaveLength(0);expect(view!.root.findAllByType('a').map(a=>a.props.href)).toContain('https://doi.org/10.12813/kieae.2017.17.5.061');act(()=>view!.unmount());
 expect(readFileSync('src/components/TasteNotebook.tsx','utf8')).toContain("lesson.id==='space'&&<ArchitectureCaseStudy");
});
