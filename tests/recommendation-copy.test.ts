import {describe,it,expect} from 'vitest';
import {ALL_MASTER_DOMAINS} from '../src/lib/domains-index';
const phenotypes=ALL_MASTER_DOMAINS.flatMap(domain=>domain.phenotypes);
const recommendations=phenotypes.flatMap(p=>[...p.decisionGuide,...p.curations.map(c=>c.reason)]).join('\n');
const curation=(id:string)=>phenotypes.flatMap(p=>p.curations).find(c=>c.id===id)!;
describe('calibrated recommendation copy',()=>{
 it('does not restore the reviewed guarantees or invented quantitative benefits',()=>{
  for(const claim of ['실패가 없습니다','실패 없는','고소함을 2배','가치가 떨어지지 않는','완벽한 사후 보증','보증·수선 프로그램이 완벽','흔들림 없이 장기 보유','안전한 기반 위에 미래 혁신 산업의 높은 성장률','무조건 종이','피로도가 확','무조건 햇볕','완벽한 휴식이 완성','완벽한 리듬이 만들어','하루 3시간 이상 확보','언제 누구와 함께해도','직관이 최고의 만족'])expect(recommendations).not.toContain(claim);
 });
 it('distinguishes the two named Fritz blends without claiming acidity is absent',()=>{
  const reason=curation('cur-gas-12').reason;
  expect(reason).toContain('올드독을 낮은 톤의 산미');expect(reason).toContain('서울시네마를 밝은 산미');expect(reason).toContain('제품별 카카오 함량');expect(reason).not.toContain('산미 없이');
 });
 it('retains concrete observation content while separating finance from suitability claims',()=>{
  expect(curation('cur-eco-3').reason).toContain('손실 위험');
  expect(curation('cur-eco-4').reason).toContain('가치 보존은 보장되지 않습니다');
  expect(curation('cur-fas-1').reason).toContain('어깨선, 바지 기장');
  expect(recommendations).toContain('카카오 함량 70~80%');
  expect(recommendations).toContain('복선과 사건 전개');
 });
 it('removes the two reviewed work/relationship character judgments',()=>{
  const text=phenotypes.map(p=>p.deepAnalysis).join('\n');
  expect(text).not.toContain('압도적인 집중력을 발휘합니다');
  expect(text).not.toContain('그 누구보다 깊은 경청');
  expect(text).toContain('경청 능력을 판단할 수는 없어요');
 });
});
