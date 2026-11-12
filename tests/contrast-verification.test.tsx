import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {it,expect} from 'vitest';
import {TasteStudyDiagram,CONTRAST_CENTER_COLOR} from '../src/components/TasteStudyDiagram';
it('keeps both center colors identical while neutralizing only backgrounds',()=>{
 const render=(neutralBackground:boolean)=>renderToStaticMarkup(<TasteStudyDiagram kind="contrast" variation={23} labels={['밝은 배경','어두운 배경']} neutralBackground={neutralBackground}/>);
 const normal=render(false),neutral=render(true);
 expect(normal.match(new RegExp(`fill="${CONTRAST_CENTER_COLOR}"`,'g'))).toHaveLength(2);
 expect(neutral.match(new RegExp(`fill="${CONTRAST_CENTER_COLOR}"`,'g'))).toHaveLength(2);
 expect(neutral.match(/fill="#d9d9d9"/g)).toHaveLength(2);expect(normal).not.toContain('fill="#d9d9d9"');
 expect(neutral).toContain('같은 회색으로 가린 확인 보기');expect(neutral).not.toContain('밝은 배경');expect(neutral).not.toContain('어두운 배경');expect(normal).toContain('배경 명도 설정은 23');
});
