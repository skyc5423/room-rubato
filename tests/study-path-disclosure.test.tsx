import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {it,expect} from 'vitest';
import {StudyPaths} from '@/components/StudyPaths';
import {emptyJournal} from '@/lib/taste-journal';
import {studyPaths} from '@/lib/study-paths';
it('keeps optional multi-activity paths available behind a native closed disclosure',()=>{
 const html=renderToStaticMarkup(<StudyPaths journal={emptyJournal()} onOpen={()=>{}} ready/>);
 expect(html).toContain('data-study-path-disclosure');expect(html).toContain('<summary');expect(html).not.toContain('<details open');
 for(const path of studyPaths)expect(html).toContain(path.title);
 const after=html.split('</details>')[1];expect(after).toContain('href="/compare"');expect(after).toContain('href="/observe/flavor"');
});
