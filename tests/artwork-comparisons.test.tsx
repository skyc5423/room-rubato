import React from 'react';
import {act,create,ReactTestRenderer} from 'react-test-renderer';
import {describe,it,expect,vi} from 'vitest';
import {ArtworkComparison} from '../src/components/ArtworkComparison';
import {artworkComparisons} from '../src/lib/artwork-comparisons';
import {artworkStudies} from '../src/lib/artwork-studies';
import {tasteLessons} from '../src/lib/taste-lessons';
describe('two-work comparison',()=>{
 it('has distinct licensed works and valid notebook destinations',()=>{
  for(const study of artworkComparisons){expect(new Set(study.workIds).size).toBe(2);expect(tasteLessons.some(l=>l.id===study.lessonId)).toBe(true);for(const id of study.workIds)expect(artworkStudies.find(w=>w.id===id)?.license).toBe('CC0');}
 });
 it('shows both complete images before revealing context, without response inputs',()=>{
  let view:ReactTestRenderer;act(()=>{view=create(<ArtworkComparison study={artworkComparisons[0]}/>);});
  expect(view!.root.findAllByType('img')).toHaveLength(2);
  expect(view!.root.findAllByType('textarea')).toHaveLength(0);
  expect(JSON.stringify(view!.toJSON())).not.toContain('미술관 자료에서 확인한 내용');
  const toggle=view!.root.findAllByType('button').find(b=>b.props['aria-controls']==='comparison-context')!;act(()=>toggle.props.onClick());
  expect(toggle.props['aria-expanded']).toBe(true);
  expect(JSON.stringify(view!.toJSON())).toContain('Room Rubato의 비교 제안');
  expect(view!.root.findAllByType('a').some(a=>a.props.href==='/notes?lesson=light')).toBe(true);
  act(()=>toggle.props.onClick());expect(toggle.props['aria-expanded']).toBe(false);act(()=>view!.unmount());
 });
});

vi.mock('next/link',()=>({default:({children,...props}:React.AnchorHTMLAttributes<HTMLAnchorElement>)=><a {...props}>{children}</a>}));

it('keeps detail views independent, labels the crop, and restores the original whole image',()=>{
 let view:ReactTestRenderer;act(()=>{view=create(<ArtworkComparison study={artworkComparisons[1]}/>);});
 const figures=()=>view!.root.findAllByType('figure');
 const first=()=>figures()[0].findByType('img');
 const second=()=>figures()[1].findByType('img');
 act(()=>{first().props.onLoad();second().props.onLoad();});
 expect(first().props.style.left).toBeUndefined();expect(second().props.style.left).toBeUndefined();
 act(()=>figures()[1].findByType('button').props.onClick());
 expect(figures()[1].findByType('button').props['aria-pressed']).toBe(true);
 expect(second().props.alt).toContain('오른쪽 가장자리');expect(second().props.style.position).toBe('absolute');
 expect(first().props.style.position).toBeUndefined();expect(second().props.style.visibility).toBe('visible');
 act(()=>figures()[1].findByType('button').props.onClick());
 expect(second().props.style.position).toBeUndefined();expect(second().props.alt).not.toContain('부분 확대:');
 expect(figures()[1].findByType('button').props['aria-pressed']).toBe(false);
 expect(JSON.stringify(view!.toJSON())).toContain('약 600px');
 act(()=>view!.unmount());
});

it('retains image failure fallback and source links while showing a detail',()=>{
 let view:ReactTestRenderer;act(()=>{view=create(<ArtworkComparison study={artworkComparisons[0]}/>);});
 const figure=view!.root.findAllByType('figure')[0];
 act(()=>figure.findByType('button').props.onClick());
 act(()=>figure.findByType('img').props.onError());
 expect(figure.findByType('img').props.style.visibility).toBe('hidden');
 expect(JSON.stringify(figure.findAllByProps({role:'status'}).map(n=>n.children))).toContain('불러오지 못했어요');
 expect(figure.findAllByType('a').some(a=>a.props.href==='/artworks/met-437881.jpg')).toBe(true);
 act(()=>view!.unmount());
});
