import {describe,it,expect} from 'vitest';
import {notebookDraftKey,parseNotebookDraft,sameDraftBase} from '../src/lib/notebook-draft';
const base={lessonId:'light',version:1,before:'a',after:'b',memo:'original',bookmarked:false,completedAt:'2026-11-12T00:00:00Z',updatedAt:'2026-11-12T00:00:00Z'};
const draft={version:1,base,entry:{...base,memo:'draft'},stage:2,variation:23};
describe('tab notebook draft validation',()=>{
 it('roundtrips a bounded draft and separates owner keys',()=>{expect(parseNotebookDraft(JSON.stringify(draft))).toEqual(draft);expect(notebookDraftKey('guest')).not.toBe(notebookDraftKey('account'));});
 it('rejects malformed, unknown and out of bounds copies',()=>{
  for(const value of [null,'invalid',JSON.stringify({...draft,stage:3}),JSON.stringify({...draft,variation:101}),JSON.stringify({...draft,entry:{...base,lessonId:'unknown'}}),JSON.stringify({...draft,entry:{...base,memo:'a'.repeat(1501)}}),JSON.stringify({...draft,entry:{...base,before:'invalid'}}),JSON.stringify({...draft,entry:{...base,extra:'unexpected'}})])expect(parseNotebookDraft(value)).toBeNull();
 });
 it('never accepts missing or changed saved originals',()=>{const parsed=parseNotebookDraft(JSON.stringify(draft))!;expect(sameDraftBase(undefined,parsed.base)).toBe(false);expect(sameDraftBase({...parsed.base,memo:'new saved'},parsed.base)).toBe(false);expect(sameDraftBase(parsed.base,parsed.base)).toBe(true);});
});
it('preserves bounded artwork identity in draft and rejects invalid identifiers',()=>{
 const value={...draft,base:{...base,artworkId:'437881'},entry:{...base,artworkId:'437853'}};
 expect(parseNotebookDraft(JSON.stringify(value))?.entry.artworkId).toBe('437853');
 expect(parseNotebookDraft(JSON.stringify({...value,entry:{...value.entry,artworkId:'https://external'}}))).toBeNull();
});
