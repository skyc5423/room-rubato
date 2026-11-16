import { expect, it } from 'vitest';
import { dailyChoice, latestDailyRecord } from '../src/lib/daily-record';
const stamp='2026-11-16T01:00:00Z';
it('selects the latest matching record without falling back past malformed choices',()=>{
 const valid={timestamp:stamp,pulseId:'one',phase1Choice:'A',phase2ChoiceAfterSocialProof:'B',phase1ResponseTimeMs:0};
 expect(latestDailyRecord([valid],'one','2026-11-16')).toEqual({timestamp:stamp,phase1Choice:'A',phase2ChoiceAfterSocialProof:'B',phase1ResponseTimeMs:0});
 const log=[valid,{...valid,phase1Choice:null},null]; const before=JSON.stringify(log);
 expect(latestDailyRecord(log,'one','2026-11-16')?.phase1Choice).toBeNull();expect(JSON.stringify(log)).toBe(before);
});
it('ignores non-records and unidentifiable dates without throwing or coercion',()=>{
 const malformed=[null,0,false,'text',[],{}, {pulseId:'one',timestamp:null},{pulseId:'one',timestamp:{}},{pulseId:'one',timestamp:0},{pulseId:'one',timestamp:'bad'}];
 expect(latestDailyRecord(malformed,'one','2026-11-16')).toBeNull();
 expect(latestDailyRecord([{timestamp:stamp,pulseId:'two'}],'one','2026-11-16')).toBeNull();
 expect(latestDailyRecord([{timestamp:stamp,pulseId:'one'}],'one','2026-11-17')).toBeNull();
});
it('validates exact recorded choices only',()=>{
 for(const value of [null,undefined,'a','B ',true,1,{},[]])expect(dailyChoice(value)).toBeNull();
 expect(dailyChoice('A')).toBe('A');expect(dailyChoice('B')).toBe('B');
});
