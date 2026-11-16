import {afterEach,it,expect,vi} from 'vitest';
import {decodePending,encodePending,readPending,retainPending,pendingKey} from '../src/lib/notebook-pending';
import {emptyJournal,updateJournal} from '../src/lib/taste-journal';
afterEach(()=>vi.unstubAllGlobals());
it('preserves explicit clears rather than reviving old answers after serialization',()=>{
 const base=updateJournal(emptyJournal(),'light',1,{before:'a',after:'b',completedAt:'2026-11-16'}).entries.light;
 const writes={light:{base,patch:{before:'b' as const,after:undefined,completedAt:undefined,updatedAt:'2026-11-16'}}};
 expect(decodePending(encodePending(writes))).toEqual(writes);
});
it('retains pending inputs in browser memory when tab storage fails without crossing owners',()=>{
 vi.stubGlobal('window',{});vi.stubGlobal('sessionStorage',{getItem:()=>null,setItem:()=>{throw Error('quota');},removeItem:()=>{throw Error('quota');}});
 const writes={light:{base:undefined,patch:{memo:'not yet stored',updatedAt:'2026-11-16'}}};
 expect(retainPending('a',writes)).toBe(false);expect(readPending('a')).toEqual(writes);expect(readPending('b')).toEqual({});
 retainPending('a',{});expect(readPending('a')).toEqual({});
});
it('keeps an unreadable tab copy intact instead of replacing it',()=>{
 vi.stubGlobal('window',{});const setItem=vi.fn(),removeItem=vi.fn();vi.stubGlobal('sessionStorage',{getItem:()=>'{bad',setItem,removeItem});
 expect(()=>readPending('a')).toThrow();expect(retainPending('a',{})).toBe(false);expect(setItem).not.toHaveBeenCalled();expect(removeItem).not.toHaveBeenCalled();
 expect(pendingKey('a')).not.toBe(pendingKey('b'));
});
