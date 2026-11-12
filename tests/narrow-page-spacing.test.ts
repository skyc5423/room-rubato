import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
it('does not reserve a second header-height gap where the header is in normal mobile flow',()=>{
 expect(readFileSync('src/components/Navbar.tsx','utf8')).toContain('relative sm:fixed');
 for(const file of ['src/components/TasteNotebook.tsx','src/components/ArtworkComparison.tsx','src/app/compare/page.tsx','src/app/page.tsx'])expect(readFileSync(file,'utf8')).toContain('pt-6 sm:pt-32');
});

it('keeps survey, daily and summary mobile entry spacing consistent with the in-flow header',()=>{
 for(const file of ['src/app/research/page.tsx','src/app/daily/page.tsx','src/app/domain/[slug]/page.tsx']){const source=readFileSync(file,'utf8');expect(source).toContain('pt-6 sm:pt-28');expect(source).not.toMatch(/(?<!sm:)pt-(28|32)/);}
});
