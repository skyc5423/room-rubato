import React from 'react';
import {act,create,ReactTestRenderer} from 'react-test-renderer';
import {renderToStaticMarkup} from 'react-dom/server';
import {it,expect,vi} from 'vitest';
import PageError from '../src/app/error';
import NotFound from '../src/app/not-found';
vi.mock('next/link',()=>({default:({children,...props}:any)=><a {...props}>{children}</a>}));
it('offers Korean missing-page routes rather than a dead end',()=>{
 const html=renderToStaticMarkup(<NotFound/>);
 for(const href of ['/compare','/notes','/'])expect(html).toContain(`href="${href}"`);
 expect(html).toContain('기록을 초기화하지 않습니다');
});
it('only retries on explicit action, focuses the message and keeps exception details private',()=>{
 const reset=vi.fn(),focus=vi.fn(),setItem=vi.fn(),removeItem=vi.fn();
 vi.stubGlobal('localStorage',{setItem,removeItem});vi.stubGlobal('sessionStorage',{setItem,removeItem});
 let view:ReactTestRenderer;act(()=>{view=create(<PageError error={new Error('PRIVATE token and memo')} reset={reset}/>,{createNodeMock:element=>element.type==='h1'?{focus}:null});});
 expect(focus).toHaveBeenCalledTimes(1);expect(reset).not.toHaveBeenCalled();expect(JSON.stringify(view!.toJSON())).not.toContain('PRIVATE');
 act(()=>view!.root.findByType('button').props.onClick());expect(reset).toHaveBeenCalledTimes(1);
 expect(setItem).not.toHaveBeenCalled();expect(removeItem).not.toHaveBeenCalled();act(()=>view!.unmount());vi.unstubAllGlobals();
});
