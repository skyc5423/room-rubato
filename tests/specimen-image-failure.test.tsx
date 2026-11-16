import React from 'react';
import {act,create,type ReactTestRenderer} from 'react-test-renderer';
import {expect,it} from 'vitest';
import {SpecimenPlate} from '../src/components/SpecimenPlate';
it('does not silently replace a missing choice illustration with an unrelated room object',()=>{
 let view:ReactTestRenderer;act(()=>{view=create(<SpecimenPlate variant="A" domainId={1} questionId="fas-q1" visualTone="설명"/>);});
 const target={dataset:{},src:'/artwork/options/fas-q1-A.jpg'};
 act(()=>view!.root.findByType('img').props.onError({currentTarget:target}));
 expect(target.src).toBe('/artwork/options/fas-q1-A.jpg');
 expect(view!.root.findAllByType('img')).toHaveLength(0);
 expect(view!.root.findByProps({role:'status'}).children.join('')).toContain('선택지 A 이미지를 불러오지 못했어요');
 act(()=>view!.update(<SpecimenPlate variant="A" domainId={1} questionId="fas-q2" visualTone="새 설명"/>));
 expect(view!.root.findByType('img').props.src).toContain('fas-q2-A.jpg');act(()=>view!.unmount());
});
