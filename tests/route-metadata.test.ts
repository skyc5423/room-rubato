import {expect,it} from 'vitest';
import {generateMetadata as domainMetadata} from '../src/app/domain/[slug]/layout';
import {generateMetadata as comparisonMetadata} from '../src/app/compare/[slug]/page';
it('describes known public content rather than personal answers',async()=>{
 expect(await domainMetadata({params:Promise.resolve({slug:'visual-art'})})).toMatchObject({title:'미술 · 디자인 · 취향 고르기 | Room Rubato'});
 expect(await comparisonMetadata({params:Promise.resolve({slug:'light-and-edges'})})).toMatchObject({title:'빛이 만드는 경계 · 두 작품 사이 | Room Rubato'});
});
it('does not echo unrecognized route input into public metadata',async()=>{
 for(const metadata of [domainMetadata,comparisonMetadata]){
  const value=await metadata({params:Promise.resolve({slug:'private-unknown-value'})});
  expect(JSON.stringify(value)).not.toContain('private-unknown-value');
  expect(value.robots).toEqual({index:false,follow:false});
 }
});
