import React from 'react';
import {act,create} from 'react-test-renderer';
import {expect,it,vi,afterEach} from 'vitest';
const store=vi.hoisted(()=>({currentUserId:'owner-a',state:{marker:'current-private'},recoveryDraft:{marker:'recovery-private'},syncError:'not saved',syncConflict:false,retrySync:vi.fn(),reloadServerProfile:vi.fn(),clearRecoveryDraft:vi.fn()}));
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
