import React from 'react';
import {act,create} from 'react-test-renderer';
import {renderToStaticMarkup} from 'react-dom/server';
import {it,expect,vi} from 'vitest';
import {plainWeave,fibreWeaveExamples,fibreWeaveSources,mixedFibreCaseSource} from '../src/lib/fibre-weave';
import {FibreWeaveStudy} from '../src/components/FibreWeaveStudy';
import Page,{metadata} from '../src/app/observe/fibre-weave/page';
vi.mock('next/link',()=>({default:({children,...props}:any)=><a {...props}>{children}</a>}));
it('defines only a 6x6 plain weave with alternating crossings in both directions',()=>{
 expect(plainWeave).toHaveLength(6);for(let r=0;r<6;r++){expect(plainWeave[r]).toHaveLength(6);for(let c=0;c<6;c++){expect(plainWeave[r][c]).toBe((r+c)%2===0);if(c)expect(plainWeave[r][c]).not.toBe(plainWeave[r][c-1]);if(r)expect(plainWeave[r][c]).not.toBe(plainWeave[r-1][c]);}}
});
it('offers two fictional controlled-description comparisons and exact primary links',()=>{
 expect(fibreWeaveExamples).toHaveLength(2);expect(fibreWeaveExamples[0].a).toContain('실크');expect(fibreWeaveExamples[0].b).toContain('실크');expect(fibreWeaveExamples[1].a).toContain('평직');expect(fibreWeaveExamples[1].b).toContain('평직');
 const html=renderToStaticMarkup(<FibreWeaveStudy/>);for(const s of fibreWeaveSources)expect(html).toContain(s.url);expect(html).toContain('실제 제품의 품질');expect(html).toContain('새틴 조직을 그린 것이 아닙니다');expect(html).not.toContain('<img');
});
it('keeps text crossing order visible without colour or disclosure and labels the SVG',()=>{
 let view:any;act(()=>{view=create(<FibreWeaveStudy/>);});try{const svg=view.root.findByType('svg');expect(svg.props['aria-label']).toContain('위, 아래');expect(view.root.findAllByType('p').some((p:any)=>p.children.join('').includes('1·3·5행')&&!p.parent?.findAllByType('summary').length)).toBe(true);}finally{act(()=>view.unmount());}
});
it('closes explanation on example switch and resets both disclosures without moving focus',()=>{
 const focus=vi.fn();let view:any;act(()=>{view=create(<FibreWeaveStudy/>,{createNodeMock:()=>({focus})});});try{
 const original=view.root.findByProps({'data-fibre-explanation':'same-fibre'});expect(original.props.open).not.toBe(true);
 act(()=>view.root.findByProps({'data-fibre-example':'same-weave'}).props.onClick());const changed=view.root.findByProps({'data-fibre-explanation':'same-weave'});expect(changed).not.toBe(original);expect(changed.props.open).not.toBe(true);
 const terms=view.root.findByProps({'data-fibre-terms':true});act(()=>view.root.findByProps({'data-fibre-reset':true}).props.onClick());expect(view.root.findByProps({'data-fibre-example':'same-fibre'}).props['aria-pressed']).toBe(true);expect(view.root.findByProps({'data-fibre-terms':true})).not.toBe(terms);expect(focus).not.toHaveBeenCalled();
 }finally{act(()=>view.unmount());}
});
it('has no inputs or storage and remounts at the first example',()=>{
 const storage={getItem:vi.fn(),setItem:vi.fn(),removeItem:vi.fn()};vi.stubGlobal('localStorage',storage);vi.stubGlobal('sessionStorage',storage);let view:any;try{act(()=>{view=create(<FibreWeaveStudy/>);});act(()=>view.root.findByProps({'data-fibre-example':'same-weave'}).props.onClick());expect(view.root.findAllByType('input')).toHaveLength(0);expect(view.root.findAllByType('textarea')).toHaveLength(0);act(()=>view.unmount());act(()=>{view=create(<FibreWeaveStudy/>);});expect(view.root.findByProps({'data-fibre-example':'same-fibre'}).props['aria-pressed']).toBe(true);for(const fn of Object.values(storage))expect(fn).not.toHaveBeenCalled();}finally{act(()=>view.unmount());vi.unstubAllGlobals();}
});
it('provides metadata, one page heading and a catalogue return link',()=>{
 const html=renderToStaticMarkup(<Page/>);expect(metadata.title).toContain('섬유와 조직');expect(html.match(/<h1/g)).toHaveLength(1);expect(html).toContain('href="/explore"');expect(html).toContain('약 2–3분');
});

it('bounds the documented mixed-fibre example to its actual object and does not infer fibre from appearance',()=>{const html=renderToStaticMarkup(<FibreWeaveStudy/>);expect(html).toContain(mixedFibreCaseSource.replaceAll('&','&amp;'));expect(html).toContain('실크 날실과 면 씨실');expect(html).toContain('모든 새틴 조직의 재료나 표면 방향을 뜻하지');expect(html).toContain('사진이나 광택만 보고 섬유를 식별하는 활동도 아닙니다');});
