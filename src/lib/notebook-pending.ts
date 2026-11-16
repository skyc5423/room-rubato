import {tasteLessons} from './taste-lessons';
import {parseJournalForWrite,type JournalEntry} from './taste-journal';
export type PendingWrites=Record<string,{base:JournalEntry|undefined;patch:Partial<JournalEntry>}>;
export const pendingKey=(owner:string)=>`rubato_notebook_pending_v1:${owner}`;
const optional=['before','after','beforeSetting','afterSetting','completedAt'];
const allowed=new Set([...optional,'memo','bookmarked','updatedAt']);
const ids=new Set(tasteLessons.map(lesson=>lesson.id));
// Browser-scoped fallback survives client navigation even when sessionStorage is unavailable.
// Never populated during server rendering and never shared across browser windows/accounts.
const memory=new WeakMap<object,Map<string,string>>();
export function encodePending(writes:PendingWrites){
 return JSON.stringify({version:1,writes:Object.entries(writes).map(([id,{base,patch}])=>({id,base,patch,clear:Object.keys(patch).filter(key=>patch[key as keyof JournalEntry]===undefined)}))});
}
export function decodePending(raw:string|null):PendingWrites{
 if(!raw)return {};
 const data=JSON.parse(raw);if(data?.version!==1||!Array.isArray(data.writes)||data.writes.length>ids.size)throw Error('Invalid pending copy');
 const result:PendingWrites={};
 for(const item of data.writes){
  if(!ids.has(item.id)||result[item.id]||!item.patch||typeof item.patch!=='object'||Array.isArray(item.patch)||!Array.isArray(item.clear)||Object.keys(item.patch).some(key=>!allowed.has(key))||item.clear.some((key:unknown)=>typeof key!=='string'||!optional.includes(key)))throw Error('Invalid pending entry');
  if(item.base!==undefined)parseJournalForWrite(JSON.stringify({version:1,entries:{[item.id]:item.base}}));
  const patch={...item.patch};for(const key of item.clear)patch[key]=undefined;
  const candidate={memo:'',bookmarked:false,...item.base,...patch,lessonId:item.id,version:1,updatedAt:patch.updatedAt||item.base?.updatedAt||''};
  parseJournalForWrite(JSON.stringify({version:1,entries:{[item.id]:candidate}}));
  for(const phase of ['before','after'])if(patch[phase]!==undefined&&!['a','b','both','unsure'].includes(patch[phase]))throw Error('Invalid pending choice');
  for(const field of ['beforeSetting','afterSetting'])if(patch[field]!==undefined&&(typeof patch[field]!=='number'||!Number.isFinite(patch[field])||patch[field]<0||patch[field]>100))throw Error('Invalid pending setting');
  if(patch.bookmarked!==undefined&&typeof patch.bookmarked!=='boolean')throw Error('Invalid pending bookmark');
  result[item.id]={base:item.base,patch};
 }
 return result;
}
export function readPending(owner:string):PendingWrites{
 const cached=memory.get(window)?.get(owner);
 return decodePending(cached??sessionStorage.getItem(pendingKey(owner)));
}
export function retainPending(owner:string,writes:PendingWrites):boolean{
 const raw=encodePending(writes);let cache=memory.get(window);if(!cache){cache=new Map();memory.set(window,cache);}cache.set(owner,raw);
 try{decodePending(sessionStorage.getItem(pendingKey(owner)));if(Object.keys(writes).length)sessionStorage.setItem(pendingKey(owner),raw);else sessionStorage.removeItem(pendingKey(owner));return true;}catch{return false;}
}
