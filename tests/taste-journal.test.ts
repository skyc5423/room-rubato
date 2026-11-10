import { describe,it,expect } from 'vitest';
import { emptyJournal,parseJournal,updateJournal,suggestNext,journalKey } from '../src/lib/taste-journal';
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
