import React from 'react';
import {act,create,ReactTestRenderer} from 'react-test-renderer';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {NotebookReturn} from '../src/components/NotebookReturn';
import {notebookReturn} from '../src/lib/notebook-return';
import {emptyJournal,updateJournal,journalKey} from '../src/lib/taste-journal';
let owner:string|null=null;
let hydrated=true;
let storage:Map<string,string>;
vi.mock('../src/lib/persona-store',()=>({usePersonaStore:()=>({authUser:owner?{userUuid:owner}:null,isHydrated:hydrated})}));
vi.mock('next/link',()=>({default:({children,...props}:React.AnchorHTMLAttributes<HTMLAnchorElement>)=><a {...props}>{children}</a>}));
beforeEach(()=>{owner=null;hydrated=true;storage=new Map();vi.stubGlobal('localStorage',{getItem:(key:string)=>storage.get(key)||null,setItem:vi.fn()});vi.stubGlobal('window',{addEventListener:vi.fn(),removeEventListener:vi.fn()});});
afterEach(()=>vi.unstubAllGlobals());
it('prioritizes latest unfinished, then bookmark, then completed without using response content',()=>{
 let journal=updateJournal(emptyJournal(),'light',1,{before:'a'},'2026-11-10');
 journal=updateJournal(journal,'context',1,{before:'b'},'2026-11-11');
 journal=updateJournal(journal,'rhythm',1,{bookmarked:true,completedAt:'2026-11-12'},'2026-11-12');
 expect(notebookReturn(journal).target?.id).toBe('context');
 delete journal.entries.context;delete journal.entries.light;
 expect(notebookReturn(journal).kind).toBe('bookmark');
 journal.entries.rhythm.bookmarked=false;
 expect(notebookReturn(journal).kind).toBe('revisit');expect(notebookReturn(journal).completed).toBe(1);
});
it('shows original comparison entry without writing any data',()=>{
 let view:ReactTestRenderer;act(()=>{view=create(<NotebookReturn/>);});
 expect(view!.root.findAllByType('a').some(a=>a.props.href==='/compare')).toBe(true);expect(localStorage.setItem).not.toHaveBeenCalled();act(()=>view!.unmount());
});
it('exposes only the current owner progress, never saved memo, and resets on switching',()=>{
 storage.set(journalKey('guest'),JSON.stringify(updateJournal(emptyJournal(),'light',1,{before:'a',memo:'PRIVATE MEMO'})));
 let view:ReactTestRenderer;act(()=>{view=create(<NotebookReturn/>);});
 expect(view!.root.findAllByType('a').some(a=>a.props.href==='/notes?lesson=light')).toBe(true);expect(JSON.stringify(view!.toJSON())).not.toContain('PRIVATE MEMO');
 owner='other';act(()=>view!.update(<NotebookReturn/>));expect(view!.root.findAllByType('a').some(a=>a.props.href==='/notes?lesson=light')).toBe(false);expect(localStorage.setItem).not.toHaveBeenCalled();act(()=>view!.unmount());
});
it('hides progress before hydration and handles unavailable storage',()=>{
 hydrated=false;let view:ReactTestRenderer;act(()=>{view=create(<NotebookReturn/>);});expect(JSON.stringify(view!.toJSON())).toContain('확인하고');
 hydrated=true;vi.stubGlobal('localStorage',{getItem:()=>{throw Error('blocked');}});act(()=>view!.update(<NotebookReturn/>));expect(JSON.stringify(view!.toJSON())).toContain('읽지 못했어요');act(()=>view!.unmount());
});
it('ignores unknown IDs and sorts invalid timestamps behind valid starts',()=>{
 let journal=updateJournal(emptyJournal(),'unknown',1,{before:'a'},'2099-01-01');
 journal=updateJournal(journal,'light',1,{before:'a'},'not-a-date');
 journal=updateJournal(journal,'context',1,{before:'b'},'2026-11-12');
 expect(notebookReturn(journal).target?.id).toBe('context');expect(notebookReturn(journal).completed).toBe(0);
});
it('offers review when all lessons are completed',async()=>{
 const {tasteLessons}=await import('../src/lib/taste-lessons');
 let journal=emptyJournal();for(const lesson of tasteLessons)journal=updateJournal(journal,lesson.id,1,{before:'a',after:'b',completedAt:'2026-11-12'});
 expect(notebookReturn(journal).kind).toBe('revisit');expect(notebookReturn(journal).completed).toBe(8);
});
it('keeps the activity entry without duplicating the integrated artwork comparison CTA',()=>{
 let view:ReactTestRenderer;act(()=>{view=create(<NotebookReturn withArtworkPreview/>);});
 const links=view!.root.findAllByType('a');
 expect(links.some(a=>a.props.href==='/compare')).toBe(false);
 expect(links.filter(a=>a.props.href==='/notes')).toHaveLength(1);
 expect(localStorage.setItem).not.toHaveBeenCalled();act(()=>view!.unmount());
});
