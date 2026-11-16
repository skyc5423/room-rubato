import React from 'react';
import {act,create,ReactTestRenderer} from 'react-test-renderer';
import {it,expect,vi,afterEach} from 'vitest';
import {journalKey} from '../src/lib/taste-journal';
vi.mock('next/link',()=>({default:({children,...props}:any)=><a {...props}>{children}</a>}));
vi.hoisted(()=>{process.env.NEXT_PUBLIC_TASTE_CLOUD_SYNC='true';});
vi.mock('../src/lib/persona-store',()=>({usePersonaStore:()=>({authUser:{userUuid:'synthetic'},isHydrated:true})}));
vi.mock('../src/components/TasteJournalCloudSync',()=>({TasteJournalCloudSync:(props:any)=><button data-pending-local={props.hasPendingLocalWrites} data-unverified-local={props.hasUnverifiedLocalSnapshot} data-journal={JSON.stringify(props.journal)} onClick={()=>props.onReplace({version:1,entries:{}})}>synthetic restore</button>}));
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

it('marks failed ordinary inputs as ineligible for new account uploads until explicitly saved',()=>{
 const local=new Map<string,string>(),tab=new Map<string,string>();let fail=false;
 vi.stubGlobal('localStorage',{getItem:(k:string)=>local.get(k)||null,setItem:(k:string,v:string)=>{if(fail)throw Error('quota');local.set(k,v);}});
 vi.stubGlobal('sessionStorage',{getItem:(k:string)=>tab.get(k)||null,setItem:(k:string,v:string)=>tab.set(k,v),removeItem:(k:string)=>tab.delete(k)});
 vi.stubGlobal('window',{addEventListener:vi.fn(),removeEventListener:vi.fn(),confirm:()=>true});
 let view:ReactTestRenderer;act(()=>{view=create(<TasteNotebook initialLesson="light"/>);});
 const cloud=()=>view!.root.findAllByType('button').find(b=>b.children.join('')==='synthetic restore')!;
 const choose=(name:string)=>act(()=>view!.root.findAllByType('button').find(b=>b.children.join('')===name)!.props.onClick());
 expect(cloud().props['data-pending-local']).toBe(false);fail=true;choose('A 쪽');
 expect(cloud().props['data-pending-local']).toBe(true);expect(local.has(journalKey('synthetic'))).toBe(false);
 act(()=>view!.unmount());act(()=>{view=create(<TasteNotebook initialLesson="light"/>);});
 expect(cloud().props['data-pending-local']).toBe(true);fail=false;choose('＋ 다시 볼 단서에 저장');
 expect(cloud().props['data-pending-local']).toBe(false);act(()=>view!.unmount());
});

