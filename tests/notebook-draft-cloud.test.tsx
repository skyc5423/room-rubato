import React from 'react';
import {act,create,ReactTestRenderer} from 'react-test-renderer';
import {it,expect,vi,afterEach} from 'vitest';
import {journalKey} from '../src/lib/taste-journal';
vi.mock('next/link',()=>({default:({children,...props}:any)=><a {...props}>{children}</a>}));
vi.hoisted(()=>{process.env.NEXT_PUBLIC_TASTE_CLOUD_SYNC='true';});
vi.mock('../src/lib/persona-store',()=>({usePersonaStore:()=>({authUser:{userUuid:'synthetic'},isHydrated:true})}));
vi.mock('../src/components/TasteJournalCloudSync',()=>({TasteJournalCloudSync:(props:any)=><button onClick={()=>props.onReplace({version:1,entries:{}})}>synthetic restore</button>}));
import {TasteNotebook} from '../src/components/TasteNotebook';
afterEach(()=>vi.unstubAllGlobals());
it.each(['backup','journal'])('preserves unsaved edit and recovery copy if cloud %s write fails',failure=>{
 const raw=JSON.stringify({version:1,entries:{light:{lessonId:'light',version:1,before:'a',after:'b',memo:'original',completedAt:'2026-11-12',updatedAt:'2026-11-12'}}});
 const local=new Map([[journalKey('synthetic'),raw]]),tab=new Map<string,string>();
 vi.stubGlobal('localStorage',{getItem:(k:string)=>local.get(k)||null,setItem:(k:string,v:string)=>{if(failure==='backup'?k.endsWith(':before-cloud-restore'):k===journalKey('synthetic'))throw Error('synthetic quota');local.set(k,v);}});
 vi.stubGlobal('sessionStorage',{getItem:(k:string)=>tab.get(k)||null,setItem:(k:string,v:string)=>tab.set(k,v),removeItem:(k:string)=>tab.delete(k)});
 vi.stubGlobal('window',{addEventListener:vi.fn(),removeEventListener:vi.fn(),confirm:()=>true});
 let view:ReactTestRenderer;act(()=>{view=create(<TasteNotebook initialLesson="light"/>);});
 const click=(label:string)=>act(()=>view!.root.findAllByType('button').find(b=>JSON.stringify(b.children).includes(label))!.props.onClick());
 click('현재 기록 편집하기');act(()=>view!.root.findByType('textarea').props.onChange({target:{value:'keep draft'}}));
 click('synthetic restore');
 expect(view!.root.findByType('textarea').props.value).toBe('keep draft');expect(local.get(journalKey('synthetic'))).toBe(raw);expect([...tab.values()].join()).toContain('keep draft');
 expect(JSON.stringify(view!.toJSON())).toContain('불러오기를 중단');act(()=>view!.unmount());
});
it.each([false,true])('backs up the latest stored bytes and stops on read failure (%s)',failRead=>{
 const key=journalKey('synthetic');const local=new Map<string,string>();let readFails=false;
 vi.stubGlobal('localStorage',{getItem:(k:string)=>{if(readFails&&k===key)throw Error('unavailable');return local.get(k)||null;},setItem:(k:string,v:string)=>local.set(k,v)});
 vi.stubGlobal('sessionStorage',{getItem:()=>null});vi.stubGlobal('window',{addEventListener:vi.fn(),removeEventListener:vi.fn(),confirm:()=>true});
 let view:ReactTestRenderer;act(()=>{view=create(<TasteNotebook/>);});
 const latest=JSON.stringify({version:1,entries:{light:{lessonId:'light',version:1,memo:'new external record',bookmarked:false,updatedAt:'now'}}});local.set(key,latest);readFails=failRead;
 act(()=>view!.root.findAllByType('button').find(b=>JSON.stringify(b.children).includes('synthetic restore'))!.props.onClick());
 if(failRead){expect(local.get(key)).toBe(latest);expect(local.has(`${key}:before-cloud-restore`)).toBe(false);}else{expect(local.get(`${key}:before-cloud-restore`)).toBe(latest);expect(local.get(key)).toBe(JSON.stringify({version:1,entries:{}}));}
 act(()=>view!.unmount());
});
