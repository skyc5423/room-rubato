/** Offline-first application-data backup primitives. No live deletion/restore. */
import { createCipheriv, createDecipheriv, createHash, createPublicKey, constants, publicEncrypt, privateDecrypt, randomBytes, randomUUID, verify } from 'node:crypto';

export const PROJECT = 'nhusocbyuxzjsfwitkhe';
export const FORMAT = 'room-rubato-app-backup-v1';
export const MAX_BYTES = 32 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PROFILE = ['user_id','gender','age_group','occupation','completed_count','state','consent_agreed_at','consent_version','updated_at','revision','last_write_id'];
const JOURNAL = ['user_id','state','revision','last_write_id','updated_at'];
export const SCHEMA = { persona_profiles: PROFILE, taste_journals: JOURNAL };
export function ensure(ok, msg) { if (!ok) throw new Error(msg); }
export const sha256 = value => createHash('sha256').update(value).digest('hex');
export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  ensure(value !== undefined && !(typeof value === 'number' && !Number.isFinite(value)), 'Invalid canonical value');
  return JSON.stringify(value);
}
function exactKeys(value, expected) {
  ensure(value && typeof value === 'object' && !Array.isArray(value), 'Object required');
  ensure(canonical(Object.keys(value).sort()) === canonical([...expected].sort()), 'Unexpected schema');
}
function instant(value) {
  ensure(typeof value === 'string' && /(?:Z|[+-]\d\d:\d\d)$/.test(value) && Number.isFinite(Date.parse(value)), 'Invalid timestamp');
  return Date.parse(value);
}
export function validateSnapshot(snapshot, now = Date.now()) {
  exactKeys(snapshot, ['format','project','snapshotId','capturedAt','tables']);
  ensure(snapshot.format === FORMAT && snapshot.project === PROJECT && UUID.test(snapshot.snapshotId), 'Wrong backup identity');
  ensure(instant(snapshot.capturedAt) <= now + 30000, 'Future snapshot');
  exactKeys(snapshot.tables, Object.keys(SCHEMA));
  for (const [table, columns] of Object.entries(SCHEMA)) {
    const rows = snapshot.tables[table];
    ensure(Array.isArray(rows), 'Rows required');
    const seen = new Set();
    for (const row of rows) {
      exactKeys(row, columns);
      ensure(UUID.test(row.user_id) && !seen.has(row.user_id), 'Invalid or duplicate owner'); seen.add(row.user_id);
      ensure(UUID.test(row.revision) && (row.last_write_id === null || UUID.test(row.last_write_id)), 'Invalid revision');
      ensure(row.state && typeof row.state === 'object' && !Array.isArray(row.state), 'Invalid application state');
      ensure(instant(row.updated_at) <= instant(snapshot.capturedAt) + 30000, 'Row newer than snapshot');
      if (table === 'persona_profiles') {
        ensure(Number.isInteger(row.completed_count) && row.completed_count >= 0, 'Invalid completed count');
        for (const key of ['gender','age_group','occupation']) ensure(row[key] === null || typeof row[key] === 'string', 'Invalid profile field');
        instant(row.consent_agreed_at); ensure(typeof row.consent_version === 'string', 'Invalid consent');
      }
    }
  }
  ensure(Buffer.byteLength(canonical(snapshot)) <= MAX_BYTES, 'Snapshot too large');
  return snapshot;
}
export function publicFingerprint(pem) {
  return sha256(createPublicKey(pem).export({type:'spki',format:'der'}));
}
export function seal(snapshot, publicPem, expectedFingerprint) {
  validateSnapshot(snapshot);
  const key = createPublicKey(publicPem);
  ensure(key.asymmetricKeyType === 'rsa' && key.asymmetricKeyDetails.modulusLength >= 3072, 'RSA >=3072 required');
  ensure(publicFingerprint(publicPem) === expectedFingerprint, 'Recovery key fingerprint mismatch');
  const dataKey = randomBytes(32), iv = randomBytes(12);
  try {
    const header = {format:FORMAT, keyFingerprint:expectedFingerprint, cipher:'AES-256-GCM', wrap:'RSA-OAEP-SHA256', iv:iv.toString('base64'), wrappedKey:publicEncrypt({key,oaepHash:'sha256',padding:constants.RSA_PKCS1_OAEP_PADDING},dataKey).toString('base64')};
    const cipher = createCipheriv('aes-256-gcm',dataKey,iv); cipher.setAAD(Buffer.from(canonical(header)));
    const ciphertext = Buffer.concat([cipher.update(canonical(snapshot),'utf8'),cipher.final()]);
    return Buffer.from(canonical({header,ciphertext:ciphertext.toString('base64'),tag:cipher.getAuthTag().toString('base64')}));
  } finally { dataKey.fill(0); }
}
function b64(s, bytes) {
  ensure(typeof s === 'string' && /^[A-Za-z0-9+/]*={0,2}$/.test(s), 'Invalid encoding');
  const value=Buffer.from(s,'base64'); ensure(value.toString('base64')===s && (!bytes || value.length===bytes), 'Invalid encoded length'); return value;
}
export function unseal(blob, privatePem, expectedFingerprint, expectedArchiveDigest, now = Date.now()) {
  ensure(typeof expectedArchiveDigest === 'string' && /^[a-f0-9]{64}$/.test(expectedArchiveDigest) && sha256(blob) === expectedArchiveDigest, 'Independent archive digest mismatch');
  ensure(blob.length <= MAX_BYTES * 1.5, 'Archive too large');
  const envelope=JSON.parse(blob.toString('utf8')); exactKeys(envelope,['header','ciphertext','tag']);
  const {header}=envelope; exactKeys(header,['format','keyFingerprint','cipher','wrap','iv','wrappedKey']);
  ensure(header.format===FORMAT && header.cipher==='AES-256-GCM' && header.wrap==='RSA-OAEP-SHA256', 'Unknown encryption format');
  ensure(header.keyFingerprint===expectedFingerprint && publicFingerprint(privatePem)===expectedFingerprint,'Recovery key mismatch');
  const key=privateDecrypt({key:privatePem,oaepHash:'sha256',padding:constants.RSA_PKCS1_OAEP_PADDING},b64(header.wrappedKey));
  try {
    ensure(key.length===32,'Bad data key');
    const decipher=createDecipheriv('aes-256-gcm',key,b64(header.iv,12)); decipher.setAAD(Buffer.from(canonical(header))); decipher.setAuthTag(b64(envelope.tag,16));
    const plaintext=Buffer.concat([decipher.update(b64(envelope.ciphertext)),decipher.final()]);
    try { return validateSnapshot(JSON.parse(plaintext.toString('utf8')), now); } finally { plaintext.fill(0); }
  } finally { key.fill(0); }
}
/** Independently stored, signed ledger. External expected checkpoint prevents rollback. */
// Explicit signed body avoids accidental inclusion/exclusion of signature fields.
function unsignedLedger(ledger) { const {signature,...body}=ledger; return body; }
// Kept separate from signature: this digest must be read from independent trusted storage.
export function ledgerDigest(ledger) { return sha256(canonical(unsignedLedger(ledger))); }
export function checkedLedger(ledger, publicPem, expected, now=Date.now()) {
  exactKeys(ledger,['project','epoch','sequence','observedAt','events','signature']);
  ensure(ledger.project===PROJECT && UUID.test(ledger.epoch) && Number.isSafeInteger(ledger.sequence) && ledger.sequence>=0, 'Invalid ledger identity');
  ensure(expected && expected.epoch===ledger.epoch && expected.sequence===ledger.sequence && expected.digest===ledgerDigest(ledger), 'Ledger checkpoint mismatch');
  return verifyLedgerBody(ledger,publicPem,now);
}
function verifyLedgerBody(ledger, publicPem, now) {
  const observed=instant(ledger.observedAt); ensure(observed<=now+30000 && observed>=now-300000,'Ledger not fresh');
  ensure(createPublicKey(publicPem).asymmetricKeyType==='ed25519','Ed25519 ledger key required');
  ensure(verify(null,Buffer.from(canonical(unsignedLedger(ledger))),publicPem,b64(ledger.signature,64)), 'Invalid ledger signature');
  ensure(Array.isArray(ledger.events) && ledger.events.length===ledger.sequence, 'Incomplete ledger');
  const ids=new Set(); let previous='0'.repeat(64), deletedAt=0;
  for (const [index,event] of ledger.events.entries()) {
    exactKeys(event,['sequence','userId','deletedAt','previous']);
    ensure(event.sequence===index+1 && UUID.test(event.userId) && event.previous===previous,'Broken deletion chain');
    const time=instant(event.deletedAt); ensure(time>=deletedAt && time<=observed,'Invalid deletion time');
    ids.add(event.userId); deletedAt=time; previous=sha256(canonical(event));
  }
  return ids;
}
/** Produces a plan only, never inserts/restores Auth or app data. */
export function restorePlan(snapshot, ledger, ledgerPublicPem, checkpoint, ownerInventory, now=Date.now()) {
  validateSnapshot(snapshot,now); const deleted=checkedLedger(ledger,ledgerPublicPem,checkpoint,now);
  exactKeys(ownerInventory,['project','observedAt','owners','signature']);
  ensure(ownerInventory.project===PROJECT, 'Wrong inventory project');
  const observed=instant(ownerInventory.observedAt);
  ensure(observed>=now-300000 && observed<=now+30000, 'Owner inventory not fresh');
  const {signature,...inventoryBody}=ownerInventory;
  ensure(verify(null,Buffer.from(canonical(inventoryBody)),ledgerPublicPem,b64(signature,64)), 'Untrusted owner inventory');
  ensure(Array.isArray(ownerInventory.owners) && ownerInventory.owners.every(id=>UUID.test(id)), 'Verified live owner inventory required');
  const live=new Set(ownerInventory.owners), tables={}, rejected={deleted:0,missingOwner:0};
  for(const [name,rows] of Object.entries(snapshot.tables)) tables[name]=rows.flatMap(row=>{
    if(deleted.has(row.user_id)) {rejected.deleted++;return [];}
    if(!live.has(row.user_id)) {rejected.missingOwner++;return [];}
    return [{...row,revision:randomUUID(),last_write_id:null}];
  });
  return {format:'room-rubato-restore-plan-v1', project:PROJECT, snapshotId:snapshot.snapshotId, ledgerDigest:ledgerDigest(ledger), generatedAt:new Date(now).toISOString(), notAfter:new Date(Math.min(Date.parse(ledger.observedAt),observed)+300000).toISOString(), applicationAuthorized:false, rejected, tables};
}
