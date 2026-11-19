import React from 'react';
import {act, create} from 'react-test-renderer';
import {expect, it} from 'vitest';
import {fieldObservations} from '../src/lib/field-observations';
import {tasteLessons} from '../src/lib/taste-lessons';
import {FieldObservation} from '../src/components/FieldObservation';

it('covers exactly the eight current lesson diagrams with four distinct observation prompts',()=>{
 expect(Object.keys(fieldObservations).sort()).toEqual(tasteLessons.map(l=>l.diagram).sort());
 for(const lesson of tasteLessons){
  const prompt=fieldObservations[lesson.diagram];
  expect(new Set([prompt.keep,prompt.change,prompt.evidence,prompt.limit]).size).toBe(4);
  for(const text of Object.values(prompt))expect(text.trim().length).toBeGreaterThan(5);
  expect(Object.values(prompt)).not.toContain(lesson.activity);
 }
});
it.each(tasteLessons.map(l=>[l.id,l] as const))('%s has a closed native disclosure, no input and exact existing source links',(_,lesson)=>{
 let view:any;act(()=>{view=create(<FieldObservation lesson={lesson}/>);});
 try{
  const details=view.root.findByType('details');expect(details.props.open).not.toBe(true);expect(details.props['data-field-observation']).toBe(lesson.id);
  expect(view.root.findByType('summary').children.join('')).toContain('선택 활동');
  expect(view.root.findAllByType('dt').map((x:any)=>x.children.join(''))).toEqual(['유지할 조건','하나만 바꿔보기','관찰할 근거','단정하지 않을 점']);
  expect(view.root.findAllByType('a').map((x:any)=>x.props.href)).toEqual(lesson.sources.map(s=>s.url));
  expect(view.root.findAllByType('input').length+view.root.findAllByType('textarea').length+view.root.findAllByType('button').length).toBe(0);
  expect(JSON.stringify(view.toJSON())).toContain('과학적으로 통제된 실험은 아닙니다');
  expect(JSON.stringify(view.toJSON())).toContain('Room Rubato의 독립 안내');
 }finally{act(()=>view.unmount());}
});
it('includes no-sound participation and avoids increasing light or volume',()=>{
 expect(fieldObservations.syncopation.limit).toContain('소리를 내지 않아도');
 expect(fieldObservations.syncopation.limit).toContain('낮은 볼륨');
 expect(fieldObservations.light.change).toContain('광원을 직접 바라보지');
 expect(fieldObservations.perspective.change).toContain('운전');
});
