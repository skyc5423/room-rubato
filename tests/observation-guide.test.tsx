import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { ObservationGuide } from '../src/components/ObservationGuide';
it('offers optional original prompts with Korean and overseas source-to-claim mapping',()=>{
 const html=renderToStaticMarkup(<ObservationGuide/>);
 expect(html).toContain('<details');expect(html).not.toContain('<details open');
 expect(html).toContain('www.mmca.go.kr');expect(html).toContain('www.getty.edu');
 expect(html).toContain('기관 공동 개발·추천이나 효과 검증을 뜻하지 않습니다');
 expect(html).toContain('차이의 원인이 한 가지라고 단정하지 않습니다');
 expect(html).not.toContain('<iframe');expect(html).not.toContain('<img');
});
