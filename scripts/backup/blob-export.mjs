/** Candidate library only. No CLI, credentials, network defaults, deployment or authorization.
 * Injected adapters are trusted boundaries: metadata is binding, not proof of a DB's identity.
 * External objects cannot be rolled back; failed runs may leave immutable orphan archives.
 */
import {readFileSync} from 'node:fs';
import {createPrivateKey,createPublicKey,sign,verify} from 'node:crypto';
import {canonical,PROJECT,MAX_BYTES,publicFingerprint,seal,sha256} from './core.mjs';
const SQL=readFileSync(new URL('./export.sql',import.meta.url),'utf8');
const STATEMENTS=SQL.replace(/^--.*$/gm,'').split(';').map(s=>s.trim()).filter(Boolean);
const MODE='app-data-candidate', PREFIX='room-rubato-app-backups', STORE='store_C1xbVeoXtowulKQG';
const HEX=/^[a-f0-9]{64}$/, UUID='[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}';
const PATH=new RegExp(`^app-data-v1/([a-f0-9]{64})/(\\d{4}-\\d{2}-\\d{2})/(${UUID})\\.rrb$`);
function check(ok){if(!ok)throw Error('BLOB_EXPORT_INVALID_CONFIG');}
const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&canonical(Object.keys(o).sort())===canonical([...keys].sort());
function receiptBody(p){
 check(exact(p,['project','mode','destination','path','keyFingerprint','capturedAt','sha256','bytes','readbackVerified','restoreVerified']));
 check(p.project===PROJECT&&p.mode===MODE&&exact(p.destination,['storeId','prefix'])&&p.destination.storeId===STORE&&p.destination.prefix===PREFIX);
 const m=typeof p.path==='string'&&p.path.match(PATH);
 check(m&&m[1]===p.keyFingerprint&&HEX.test(p.keyFingerprint)&&HEX.test(p.sha256));
 check(typeof p.capturedAt==='string'&&Number.isFinite(Date.parse(p.capturedAt))&&new Date(p.capturedAt).toISOString().slice(0,10)===m[2]);
 check(Number.isSafeInteger(p.bytes)&&p.bytes>0&&p.bytes<=MAX_BYTES*1.5&&p.readbackVerified===true&&p.restoreVerified===false);
 return {format:'room-rubato-blob-receipt-v1',payload:p};
}
export function verifyBlobReceipt(envelope,publicKey,expectedFingerprint){
 try{
  check(exact(envelope,['format','payload','signature'])&&envelope.format==='room-rubato-blob-receipt-v1');
  check(HEX.test(expectedFingerprint)&&publicFingerprint(publicKey)===expectedFingerprint&&createPublicKey(publicKey).asymmetricKeyType==='ed25519');
  const body=receiptBody(envelope.payload),sig=Buffer.from(envelope.signature,'base64');
  check(sig.length===64&&sig.toString('base64')===envelope.signature&&verify(null,Buffer.from(canonical(body)),publicKey,sig));
  return envelope.payload;
 }catch{throw Error('BLOB_RECEIPT_INVALID');}
}
function configuration(c,client,store){
 check(c&&c.enabled===true&&c.mode===MODE&&c.sourceProject===PROJECT);
 check(canonical(c.confirmedScope)===canonical(['persona_profiles','taste_journals']));
 check(exact(c.destination,['storeId','prefix'])&&c.destination.storeId===STORE&&c.destination.prefix===PREFIX);
 check(HEX.test(c.keyFingerprint)&&publicFingerprint(c.publicKey)===c.keyFingerprint);
 const rsa=createPublicKey(c.publicKey);check(rsa.asymmetricKeyType==='rsa'&&rsa.asymmetricKeyDetails.modulusLength>=3072);
 check(HEX.test(c.receiptKeyFingerprint)&&publicFingerprint(c.receiptPublicKey)===c.receiptKeyFingerprint);
 const signer=createPrivateKey(c.receiptPrivateKey);check(signer.asymmetricKeyType==='ed25519'&&publicFingerprint(createPublicKey(signer).export({format:'pem',type:'spki'}))===c.receiptKeyFingerprint);
 check(Number.isSafeInteger(c.maxArchiveBytes)&&c.maxArchiveBytes>0&&c.maxArchiveBytes<=MAX_BYTES*1.5);
 check(client&&['connect','query','end'].every(k=>typeof client[k]==='function'));
 check(store&&typeof store.create==='function'&&typeof store.read==='function');
 check(store.identity&&store.identity.project===PROJECT&&store.identity.mode===MODE&&store.identity.storeId===STORE&&store.identity.prefix===PREFIX&&store.identity.keyFingerprint===c.keyFingerprint);
 // Copy all consumed settings before await: callers cannot retarget an in-flight run.
 return {keyFingerprint:c.keyFingerprint,publicKey:c.publicKey,signer,receiptPublicKey:c.receiptPublicKey,receiptKeyFingerprint:c.receiptKeyFingerprint,maxArchiveBytes:c.maxArchiveBytes,destination:{storeId:STORE,prefix:PREFIX}};
}
async function createVerified(store,path,bytes){
 // Pre-existing paths are never overwritten or treated as this run's success.
 if(await store.read(path)!==null)throw Error('collision');
 try{await store.create(path,Buffer.from(bytes));}catch{/* only exact readback may resolve uncertain write */}
 const saved=await store.read(path);
 if(!Buffer.isBuffer(saved)||saved.length!==bytes.length||sha256(saved)!==sha256(bytes))throw Error('readback');
}
export async function exportToBlob({config,client,store}={}){
 let c;
 try{c=configuration(config,client,store);}catch{throw Error('BLOB_EXPORT_INVALID_CONFIG');}
 let active=false,connected=false,archive;
 try{
  // This parser is deliberately specific to the reviewed five-statement export, not general SQL.
  check(STATEMENTS.length===5&&STATEMENTS[0]==='BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY'&&STATEMENTS[4]==='COMMIT');
  connected=true;await client.connect();active=true;
  for(const sql of STATEMENTS.slice(0,3))await client.query(sql);
  const lock=await client.query('SELECT pg_try_advisory_xact_lock(5423, 30) AS acquired');
  check(lock.rows?.length===1&&lock.rows[0].acquired===true);
  const size=await client.query("SELECT (SELECT COALESCE(sum(octet_length(row_to_json(p)::text)+256),0) FROM public.persona_profiles p)+(SELECT COALESCE(sum(octet_length(row_to_json(j)::text)+256),0) FROM public.taste_journals j)+4096 AS bytes");
  const estimate=size.rows?.[0]?.bytes;
  check(size.rows?.length===1&&(typeof estimate==='number'||typeof estimate==='string'&&/^\d+$/.test(estimate))&&Number.isSafeInteger(Number(estimate))&&Number(estimate)>=0&&Number(estimate)<=MAX_BYTES);
  const result=await client.query(STATEMENTS[3]);
  check(result&&result.rows?.length===1&&Object.keys(result.rows[0]).length===1);
  const snapshot=Object.values(result.rows[0])[0];
  const captured=Date.parse(snapshot?.capturedAt),now=Date.now();
  check(Number.isFinite(captured)&&captured>=now-300000&&captured<=now+30000);
  archive=seal(snapshot,c.publicKey,c.keyFingerprint);
  check(archive.length<=c.maxArchiveBytes);
  const path=`app-data-v1/${c.keyFingerprint}/${new Date(snapshot.capturedAt).toISOString().slice(0,10)}/${snapshot.snapshotId}.rrb`;
  check(PATH.test(path));
  const payload={project:PROJECT,mode:MODE,destination:c.destination,path,keyFingerprint:c.keyFingerprint,capturedAt:snapshot.capturedAt,sha256:sha256(archive),bytes:archive.length,readbackVerified:true,restoreVerified:false};
  await client.query(STATEMENTS[4]);active=false;
  await createVerified(store,path,archive);
  const body=receiptBody(payload),receipt={...body,signature:sign(null,Buffer.from(canonical(body)),c.signer).toString('base64')};
  verifyBlobReceipt(receipt,c.receiptPublicKey,c.receiptKeyFingerprint);
  const receiptBytes=Buffer.from(canonical(receipt));check(receiptBytes.length<=16*1024);
  await createVerified(store,path+'.receipt.json',receiptBytes);
  return {receipt,receiptPath:path+'.receipt.json',restoreVerified:false};
 }catch{
  if(active){try{await client.query('ROLLBACK');}catch{/* sanitized, never mask original failure */}}
  throw Error('BLOB_EXPORT_FAILED');
 }finally{
  archive?.fill(0);
  if(connected){try{await client.end();}catch{/* cleanup failure does not undo verified immutable objects */}}
 }
}
