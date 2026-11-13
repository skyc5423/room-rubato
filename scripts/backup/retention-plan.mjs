// Pure planning only. Input must be independent trusted receipts reconciled to all B2 versions.
// This module does not authorize or perform deletion.
import {ensure,PROJECT} from './core.mjs';
export function planRetention(receipts,{inventoryComplete=false,now=Date.now()}={}) {
  ensure(inventoryComplete===true && Array.isArray(receipts),'Complete reconciled inventory required');
  const seen=new Set(),daily=new Map();
  for(const receipt of receipts) {
    ensure(receipt.project===PROJECT && receipt.bucketId==='a593f42c829bd620a011031b','Wrong retention target');
    ensure(typeof receipt.fileId==='string' && receipt.fileId && !seen.has(receipt.fileId),'Duplicate or missing file version');seen.add(receipt.fileId);
    ensure(/^snapshots\/\d{4}-\d{2}-\d{2}\/[a-f0-9-]{36}(?:\.rrb|\.managed\.json)$/.test(receipt.fileName) && /^[a-f0-9]{64}$/.test(receipt.sha256),'Invalid receipt');
    ensure(receipt.readbackVerified===true && receipt.restoreVerified===true,'Unverified recovery point');
    const at=Date.parse(receipt.capturedAt);ensure(Number.isFinite(at)&&at<=now,'Invalid capture time');
    const day=new Date(at).toISOString().slice(0,10);ensure(receipt.fileName.startsWith(`snapshots/${day}/`),'Receipt day mismatch');
    const current=daily.get(day);if(!current || at>Date.parse(current.capturedAt))daily.set(day,receipt);
  }
  const points=[...daily.values()].sort((a,b)=>Date.parse(b.capturedAt)-Date.parse(a.capturedAt));
  if(points.length<30)return {deletionAuthorized:false,reason:'Fewer than 30 verified daily recovery points',keepFileIds:receipts.map(r=>r.fileId),proposedPermanentDeletions:[]};
  ensure(now-Date.parse(points[0].capturedAt)<=26*60*60*1000,'Latest backup is stale; retain all copies');
  const keep=new Set(points.slice(0,30).map(r=>r.fileId));
  return {deletionAuthorized:false,reason:'Review concrete version manifest and obtain action-time approval',keepFileIds:[...keep],proposedPermanentDeletions:receipts.filter(r=>!keep.has(r.fileId)).map(({bucketId,fileId,fileName,sha256,capturedAt})=>({bucketId,fileId,fileName,sha256,capturedAt}))};
}
