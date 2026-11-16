import {parseJournal, type JournalEntry} from './taste-journal';
import {tasteLessons} from './taste-lessons';
export interface NotebookDraft { version:1; base:JournalEntry; entry:JournalEntry; stage:number; variation:number }
export const notebookDraftKey=(owner:string)=>`rubato_notebook_draft_v1:${owner}`;
export function parseNotebookDraft(raw:string|null):NotebookDraft|null {
 try{
  if(!raw||raw.length>20000)return null;
  const v=JSON.parse(raw);
  if(v.version!==1||!v.entry||!v.base||v.entry.lessonId!==v.base.lessonId||!tasteLessons.some(l=>l.id===v.entry.lessonId)||![0,1,2].includes(v.stage)||!Number.isFinite(v.variation)||v.variation<0||v.variation>100)return null;
  const parse=(entry:JournalEntry)=>{
    const allowed=new Set(['lessonId','version','before','after','beforeSetting','afterSetting','memo','bookmarked','completedAt','updatedAt']);
    if(Object.keys(entry).some(key=>!allowed.has(key))||typeof entry.memo!=='string'||entry.memo.length>1500||typeof entry.updatedAt!=='string'||!Number.isFinite(Date.parse(entry.updatedAt)))return undefined;
    if(entry.completedAt!==undefined&&(typeof entry.completedAt!=='string'||!Number.isFinite(Date.parse(entry.completedAt))))return undefined;
    for(const key of ['before','after'] as const)if(entry[key]!==undefined&&!['a','b','both','unsure'].includes(entry[key]!))return undefined;
    for(const key of ['beforeSetting','afterSetting'] as const)if(entry[key]!==undefined&&(!Number.isFinite(entry[key])||entry[key]!<0||entry[key]!>100))return undefined;
    return parseJournal(JSON.stringify({version:1,entries:{[entry.lessonId]:entry}})).entries[entry.lessonId];
  };
  const base=parse(v.base),entry=parse(v.entry);
  if(!base?.completedAt||!entry)return null;
  return {version:1,base,entry,stage:v.stage,variation:v.variation};
 }catch{return null;}
}
export function sameDraftBase(current:JournalEntry|undefined,base:JournalEntry){return !!current&&JSON.stringify(current)===JSON.stringify(base);}
