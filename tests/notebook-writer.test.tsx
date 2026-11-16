import React from 'react';
import {act,create,ReactTestRenderer} from 'react-test-renderer';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {useNotebookWriter} from '../src/lib/notebook-writer';
function Probe({owner='guest'}:{owner?:string}){const writer=useNotebookWriter(owner,true);return <button disabled={!writer.canWrite} onClick={writer.retry}>{writer.state}</button>;}
beforeEach(()=>vi.stubGlobal('window',{get navigator(){return navigator;}}));
afterEach(()=>vi.unstubAllGlobals());
it('allows one cooperating writer, releases on unmount, and grants an explicit retry',async()=>{
  const held=new Set<string>();
  vi.stubGlobal('navigator',{locks:{request:async(name:string,_options:unknown,callback:(lock:object|null)=>unknown)=>{if(held.has(name))return callback(null);held.add(name);try{return await callback({});}finally{held.delete(name);}}}});
  let a:ReactTestRenderer,b:ReactTestRenderer;
  await act(async()=>{a=create(<Probe/>);b=create(<Probe/>);});
  expect(a!.root.findByType('button').children).toEqual(['held']);expect(b!.root.findByType('button').props.disabled).toBe(true);
  await act(async()=>a!.unmount());await act(async()=>b!.root.findByType('button').props.onClick());
  expect(b!.root.findByType('button').children).toEqual(['held']);await act(async()=>b!.unmount());expect(held.size).toBe(0);
});
it('fails closed on lock rejection but reports compatibility fallback explicitly',async()=>{
  vi.stubGlobal('navigator',{locks:{request:()=>Promise.reject(Error('denied'))}});
  let view:ReactTestRenderer;await act(async()=>{view=create(<Probe/>);});
  expect(view!.root.findByType('button').children).toEqual(['failed']);expect(view!.root.findByType('button').props.disabled).toBe(true);
  await act(async()=>view!.unmount());vi.stubGlobal('navigator',{});
  await act(async()=>{view=create(<Probe/>);});expect(view!.root.findByType('button').children).toEqual(['unsupported']);await act(async()=>view!.unmount());
});
it('does not retain a delayed lease after unmount or transfer an old owner lease',async()=>{
  const callbacks:Array<(lock:object|null)=>unknown>=[];
  vi.stubGlobal('navigator',{locks:{request:(_n:string,_o:unknown,callback:(lock:object|null)=>unknown)=>{callbacks.push(callback);return Promise.resolve();}}});
  let view:ReactTestRenderer;await act(async()=>{view=create(<Probe/>);});
  expect(view!.root.findByType('button').props.disabled).toBe(true);
  await act(async()=>view!.update(<Probe owner="new-owner"/>));
  expect(callbacks[0]({})).toBeUndefined();expect(view!.root.findByType('button').props.disabled).toBe(true);
  await act(async()=>view!.unmount());expect(callbacks[1]({})).toBeUndefined();
});