it.each(['malformed','unreadable','optional'])('does not offer an untrusted %s local fallback for account upload',failure=>{
 const key=journalKey('synthetic');const raw=failure==='optional'?JSON.stringify({version:1,entries:{light:{lessonId:'light',version:1,memo:'',bookmarked:false,beforeSetting:'72',updatedAt:'2026-11-16'}}}):'{broken';const local=new Map([[key,raw]]),tab=new Map<string,string>();let unreadable=failure==='unreadable';
 vi.stubGlobal('localStorage',{getItem:(k:string)=>{if(unreadable&&k===key)throw Error('read denied');return local.get(k)||null;},setItem:(k:string,v:string)=>local.set(k,v)});
 vi.stubGlobal('sessionStorage',{getItem:(k:string)=>tab.get(k)||null,setItem:(k:string,v:string)=>tab.set(k,v),removeItem:(k:string)=>tab.delete(k)});
 vi.stubGlobal('window',{addEventListener:vi.fn(),removeEventListener:vi.fn(),confirm:()=>true});
 let view:ReactTestRenderer;act(()=>{view=create(<TasteNotebook initialLesson="light"/>);});
 const cloud=()=>view!.root.findAllByType('button').find(b=>b.children.join('')==='synthetic restore')!;
 expect(cloud().props['data-pending-local']).toBe(false);expect(cloud().props['data-unverified-local']).toBe(true);
 expect(local.get(key)).toBe(raw);
 unreadable=false;local.set(key,JSON.stringify({version:1,entries:{}}));
 act(()=>view!.root.findAllByType('button').find(b=>b.children.join('')==='A 쪽')!.props.onClick());
 expect(cloud().props['data-unverified-local']).toBe(false);expect(JSON.parse(local.get(key)!).entries.light.before).toBe('a');act(()=>view!.unmount());
});
it('marks malformed external snapshots untrusted, recovers after a valid event and ignores export failures',()=>{
 const key=journalKey('synthetic');const valid=JSON.stringify({version:1,entries:{light:{lessonId:'light',version:1,memo:'saved',bookmarked:false,updatedAt:'2026-11-16'}}});
 const local=new Map([[key,valid]]),tab=new Map<string,string>();
 vi.stubGlobal('localStorage',{getItem:(k:string)=>local.get(k)||null,setItem:(k:string,v:string)=>local.set(k,v)});
 vi.stubGlobal('sessionStorage',{getItem:(k:string)=>tab.get(k)||null,setItem:(k:string,v:string)=>tab.set(k,v),removeItem:(k:string)=>tab.delete(k)});
 vi.stubGlobal('window',{addEventListener:vi.fn(),removeEventListener:vi.fn(),confirm:()=>true});
 let view:ReactTestRenderer;act(()=>{view=create(<TasteNotebook/>);});
 const cloud=()=>view!.root.findAllByType('button').find(b=>b.children.join('')==='synthetic restore')!;
 const sync=vi.mocked(window.addEventListener).mock.calls.find(c=>c[0]==='storage')![1] as (e:StorageEvent)=>void;
 expect(cloud().props['data-unverified-local']).toBe(false);
 local.set(key,'{broken');act(()=>sync({key,newValue:'{broken',storageArea:localStorage} as StorageEvent));
 expect(cloud().props['data-unverified-local']).toBe(true);expect(local.get(key)).toBe('{broken');
 expect(view!.root.findByProps({'aria-label':'읽지 못한 브라우저 원본 기록'}).props.value).toBe('{broken');
 local.set(key,valid);act(()=>sync({key,newValue:valid,storageArea:localStorage} as StorageEvent));
 expect(cloud().props['data-unverified-local']).toBe(false);
 vi.stubGlobal('URL',{createObjectURL:()=>{throw Error('download failed');}});
 act(()=>view!.root.findAllByType('button').find(b=>b.children.join('')==='기록 내보내기')!.props.onClick());
 expect(JSON.stringify(view!.toJSON())).toContain('내보내지 못했어요');expect(cloud().props['data-unverified-local']).toBe(false);act(()=>view!.unmount());
});
it('marks a successful explicit cloud restore trustworthy without weakening its backup guard',()=>{
 const key=journalKey('synthetic');const local=new Map([[key,'{broken']]);
 vi.stubGlobal('localStorage',{getItem:(k:string)=>local.get(k)||null,setItem:(k:string,v:string)=>local.set(k,v)});
 vi.stubGlobal('sessionStorage',{getItem:()=>null,setItem:()=>{},removeItem:()=>{}});
 vi.stubGlobal('window',{addEventListener:vi.fn(),removeEventListener:vi.fn(),confirm:()=>true});
 let view:ReactTestRenderer;act(()=>{view=create(<TasteNotebook/>);});
 const cloud=()=>view!.root.findAllByType('button').find(b=>b.children.join('')==='synthetic restore')!;
 expect(cloud().props['data-unverified-local']).toBe(true);act(()=>cloud().props.onClick());
 expect(cloud().props['data-unverified-local']).toBe(false);expect(local.get(key+':before-cloud-restore')).toBe('{broken');act(()=>view!.unmount());
});

