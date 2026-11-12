import {it,expect} from 'vitest';
import {formatStoredScore,storedSeconds} from '../src/lib/result-display';
it('formats bounded genuine scores without coercing or inventing zeros',()=>{
 for(const value of [null,undefined,'0','0.5',false,NaN,Infinity,-Infinity,-1.01,1.01,{},[]])expect(formatStoredScore(value)).toBe('저장된 점수 확인 불가');
 for(const [value,text] of [[0,'+0.00'],[-1,'-1.00'],[1,'+1.00'],[-0.25,'-0.25']] as const)expect(formatStoredScore(value)).toBe(text);
});
it('formats genuine nonnegative durations without an arbitrary upper cap',()=>{
 for(const value of [null,undefined,'0','2000',false,NaN,Infinity,-1,{},[]])expect(storedSeconds(value)).toBeNull();
 expect(storedSeconds(0)).toBe('0.0');expect(storedSeconds(2100)).toBe('2.1');expect(storedSeconds(3600000)).toBe('3600.0');
});
