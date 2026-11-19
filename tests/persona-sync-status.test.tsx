import React from 'react';
import {act,create} from 'react-test-renderer';
import {expect,it,vi,afterEach} from 'vitest';
const store=vi.hoisted(()=>({currentUserId:'owner-a',isHydrated:true,authUser:null as null|{userUuid:string},guestRecoveryRaw:null as string|null,state:{marker:'current-private'},recoveryDraft:{marker:'recovery-private'},syncError:'not saved',syncConflict:false,retrySync:vi.fn(),reloadServerProfile:vi.fn(),clearRecoveryDraft:vi.fn()}));
vi.mock('../src/lib/persona-store',()=>({usePersonaStore:()=>store}));
import {PersonaSyncStatus} from '../src/components/PersonaSyncStatus';
afterEach(()=>vi.unstubAllGlobals());
it('offers the requested recovery JSON after a download failure without clearing records',()=>{
 vi.stubGlobal('URL',{createObjectURL:()=>{throw Error('blocked');}});let view:any;
 act(()=>{view=create(<PersonaSyncStatus/>);});
 act(()=>view.root.findAllByType('button').find((b:any)=>b.children.includes('이전 미저장 기록 내려받기')).props.onClick());
 expect(view.root.findByType('textarea').props.value).toContain('recovery-private');expect(view.root.findByType('textarea').props.readOnly).toBe(true);expect(store.clearRecoveryDraft).not.toHaveBeenCalled();
 store.currentUserId='owner-b';act(()=>view.update(<PersonaSyncStatus/>));expect(view.root.findAllByType('textarea')).toHaveLength(0);act(()=>view.unmount());store.currentUserId='owner-a';
});

it.each(['{recoverable broken bytes',''])('offers raw guest bytes rather than an empty profile export when loading failed: %s',raw=>{
 store.isHydrated=false;store.guestRecoveryRaw=raw;store.authUser=null;store.retrySync.mockClear();let view:any;
 try{
  act(()=>{view=create(<PersonaSyncStatus/>);});
  expect(view.root.findAllByType('button').some((b:any)=>b.children.includes('현재 기록 내려받기'))).toBe(false);
  expect(view.root.findByProps({'aria-label':'읽지 못한 게스트 원본'}).props.value).toBe(raw);
  expect(view.root.findByProps({'aria-label':'읽지 못한 게스트 원본'}).props.readOnly).toBe(true);
  expect(view.root.findAllByType('details').find((d:any)=>d.findAllByType('textarea').some((t:any)=>t.props['aria-label']==='읽지 못한 게스트 원본')).props.open).not.toBe(true);
  act(()=>view.root.findAllByType('button').find((b:any)=>b.children.includes('다시 시도')).props.onClick());expect(store.retrySync).toHaveBeenCalledTimes(1);
  store.authUser={userUuid:'account-b'};store.isHydrated=true;act(()=>view.update(<PersonaSyncStatus/>));
  expect(view.root.findAllByProps({'aria-label':'읽지 못한 게스트 원본'})).toHaveLength(0);
 }finally{act(()=>view?.unmount());store.isHydrated=true;store.guestRecoveryRaw=null;store.authUser=null;}
});
