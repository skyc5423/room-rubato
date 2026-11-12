import {it,expect} from 'vitest';
import {recordedChoice} from '../src/lib/recorded-choice';
it('only shows the latest exact domain/question choice',()=>{
 const a={domainId:1,questionId:'q',chosenOption:'A'};const b={...a,chosenOption:'B'};
 expect(recordedChoice([],1,'q')).toBeNull();expect(recordedChoice([a],1,'q')).toBe('A');expect(recordedChoice([a,b],1,'q')).toBe('B');expect(recordedChoice([b,a],1,'q')).toBe('A');
 expect(recordedChoice([b,{...a,domainId:2},{...a,questionId:'other'}],1,'q')).toBe('B');
 for(const value of ['',null,undefined,'C',false,0])expect(recordedChoice([a,{...a,chosenOption:value}],1,'q')).toBeNull();
 expect(recordedChoice([null,undefined,'bad',{}],1,'q')).toBeNull();
 const log=[a,b];const before=JSON.stringify(log);recordedChoice(log,1,'q');expect(JSON.stringify(log)).toBe(before);
});
