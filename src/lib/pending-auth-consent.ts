export const PENDING_AUTH_CONSENT_KEY='room_rubato_pending_consent_v1';
/** Temporary OAuth UI consent only, never account authorization or a durable record. */
export function pendingAuthConsentAt(raw:string|null,version:string,now=Date.now()):string|null{
 try{
  const value=JSON.parse(raw||'null');
  if(value?.version!==version||typeof value.at!=='string')return null;
  const age=now-Date.parse(value.at);
  return Number.isFinite(age)&&age>=0&&age<15*60*1000?value.at:null;
 }catch{return null;}
}
