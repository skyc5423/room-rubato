import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import fs from 'node:fs';
import Explore from '@/app/explore/page';
import Fibre from '@/app/observe/fibre-weave/page';
import Flavor from '@/app/observe/flavor/page';
import {tasteLessons} from '@/lib/taste-lessons';
it('offers one named first activity before the full catalogue without claiming completion',()=>{
 const html=renderToStaticMarkup(<Explore/>);
 expect(html.indexOf('first-visit-title')).toBeLessThan(html.indexOf('aria-label="콘텐츠 종류"'));
 expect(html).toContain('href="/notes?lesson=light"');expect(html).toContain('로그인 없이');
 expect(html).toContain('활동이 완료되거나 계정에 저장되지는 않아요');
 expect(html.match(/<h1/g)).toHaveLength(1);
});
it.each([[Fibre,'contrast'],[Flavor,'context']] as const)('links unsaved reading to a real optional guest activity', (Page,id)=>{
 const html=renderToStaticMarkup(<Page/>);expect(tasteLessons.some(l=>l.id===id)).toBe(true);
 expect(html).toContain(`href="/notes?lesson=${id}"`);expect(html).toContain('aria-labelledby="next-activity-title"');
 expect(html).toContain('지금 읽은 내용은 완료 기록으로 저장되지 않으며');expect(html).toContain('로그인 없이');
 expect(html.match(/id="next-activity-title"/g)).toHaveLength(1);
});
it('uses native accessible links and responsive sizing, with no new state, storage, auth or tracking',()=>{
 for(const path of ['src/app/explore/page.tsx','src/app/observe/fibre-weave/page.tsx','src/app/observe/flavor/page.tsx']){
  const source=fs.readFileSync(path,'utf8');expect(source).toContain('min-h-12');expect(source).toContain('focus-visible:outline');expect(source).toContain('sm:p-6');
  expect(source).not.toMatch(/localStorage|sessionStorage|supabase|fetch\(|onClick|useEffect|useState|analytics|tracking/);
 }
});
