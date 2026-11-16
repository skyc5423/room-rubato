import React from 'react';
import {act,create,type ReactTestRenderer} from 'react-test-renderer';
import {renderToStaticMarkup} from 'react-dom/server';
import {it,expect,vi} from 'vitest';
import {FlavorLanguageStudy} from '../src/components/FlavorLanguageStudy';
import FlavorPage,{metadata} from '../src/app/observe/flavor/page';
import {flavorExamples,flavorSource} from '../src/lib/flavor-language';
import {StudyPaths} from '../src/components/StudyPaths';
import {emptyJournal} from '../src/lib/taste-journal';
vi.mock('next/link',()=>({default:({children,...props}:any)=><a {...props}>{children}</a>}));

it('provides three independently written examples and a single primary concept source',()=>{
 expect(flavorExamples.map(e=>e.label)).toEqual(['고소하다','산뜻하다','알싸하다']);
 expect(new Set(flavorExamples.map(e=>e.sentence)).size).toBe(3);
 expect(flavorSource).toBe('https://www.nidcd.nih.gov/health/taste-disorders');
 for(const example of flavorExamples)for(const key of ['clues','evaluation','alternative','limit'] as const)expect(example[key].length).toBeGreaterThan(20);
});
it('starts with a closed explanation and keeps example controls focused instead of moving focus',()=>{
 let view:ReactTestRenderer;const focus=vi.fn();act(()=>{view=create(<FlavorLanguageStudy/>,{createNodeMock:()=>({focus})});});
 try{
  const firstDetails=view!.root.findByType('details');expect(firstDetails.props.open).not.toBe(true);
  expect(view!.root.findAllByType('button').map(b=>b.props['aria-pressed'])).toEqual([true,false,false]);
  act(()=>view!.root.findAllByType('button')[1].props.onClick());
  expect(view!.root.findAllByType('button').map(b=>b.props['aria-pressed'])).toEqual([false,true,false]);
  expect(view!.root.findByType('details')).not.toBe(firstDetails);
  expect(view!.root.findByType('details').props.open).not.toBe(true);
  expect(view!.root.findByType('details').props['data-flavor-explanation']).toBe('fresh');
  expect(focus).not.toHaveBeenCalled();
  expect(view!.root.findByProps({'aria-live':'polite'}).props['aria-atomic']).toBe('true');
 }finally{act(()=>view!.unmount());}
});
it('does not read or write storage, collect input, or retain selections on a new mount',()=>{
 const storage={getItem:vi.fn(()=>{throw Error('must not read');}),setItem:vi.fn(()=>{throw Error('must not write');}),removeItem:vi.fn()};vi.stubGlobal('localStorage',storage);vi.stubGlobal('sessionStorage',storage);
 let view:ReactTestRenderer|undefined;
 try{
  act(()=>{view=create(<FlavorLanguageStudy/>);});
  for(let index=0;index<3;index++)act(()=>view!.root.findAllByType('button')[index].props.onClick());
  expect(view!.root.findAllByType('input')).toHaveLength(0);expect(view!.root.findAllByType('textarea')).toHaveLength(0);
  act(()=>view!.unmount());act(()=>{view=create(<FlavorLanguageStudy/>);});
  expect(view!.root.findAllByType('button')[0].props['aria-pressed']).toBe(true);
  for(const fn of Object.values(storage))expect(fn).not.toHaveBeenCalled();
 }finally{if(view)act(()=>view!.unmount());vi.unstubAllGlobals();}
});
it('separates basic taste, other sensations and evaluation without a food or health task',()=>{
 const html=renderToStaticMarkup(<FlavorLanguageStudy/>);
 for(const phrase of ['적어도 단맛·신맛·쓴맛·짠맛·감칠맛','향, 식감, 온도','기본맛과 구별','무엇을 먹거나 사거나 냄새 맡을 필요 없이','표준화된 감각 분류가 아니며','공동 개발·추천을 뜻하지','건강 상태를 확인하거나 진단하는 활동이 아닙니다','성격이나 음식 취향을 예측하지'])expect(html).toContain(phrase);
 expect(html).not.toContain('<img');expect(html).not.toContain('<audio');expect(html).not.toContain('<iframe');
});
it('offers a titled standalone page and discoverable index route without changing journal progress',()=>{
 const page=renderToStaticMarkup(<FlavorPage/>);expect(metadata.title).toBe('풍미의 언어 | Room Rubato');expect(page).toContain('풍미의 언어</h1>');expect(page).toContain('href="/notes"');
 const journal=emptyJournal(),original=JSON.stringify(journal);const onOpen=vi.fn();
 const index=renderToStaticMarkup(<StudyPaths journal={journal} ready={false} onOpen={onOpen}/>);
 expect(index).toContain('href="/observe/flavor"');expect(index).toContain('선택과 완료 기록은 저장하지');expect(onOpen).not.toHaveBeenCalled();expect(JSON.stringify(journal)).toBe(original);
});