it('pairs trust recovery with the verified journal when resuming a draft after initial read failure',()=>{
 const key=journalKey('synthetic');const base={lessonId:'light',version:1,memo:'committed original',bookmarked:false,before:'a',after:'b',completedAt:'2026-11-16T00:00:00.000Z',updatedAt:'2026-11-16T00:00:00.000Z'};
 const original={version:1,entries:{light:base}},local=new Map([[key,JSON.stringify(original)]]);
 const tab=new Map([['rubato_notebook_draft_v1:synthetic',JSON.stringify({version:1,base,entry:{...base,memo:'draft not uploaded'},stage:2,variation:60})]]);let failRead=true;
 vi.stubGlobal('localStorage',{getItem:(k:string)=>{if(k===key&&failRead)throw Error('temporary read failure');return local.get(k)||null;},setItem:(k:string,v:string)=>local.set(k,v)});
 vi.stubGlobal('sessionStorage',{getItem:(k:string)=>tab.get(k)||null,setItem:(k:string,v:string)=>tab.set(k,v),removeItem:(k:string)=>tab.delete(k)});
 vi.stubGlobal('window',{addEventListener:vi.fn(),removeEventListener:vi.fn(),confirm:()=>true});
 let view:ReactTestRenderer;act(()=>{view=create(<TasteNotebook/>);});const cloud=()=>view!.root.findAllByType('button').find(b=>b.children.join('')==='synthetic restore')!;
 expect(cloud().props['data-unverified-local']).toBe(true);expect(JSON.parse(cloud().props['data-journal']).entries).toEqual({});failRead=false;
 act(()=>view!.root.findAllByType('button').find(b=>b.children.join('')==='임시 수정 이어가기')!.props.onClick());
 expect(cloud().props['data-unverified-local']).toBe(false);expect(JSON.parse(cloud().props['data-journal'])).toEqual(original);
 expect(view!.root.findByProps({id:'observation-memo'}).props.value).toBe('draft not uploaded');expect(local.get(key)).toBe(JSON.stringify(original));act(()=>view!.unmount());
});
it('pairs a successful deletion read with its latest snapshot even when the deletion write fails',()=>{
 const key=journalKey('synthetic');const base={lessonId:'light',version:1,memo:'old visible',bookmarked:false,updatedAt:'2026-11-16'};
 const initial={version:1,entries:{light:base}},local=new Map([[key,JSON.stringify(initial)]]);const tab=new Map<string,string>();let failWrite=false;
 vi.stubGlobal('localStorage',{getItem:(k:string)=>local.get(k)||null,setItem:(k:string,v:string)=>{if(failWrite&&k===key)throw Error('write failed');local.set(k,v);}});
 vi.stubGlobal('sessionStorage',{getItem:(k:string)=>tab.get(k)||null,setItem:(k:string,v:string)=>tab.set(k,v),removeItem:(k:string)=>tab.delete(k)});
 vi.stubGlobal('window',{addEventListener:vi.fn(),removeEventListener:vi.fn(),confirm:()=>true});
 let view:ReactTestRenderer;act(()=>{view=create(<TasteNotebook initialLesson="light"/>);});const cloud=()=>view!.root.findAllByType('button').find(b=>b.children.join('')==='synthetic restore')!;
 const latest={version:1,entries:{light:base,space:{...base,lessonId:'space',memo:'new unrelated record'}}};local.set(key,JSON.stringify(latest));failWrite=true;
 act(()=>view!.root.findAllByType('button').find(b=>b.children.join('')==='이 탐색 기록 지우기')!.props.onClick());
 expect(local.get(key)).toBe(JSON.stringify(latest));expect(cloud().props['data-unverified-local']).toBe(false);
 expect(JSON.parse(cloud().props['data-journal'])).toEqual(latest);expect(JSON.stringify(view!.toJSON())).toContain('기록을 지우지 못했어요');act(()=>view!.unmount());
});
