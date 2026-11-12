import React from 'react';
import {act,create,ReactTestRenderer} from 'react-test-renderer';
import {renderToStaticMarkup} from 'react-dom/server';
import {it,expect,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {CinemaSequenceStudy,CinemaSceneDrawing,cinemaSequences,cinemaScenes} from '../src/components/CinemaSequenceStudy';
it('uses the exact same drawings and image counts, changing only order',()=>{
 expect(cinemaSequences.A).toEqual(['door','cup','door','chair']);expect(cinemaSequences.B).toEqual(['door','cup','chair','door']);expect([...cinemaSequences.A].sort()).toEqual([...cinemaSequences.B].sort());
 for(const scene of ['door','cup','chair'] as const){expect(renderToStaticMarkup(<CinemaSceneDrawing scene={scene}/>)).toContain(cinemaScenes[scene].description);}
});
it('manually advances both sequences, supports previous and repeated reset, and announces exact scenes',()=>{
 let view:ReactTestRenderer;act(()=>{view=create(<CinemaSequenceStudy/>);});
 const button=(label:string)=>view!.root.findAllByType('button').find(b=>b.children.join('')===label)!;
 const click=(label:string)=>act(()=>button(label).props.onClick());
 expect(view!.root.findAllByType(CinemaSceneDrawing).map(node=>node.props)).toEqual([{scene:'door'},{scene:'door'}]);
 expect(button('이전 컷').props.disabled).toBe(true);expect(view!.root.findByProps({role:'status'}).children.join('')).toContain('1/4');
 click('다음 컷');click('다음 컷');expect(view!.root.findAllByType(CinemaSceneDrawing).map(node=>node.props)).toEqual([{scene:'door'},{scene:'chair'}]);expect(view!.root.findByProps({role:'status'}).children.join('')).toBe('3/4 · A는 닫힌 문, B는 빈 의자입니다.');
 click('다음 컷');expect(button('다음 컷').props.disabled).toBe(true);expect(view!.root.findByProps({role:'status'}).children.join('')).toBe('4/4 · A는 빈 의자, B는 닫힌 문입니다.');
 click('이전 컷');expect(view!.root.findByProps({role:'status'}).children.join('')).toContain('3/4');click('처음부터 보기');click('처음부터 보기');expect(view!.root.findByProps({role:'status'}).children.join('')).toContain('1/4');
 for(const sequence of ['A','B'])expect(view!.root.findByProps({'aria-label':`${sequence} 전체 순서`}).findAllByType('li')).toHaveLength(4);
 expect(view!.root.findAllByProps({'aria-current':'step'})).toHaveLength(2);act(()=>view!.unmount());
});
it('has no autoplay, media, persistence or input and preserves source/interpretation boundaries',()=>{
 const storage={setItem:vi.fn(),removeItem:vi.fn()};vi.stubGlobal('localStorage',storage);vi.stubGlobal('sessionStorage',storage);vi.useFakeTimers();
 let view:ReactTestRenderer;act(()=>{view=create(<CinemaSequenceStudy/>);});
 for(const tag of ['img','video','audio','input','textarea'] as const)expect(view!.root.findAllByType(tag)).toHaveLength(0);
 act(()=>view!.root.findAllByType('button')[1].props.onClick());expect(storage.setItem).not.toHaveBeenCalled();expect(storage.removeItem).not.toHaveBeenCalled();expect(vi.getTimerCount()).toBe(0);
 const text=JSON.stringify(view!.toJSON());for(const phrase of ['반복 하나의 효과만','시간은 직접 정하므로','조작은 기록되지','특정 영상의 분석을 요약','공동 개발·추천을 뜻하지'])expect(text).toContain(phrase);
 expect(view!.root.findAllByType('a').map(a=>a.props.href)).toEqual(['https://www.bfi.org.uk/sight-and-sound/interviews/wong-kar-wai-mood-love-25','https://vimeo.com/channels/everyframeapainting/']);
 const source=readFileSync('src/components/CinemaSequenceStudy.tsx','utf8');expect(source).not.toMatch(/autoFocus|\.focus\(|setTimeout|setInterval|animate-|transition-/);
 expect(readFileSync('src/components/TasteNotebook.tsx','utf8')).toContain("lesson.id==='context'&&<CinemaSequenceStudy");act(()=>view!.unmount());vi.useRealTimers();vi.unstubAllGlobals();
});
