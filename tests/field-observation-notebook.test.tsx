import React from 'react';
import {act,create,type ReactTestRenderer} from 'react-test-renderer';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {TasteNotebook} from '../src/components/TasteNotebook';
import {FieldObservation} from '../src/components/FieldObservation';
import {emptyJournal,journalKey,updateJournal} from '../src/lib/taste-journal';
vi.mock('next/link',()=>({default:({children,...props}:any)=><a {...props}>{children}</a>}));
let owner:string|null=null;
vi.mock('../src/lib/persona-store',()=>({usePersonaStore:()=>({authUser:owner?{userUuid:owner}:null,isHydrated:true})}));
let storage:Map<string,string>,tabStorage:Map<string,string>,view:ReactTestRenderer;
const button=(label:string)=>view.root.findAllByType('button').find(b=>JSON.stringify(b.children).includes(label))!;
const seed=(who:string,complete:boolean)=>storage.set(journalKey(who),JSON.stringify(updateJournal(emptyJournal(),'light',1,{before:'a',after:'b',memo:'Synthetic preserved original',...(complete?{completedAt:'2026-11-16T12:00:00Z'}:{})})));
beforeEach(()=>{owner=null;storage=new Map();tabStorage=new Map();vi.stubGlobal('localStorage',{getItem:(k:string)=>storage.get(k)??null,setItem:(k:string,v:string)=>storage.set(k,v),removeItem:(k:string)=>storage.delete(k)});vi.stubGlobal('sessionStorage',{getItem:(k:string)=>tabStorage.get(k)??null,setItem:(k:string,v:string)=>tabStorage.set(k,v),removeItem:(k:string)=>tabStorage.delete(k)});vi.stubGlobal('window',{addEventListener:vi.fn(),removeEventListener:vi.fn()});});
afterEach(()=>{if(view)act(()=>view.unmount());vi.unstubAllGlobals();});
it('offers the optional card only for completed read-only records without writing bytes',()=>{
 seed('guest',true);const original=storage.get(journalKey('guest'));act(()=>{view=create(<TasteNotebook initialLesson="light"/>);});
 expect(view.root.findAllByType(FieldObservation)).toHaveLength(1);
 expect(storage.get(journalKey('guest'))).toBe(original);
 act(()=>button('현재 기록 편집하기').props.onClick());expect(view.root.findAllByType(FieldObservation)).toHaveLength(0);
 act(()=>button('수정 취소').props.onClick());expect(view.root.findAllByType(FieldObservation)).toHaveLength(1);expect(storage.get(journalKey('guest'))).toBe(original);
});
it('does not offer the card for an unfinished record',()=>{
 seed('guest',false);const original=storage.get(journalKey('guest'));act(()=>{view=create(<TasteNotebook initialLesson="light"/>);});
 expect(view.root.findAllByType(FieldObservation)).toHaveLength(0);expect(storage.get(journalKey('guest'))).toBe(original);
});
it('does not carry a completed guest card into an empty account',()=>{
 seed('guest',true);const original=storage.get(journalKey('guest'));act(()=>{view=create(<TasteNotebook initialLesson="light"/>);});expect(view.root.findAllByType(FieldObservation)).toHaveLength(1);
 owner='other-synthetic-owner';act(()=>view.update(<TasteNotebook initialLesson="light"/>));expect(view.root.findAllByType(FieldObservation)).toHaveLength(0);expect(storage.get(journalKey('guest'))).toBe(original);
});
