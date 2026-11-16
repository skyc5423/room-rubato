import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {it,expect} from 'vitest';
import {ResultObservationBridge} from '../src/components/ResultObservationBridge';
import {tasteLessons} from '../src/lib/taste-lessons';
import {ALL_MASTER_DOMAINS} from '../src/lib/domains-index';
it('provides a working activity route for every domain without reading scores or records',()=>{
 for(const domain of ALL_MASTER_DOMAINS){
  const html=renderToStaticMarkup(<ResultObservationBridge slug={domain.slug}/>);
  const href=html.match(/href="([^"]+)"/)?.[1];expect(href).toBeTruthy();
  const url=new URL(href!,'https://example.test');
  if(url.pathname==='/notes'&&url.searchParams.has('lesson'))expect(tasteLessons.some(l=>l.id===url.searchParams.get('lesson'))).toBe(true);
  else expect(['/notes','/compare/light-and-edges']).toContain(url.pathname);
  expect(html).toContain('내 점수로 예측한 추천이 아닙니다');
 }
});
it('connects literature to line observation and unknown domains to the activity index',()=>{
 expect(renderToStaticMarkup(<ResultObservationBridge slug="literature"/>)).toContain('href="/notes?lesson=rhythm"');
 expect(renderToStaticMarkup(<ResultObservationBridge slug="unknown"/>)).toContain('href="/notes"');
});
