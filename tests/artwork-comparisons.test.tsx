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
  const toggle=view!.root.findByType('button');act(()=>toggle.props.onClick());
  expect(toggle.props['aria-expanded']).toBe(true);
  expect(JSON.stringify(view!.toJSON())).toContain('Room Rubato의 비교 제안');
  expect(view!.root.findAllByType('a').some(a=>a.props.href==='/notes?lesson=light')).toBe(true);
  act(()=>toggle.props.onClick());expect(toggle.props['aria-expanded']).toBe(false);act(()=>view!.unmount());
 });
});

vi.mock('next/link',()=>({default:({children,...props}:React.AnchorHTMLAttributes<HTMLAnchorElement>)=><a {...props}>{children}</a>}));
