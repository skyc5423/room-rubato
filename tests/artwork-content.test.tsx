import React from 'react';
import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {create,act} from 'react-test-renderer';
import {existsSync,readFileSync} from 'node:fs';
import {artworkStudies} from '../src/lib/artwork-studies';
import {studyPaths,dailyStudyId,getSeoulDay} from '../src/lib/study-paths';
import {tasteLessons} from '../src/lib/taste-lessons';
import {ArtworkStudy} from '../src/components/ArtworkStudy';
import {StudyPaths} from '../src/components/StudyPaths';
import {emptyJournal} from '../src/lib/taste-journal';
describe('curated artwork and learning paths',()=>{
 it('only ships documented CC0 images with source metadata',()=>{
  const manifest=JSON.parse(readFileSync('public/artworks/manifest.json','utf8'));
  expect(artworkStudies).toHaveLength(6);
  for(const work of artworkStudies){
   expect(manifest.find((m:{objectID:number})=>String(m.objectID)===work.id)?.isPublicDomain).toBe(true);
   expect(existsSync(`public${work.image}`)).toBe(true);
   expect(work.license).toBe('CC0');expect(work.sourceUrl).toMatch(/^https:\/\/www.metmuseum.org\//);
   expect(work.alt.length).toBeGreaterThan(30);
  }
 });
 it('covers every lesson without dangling links',()=>{
  const ids=tasteLessons.map(l=>l.id);
  for(const id of ids)expect(artworkStudies.some(w=>w.lessonIds.includes(id))).toBe(true);
  for(const path of studyPaths)for(const id of path.lessonIds)expect(ids).toContain(id);
 });
 it('has institutional provenance and hides interpretation until requested',()=>{
  const html=renderToStaticMarkup(<ArtworkStudy lessonId="light"/>);
  expect(html).toContain('이미지 CC0');expect(html).toContain('The Met 소장품 설명');
  expect(html).not.toContain('Room Rubato의 관찰 제안');
  expect(renderToStaticMarkup(<ArtworkStudy lessonId="missing"/>)).toBe('');
 });
 it('reveals context on request and resets when switching works',()=>{
  const renderer=create(<ArtworkStudy lessonId="light"/>);
  const reveal=renderer.root.findAllByType('button').find(b=>b.props['aria-expanded']===false)!;
  act(()=>reveal.props.onClick());
  expect(JSON.stringify(renderer.toJSON())).toContain('Room Rubato의 관찰 제안');
  const other=renderer.root.findAllByType('button').find(b=>b.props['aria-pressed']===false && b.children.join('')==='물주전자를 든 여인')!;
  act(()=>other.props.onClick());
  expect(JSON.stringify(renderer.toJSON())).not.toContain('Room Rubato의 관찰 제안');
 });
 it('suggests date rotation using Seoul date rather than browser timezone',()=>{
  expect(getSeoulDay(new Date('2026-11-11T14:59:00Z'))).toBe('2026-11-11');
  expect(getSeoulDay(new Date('2026-11-11T15:00:00Z'))).toBe('2026-11-12');
  const ids=['a','b','c'];expect(dailyStudyId(ids,new Date('2026-11-11T14:59:00Z'))).not.toBe(dailyStudyId(ids,new Date('2026-11-11T15:00:00Z')));
  expect(dailyStudyId([],new Date())).toBeUndefined();
 });
 it('provides meaningful path titles and waits for journal hydration',()=>{
  const html=renderToStaticMarkup(<StudyPaths journal={emptyJournal()} onOpen={()=>{}} ready={false}/>);
  expect(html).toContain('빛에서 공간으로');expect(html).toContain('disabled');
 });
});

it('shows source dimensions without claiming display color matches the original',()=>{
 const expected:Record<string,string>={'436535':'73.2 × 93.4 cm','436105':'129.5 × 196.2 cm','436121':'73.7 × 92.7 cm','437853':'91.4 × 122.2 cm','437881':'45.7 × 40.6 cm','45434':'25.7 × 37.9 cm'};
 for(const work of artworkStudies)expect(work.dimensions).toBe(expected[work.id]);
 let view:any;act(()=>{view=create(<ArtworkStudy lessonId="light"/>);});
 const text=JSON.stringify(view.toJSON());expect(text).toContain('미술관 기재 크기');expect(text).toContain('실제 작품과 다를 수');expect(text).not.toContain('원본 색·비율 유지');act(()=>view.unmount());
});
