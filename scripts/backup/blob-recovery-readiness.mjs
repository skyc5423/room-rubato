// Offline inspection only. Never fetches keys, deletes objects, or authorizes activation.
const exact = (x, fields) => x && typeof x==='object' && !Array.isArray(x) && Object.keys(x).sort().join(',')===fields.sort().join(',');
const instant = x => typeof x==='string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(x) && Number.isFinite(Date.parse(x)) && new Date(x).toISOString()===x;
const hex = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
export function inspectRecoverySet({archives,keys,inventoryComplete,now=Date.now(),maxAgeMs=26*3600000}) {
  if (!Array.isArray(archives) || !Array.isArray(keys) || inventoryComplete !== true || !Number.isFinite(now) || !Number.isSafeInteger(maxAgeMs) || maxAgeMs<=0) throw Error('INVALID_INVENTORY');
  const registry=new Map();
  for(const key of keys) {
    if(!exact(key,['fingerprint','escrowProject','recoveryVerified'])||typeof key.recoveryVerified!=='boolean'||!hex(key.fingerprint)||registry.has(key.fingerprint)||typeof key.escrowProject!=='string'||!key.escrowProject)throw Error('INVALID_KEY_REGISTRY');
    registry.set(key.fingerprint,key);
  }
  const seen=new Set(),issues=[],keep=[];let newest=-Infinity;
  for(const archive of archives) {
    if(!exact(archive,['id','fingerprint','digest','capturedAt','readbackVerified','restoreVerified'])||!instant(archive.capturedAt)||typeof archive.readbackVerified!=='boolean'||typeof archive.restoreVerified!=='boolean')throw Error('INVALID_ARCHIVE');
    const at=Date.parse(archive.capturedAt);
    if(typeof archive.id!=='string'||!archive.id||seen.has(archive.id)||!hex(archive.fingerprint)||!hex(archive.digest)||!Number.isFinite(at)||at>now)throw Error('INVALID_ARCHIVE');
    seen.add(archive.id);keep.push(archive.id);
    const key=registry.get(archive.fingerprint);
    if(!key)issues.push({id:archive.id,code:'KEY_MISSING'});
    else if(key.recoveryVerified!==true)issues.push({id:archive.id,code:'KEY_RECOVERY_UNVERIFIED'});
    if(archive.readbackVerified!==true||archive.restoreVerified!==true)issues.push({id:archive.id,code:'ARCHIVE_RECOVERY_UNVERIFIED'});
    if(key?.recoveryVerified===true&&archive.readbackVerified===true&&archive.restoreVerified===true)newest=Math.max(newest,at);
  }
  if(!archives.length)issues.push({code:'BACKUP_MISSING'});
  else if(now-newest>maxAgeMs)issues.push({code:'NO_FRESH_RECOVERABLE_BACKUP'});
  return {status:issues.length?'attention':'consistent',issues,keepArchiveIds:keep,requiredKeyFingerprints:[...new Set(archives.map(a=>a.fingerprint))],sourceAuthenticationVerifiedOffline:false,escrowIndependenceVerified:false,deletionAuthorized:false,productionReady:false};
}
