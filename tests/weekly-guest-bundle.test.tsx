import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import fs from 'node:fs';
import Explore from '@/app/explore/page';
import {artworkComparisons} from '@/lib/artwork-comparisons';
const html=renderToStaticMarkup(<Explore/>);
const section=html.split('<section aria-labelledby="weekly-observation-title"')[1].split('</section>')[0];
it('keeps the first action primary and places the optional bundle after existing groups',()=>{
 expect(html.indexOf('first-visit-title')).toBeLessThan(html.indexOf('weekly-observation-title'));
 expect(html.indexOf('id="read-content"')).toBeLessThan(html.indexOf('weekly-observation-title'));
 expect(section).not.toContain('bg-[#0042AF]');
 expect(section).toContain('한 번에 하나만');
});
it('links exactly three real existing public guest destinations',()=>{
 expect(section.match(/<a /g)).toHaveLength(3);
 for(const path of ['/observe/fibre-weave','/observe/flavor']){expect(section).toContain(`href="${path}"`);expect(fs.existsSync(`src/app${path}/page.tsx`)).toBe(true);}
 expect(section).toContain('href="/compare/light-and-edges"');
 expect(artworkComparisons.some(item=>item.slug==='light-and-edges')).toBe(true);
});
it('uses semantic ordered links with keyboard focus and single-column mobile defaults',()=>{
 expect(section).toContain('<ol class="mt-4 grid gap-4 md:grid-cols-3">');
 expect(section.match(/<li /g)).toHaveLength(3);
 expect(section.match(/min-h-11/g)).toHaveLength(3);
 expect(section.match(/focus-visible:outline-offset-4/g)).toHaveLength(3);
 expect(html.match(/id="weekly-observation-title"/g)).toHaveLength(1);
 expect(section).not.toMatch(/tabindex="-1"|onClick|<button/);
});
it('discloses unsaved reading without scheduled releases, tracking, or account claims',()=>{
 expect(section).toContain('선택이나 완료 기록을 저장하지 않아요');
 expect(section).toContain('브라우저에 북마크');
 expect(section).not.toMatch(/매주|매일|알림|자동|동기화|추천|다음 주/);
 const source=fs.readFileSync('src/app/explore/page.tsx','utf8');
 expect(source).not.toMatch(/localStorage|sessionStorage|supabase|fetch\(|useEffect|useState|analytics/);
});
