import type {TasteJournal} from './taste-journal';
import {tasteLessons} from './taste-lessons';
/** Deterministic navigation from the user's own saved progress, never a trait prediction. */
export function notebookReturn(journal:TasteJournal) {
 const saved=tasteLessons.flatMap(lesson=>{
  const entry=journal.entries[lesson.id];
  return entry?[{lesson,entry}]:[];
 }).sort((a,b)=>{
  const time=(value:string)=>Number.isFinite(Date.parse(value))?Date.parse(value):0;
  return time(b.entry.updatedAt)-time(a.entry.updatedAt);
 });
 const unfinished=saved.find(({entry})=>entry.before&&!entry.completedAt);
 const bookmarked=saved.find(({entry})=>entry.bookmarked);
 const recent=saved.find(({entry})=>entry.completedAt);
 const target=unfinished||bookmarked||recent;
 return {completed:saved.filter(({entry})=>!!entry.completedAt).length, target:target?.lesson, kind:unfinished?'continue':bookmarked?'bookmark':recent?'revisit':'start'} as const;
}
