import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { ArtworkRevisit } from '../src/components/ArtworkRevisit';
import { ArtworkStudy } from '../src/components/ArtworkStudy';
import { artworkStudies } from '../src/lib/artwork-studies';
let r: ReactTestRenderer;
afterEach(()=>{if(r)act(()=>r.unmount());});
const button=(label:string)=>r.root.findAllByType('button').find(b=>b.children.join('')===label)!;
describe('optional original artwork revisit',()=>{
 it('moves between original questions without writing notes or claiming completion',()=>{
  const memo=vi.fn(), context=vi.fn(), focus=vi.fn();
  act(()=>{r=create(<ArtworkRevisit title="작품" onMemo={memo} onContext={context}/>,{createNodeMock:e=>e.type==='h4'?{focus}:null});});
  act(()=>button('같은 작품 다시 살펴보기').props.onClick());
  expect(r.root.findByType('h4').children.join('')).toContain('두 번째');
  expect(focus).toHaveBeenCalledTimes(1);expect(memo).not.toHaveBeenCalled();expect(context).not.toHaveBeenCalled();
  act(()=>button('기존 관찰 메모로 이동').props.onClick());expect(memo).toHaveBeenCalledTimes(1);
  act(()=>button('작품의 맥락 함께 읽기').props.onClick());expect(context).toHaveBeenCalledTimes(1);
  act(()=>button('첫 질문 다시 보기').props.onClick());expect(r.root.findByType('h4').children.join('')).toContain('첫 번째');
  expect(r.root.findAllByType('textarea')).toHaveLength(0);
 });
 it('resets the guide when switching artwork and opens separately attributed context',()=>{
  act(()=>{r=create(<ArtworkStudy lessonId="light"/>);});
  act(()=>button('같은 작품 다시 살펴보기').props.onClick());
  const works=artworkStudies.filter(w=>w.lessonIds.includes('light'));
  act(()=>button(works[1].titleKo).props.onClick());
  expect(button('같은 작품 다시 살펴보기')).toBeDefined();
  act(()=>button('작품의 맥락 함께 읽기').props.onClick());
  expect(r.root.findAllByType('h5').map(h=>h.children.join(''))).toContain('미술관이 설명하는 맥락');
 });
 it('links education sources and distinguishes them from product efficacy',()=>{
  act(()=>{r=create(<ArtworkRevisit title="작품" onContext={()=>{}}/>);});
  const json=JSON.stringify(r.toJSON());
  expect(json).toContain('activity_post_lookagain.html');expect(json).toContain('non-interpretive-ai');
  expect(json).toContain('재방문 증가는 측정하지');expect(json).toContain('독립적으로 작성');
 });
});
