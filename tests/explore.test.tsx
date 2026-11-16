import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import ExplorePage,{metadata} from '@/app/explore/page';
import {tasteLessons} from '@/lib/taste-lessons';
import {artworkComparisons} from '@/lib/artwork-comparisons';
const html=()=>renderToStaticMarkup(<ExplorePage/>);
it('indexes every current observation and comparison without duplicating content',()=>{
 const page=html();expect(tasteLessons).toHaveLength(8);
 for(const l of tasteLessons){expect(page).toContain(`href="/notes?lesson=${l.id}"`);expect(page).toContain(l.title);}
 for(const c of artworkComparisons)expect(page).toContain(`href="/compare/${c.slug}"`);
 expect(page.match(/data-explore-destination/g)).toHaveLength(11);expect(page).toContain('href="/observe/flavor"');
});
it('has distinct semantic sections and native jump links',()=>{
 const page=html();expect(metadata.title).toContain('콘텐츠 둘러보기');expect(page.match(/<h1/g)).toHaveLength(1);
 for(const id of ['compare','try','read']){expect(page).toContain(`href="#${id}-content"`);expect(page).toContain(`id="${id}-content"`);expect(page).toContain(`aria-labelledby="${id}-title"`);}
 expect(page).not.toMatch(/<(input|textarea|button)\b/);
});
it('distinguishes optional saved activities from unsaved reading and avoids progress claims',()=>{
 const page=html();expect(page).toContain('별도의 저장 버튼');expect(page).toContain('로그인 없이');expect(page).toContain('저장 없음');expect(page).toContain('모두 마칠 필요도 없어요');expect(page).toContain('href="/privacy"');
});
