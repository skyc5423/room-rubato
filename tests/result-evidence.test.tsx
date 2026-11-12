import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {it,expect} from 'vitest';
import {recordedAxisScore,summarizeRecordedAxes} from '../src/lib/result-evidence';
import {ResultEvidence} from '../src/components/ResultEvidence';
const axes=[{axisKey:'first',leftLabel:'단순한 구성',rightLabel:'복잡한 구성'},{axisKey:'second',leftLabel:'익숙한 소재',rightLabel:'새로운 소재'},{axisKey:'third',leftLabel:'부드러운 대비',rightLabel:'강한 대비'}];
it('summarizes only the two strongest recorded directions with deterministic ties',()=>{
 const scores={first:-0.8,second:0.8,third:0.2};const copy=JSON.stringify(scores);
 const result=summarizeRecordedAxes(axes,scores);
 expect(result).toContain('‘단순한 구성’, ‘새로운 소재’');expect(result).not.toContain('‘강한 대비’');expect(result).not.toContain('일관되게');expect(JSON.stringify(scores)).toBe(copy);
 expect(summarizeRecordedAxes(axes,{first:0.8,second:-0.8,third:0})).toContain('‘복잡한 구성’, ‘익숙한 소재’');
});
it('handles balanced, partial and missing scores without prototype fabrication',()=>{
 expect(summarizeRecordedAxes(axes,{first:0,second:0,third:0})).toContain('모두 가운데');
 expect(summarizeRecordedAxes(axes,{first:0.4})).toContain('점수가 없는 축');
 for(const invalid of [undefined,null,{}, {first:NaN,second:Infinity,third:'1'}, {first:2,second:-2}]) expect(summarizeRecordedAxes(axes,invalid)).toContain('요약할 수 없어요');
 expect(recordedAxisScore({first:-1},'first')).toBe(-1);expect(recordedAxisScore({first:1},'first')).toBe(1);
});
it('separates economy questionnaire labels from investment suitability or advice',()=>{
 const text=renderToStaticMarkup(<ResultEvidence domain={{axes,slug:'economy'}} scores={{first:0.2}}/>);
 expect(text).toContain('투자 적합성·위험성향 평가나 투자 권유가 아닙니다');expect(text).toContain('실제 성격이나 능력을 검증한 결과는 아닙니다');
});
