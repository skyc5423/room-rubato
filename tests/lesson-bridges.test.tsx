import React from 'react';
import {act,create,ReactTestRenderer} from 'react-test-renderer';
import {expect,it,vi} from 'vitest';
import {LessonBridges} from '../src/components/LessonBridges';
import {lessonBridges} from '../src/lib/lesson-bridges';
import {tasteLessons} from '../src/lib/taste-lessons';

it('covers exactly every existing directed related edge with an original comparison and question',()=>{
 expect(Object.keys(lessonBridges).sort()).toEqual(tasteLessons.map(l=>l.id).sort());
 for(const lesson of tasteLessons){
  const bridges=lessonBridges[lesson.id];
  expect(bridges.map(b=>b.to).sort()).toEqual([...lesson.related].sort());
  expect(new Set(bridges.map(b=>b.to)).size).toBe(bridges.length);
  for(const bridge of bridges){
   expect(tasteLessons.some(l=>l.id===bridge.to)).toBe(true);
   expect(bridge.to).not.toBe(lesson.id);
   expect(bridge.connection.length).toBeGreaterThan(20);
   expect(bridge.question).toMatch(/\?$/);
  }
 }
});
for(const lesson of tasteLessons)it(`offers free choice and exact existing destinations from ${lesson.id}`,()=>{
 const open=vi.fn();let view:ReactTestRenderer;
 act(()=>{view=create(<LessonBridges lesson={lesson} onOpen={open}/>);});
 expect(open).not.toHaveBeenCalled();
 expect(JSON.stringify(view!.toJSON())).toContain('순서대로 할 필요는 없어요');
 const buttons=view!.root.findAllByType('button');
 expect(buttons).toHaveLength(lesson.related.length);
 buttons.forEach((button,index)=>{
  const next=tasteLessons.find(l=>l.id===lesson.related[index]);
  expect(button.props.disabled).not.toBe(true);
  expect(JSON.stringify(button.children)).toContain(next!.title);
  act(()=>button.props.onClick());expect(open).toHaveBeenLastCalledWith(next);
 });
 act(()=>view!.unmount());
});
