import { describe,it,expect } from 'vitest';
import { emptyJournal,parseJournal,parseJournalForWrite,updateJournal,suggestNext,journalKey } from '../src/lib/taste-journal';
import { tasteLessons } from '../src/lib/taste-lessons';
describe('taste journal',()=>{
  it('recovers invalid storage and rejects malformed records',()=>{
    expect(parseJournal('not-json')).toEqual(emptyJournal());
    expect(parseJournal(JSON.stringify({version:1,entries:{bad:{memo:1}}}))).toEqual(emptyJournal());
  });
  it('keeps prior entries while updating a lesson',()=>{
    const first=updateJournal(emptyJournal(),'light',1,{before:'a',memo:'hello'});
    const second=updateJournal(first,'space',1,{before:'b'});
    expect(second.entries.light.memo).toBe('hello');expect(first.entries.space).toBeUndefined();
    expect(journalKey('user-a')).not.toBe(journalKey('guest'));
  });
  it('suggests unfinished concepts without a daily streak penalty',()=>{
    const journal=updateJournal(emptyJournal(),'light',1,{completedAt:'2020-01-01'});
    expect(suggestNext(['light','space'],journal)).toBe('space');
  });
  it('every experience has a source, interpretation limit and valid related path',()=>{
    expect(new Set(tasteLessons.map(n=>n.id)).size).toBe(tasteLessons.length);
    for(const lesson of tasteLessons){
      expect(lesson.sources.length).toBeGreaterThan(0);expect(lesson.distinction.length).toBeGreaterThan(30);
      for(const source of lesson.sources)expect(source.url).toMatch(/^https:\/\//);
      for(const id of lesson.related)expect(tasteLessons.some(n=>n.id===id)).toBe(true);
    }
  });
});

describe('local diagram setting validation',()=>{
  it.each([{},[],null,'60',-1,101,true])('ignores invalid setting %j without inventing a saved value',value=>{
    const raw=JSON.stringify({version:1,entries:{light:{lessonId:'light',version:1,memo:'keep',bookmarked:true,before:'a',after:'b',beforeSetting:value,afterSetting:value,updatedAt:'2026-11-16T00:00:00Z'}}});
    const entry=parseJournal(raw).entries.light;
    expect(entry.beforeSetting).toBeUndefined();expect(entry.afterSetting).toBeUndefined();
    expect(entry.memo).toBe('keep');expect(entry.before).toBe('a');expect(entry.after).toBe('b');expect(entry.bookmarked).toBe(true);
  });
  it.each([0,0.5,60,100])('retains valid numeric setting %s exactly',value=>{
    const entry=parseJournal(JSON.stringify({version:1,entries:{light:{lessonId:'light',version:1,memo:'',bookmarked:false,beforeSetting:value,afterSetting:value,updatedAt:'2026-11-16T00:00:00Z'}}})).entries.light;
    expect(entry.beforeSetting).toBe(value);expect(entry.afterSetting).toBe(value);
  });
});

it('rejects unreadable mutation bases instead of converting them to an empty write',async()=>{
 const {parseJournalForWrite}=await import('../src/lib/taste-journal');
 for(const raw of ['', '{', 'null','[]','{"version":2,"entries":{}}','{"version":1,"entries":[]}','{"version":1,"entries":{"x":{"memo":"keep"}}}'])expect(()=>parseJournalForWrite(raw)).toThrow();
 expect(parseJournalForWrite(null)).toEqual(emptyJournal());
 const journal=updateJournal(emptyJournal(),'light',1,{memo:'intact'});
 expect(parseJournalForWrite(JSON.stringify(journal))).toEqual(parseJournal(JSON.stringify(journal)));
});

describe('lossless mutation-base optional fields',()=>{
  it.each([
    {before:'future-choice'},{before:null},{before:1},{after:{}},{after:'invalid'},
    {beforeSetting:'72'},{beforeSetting:null},{beforeSetting:{}},{beforeSetting:-1},
    {afterSetting:[]},{afterSetting:true},{afterSetting:101},
    {bookmarked:'true'},{bookmarked:'false'},{bookmarked:0},{bookmarked:null},{bookmarked:{}},
  ])('refuses an unrelated write rather than normalizing stored values: %j',patch=>{
    const original=JSON.stringify({version:1,entries:{light:{lessonId:'light',version:1,memo:'recoverable memo',bookmarked:true,before:'a',after:'b',beforeSetting:0,afterSetting:100,updatedAt:'2026-11-16',...patch}}});
    let stored=original;
    expect(()=>{const base=parseJournalForWrite(stored);stored=JSON.stringify(updateJournal(base,'space',1,{memo:'unrelated edit'}));}).toThrow();
    expect(stored).toBe(original);
    // Read-only display remains intentionally tolerant and can show the memo.
    expect(parseJournal(original).entries.light.memo).toBe('recoverable memo');
  });
  it.each(['a','b','both','unsure'] as const)('preserves valid optional choice %s and numeric boundaries',choice=>{
    const entry={lessonId:'light',version:1,memo:'valid',bookmarked:true,before:choice,after:choice,beforeSetting:0,afterSetting:100,updatedAt:'2026-11-16'};
    const parsed=parseJournalForWrite(JSON.stringify({version:1,entries:{light:entry}}));
    expect(JSON.parse(JSON.stringify(parsed.entries.light))).toEqual(entry);
    expect(updateJournal(parsed,'space',1,{memo:'unrelated'}).entries.light).toEqual(parsed.entries.light);
  });
  it('allows a legacy missing bookmark and absent optional values without dropping recorded fields',()=>{
    const entry={lessonId:'light',version:1,memo:'legacy',updatedAt:'2026-11-16'};
    const parsed=parseJournalForWrite(JSON.stringify({version:1,entries:{light:entry}}));
    expect(JSON.parse(JSON.stringify(parsed.entries.light))).toEqual({...entry,bookmarked:false});
  });
  it.each([false,true])('preserves explicit boolean bookmark %s',bookmarked=>{
    const entry={lessonId:'light',version:1,memo:'valid',bookmarked,updatedAt:'2026-11-16'};
    expect(parseJournalForWrite(JSON.stringify({version:1,entries:{light:entry}})).entries.light.bookmarked).toBe(bookmarked);
  });
});
