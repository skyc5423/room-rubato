import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {mkdtemp,readFile,writeFile,stat,symlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {run,config} from '../../../ops/blob-pilot/lib/pilot.mjs';
import {emitSyntheticDiagnostics} from '../../../ops/blob-pilot/lib/diagnostics.mjs';
import {publicFingerprint} from '../core.mjs';
import {analyzeLogs,collectEvidence,evaluateMonitoring,WRITER} from '../blob-evidence.mjs';
import {saveEvidence,readEvidenceInput} from '../collect-blob-evidence.mjs';
const day='2026-11-18',now=Date.parse(day+'T12:30:00.000Z'),deployment='dpl_test123',requestId='test-request-123';
const keys=generateKeyPairSync('rsa',{modulusLength:3072,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}}),env={BACKUP_PRODUCTION_ENABLED:'false',PILOT_SYNTHETIC_ONLY:'true',PILOT_DIAGNOSTIC_LOG:'true',PILOT_START_AT:day+'T00:00:00.000Z',PILOT_EXPIRES_AT:day+'T23:59:59.999Z',PILOT_PUBLIC_KEY:keys.publicKey,PILOT_KEY_FINGERPRINT:publicFingerprint(keys.publicKey),PILOT_RECEIPT_SECRET:'test-only-never-log-'.repeat(4)};
const data=new Map(),store={read:async p=>data.get(p)??null,create:async(p,b)=>{if(data.has(p))return false;data.set(p,b);return true;}};
const result=await run(store,config(env,now),now),events=[];await emitSyntheticDiagnostics({method:'GET',env,store,result,now,log:l=>events.push(JSON.parse(l))});
function text(es=events,req=requestId){return `## Runtime Logs\n\n**Project:** ${WRITER}\n**Deployment:** ${deployment}\n**Time range:** ${day}T12:00:00.000Z → ${day}T13:00:00.000Z\n\n`+es.map(e=>`### ${day}T12:30:01.000Z GET /api/run [info/function]\ndep=${deployment} request=${req} domain=test.vercel.app environment=production region=iad1 runtime=nodejs24.x stream=stdout\n    ${JSON.stringify(e)}\n`).join('\n');}
const select={deployment,day};const collect=(t=text(),s=select)=>collectEvidence(analyzeLogs(t,s));
const restored=r=>({synthetic:true,day,restoreVerified:true,isolatedDatabase:'in-memory PostgreSQL/PGlite',profileRows:1,journalRows:1,archiveDigest:r.archiveDigest,bundleDigest:r.bundleDigest,checkedAt:day+'T12:31:00.000Z'});
test('out-of-order saved logs collect byte-exact artifact with bound provenance',()=>{const c=collect(text([...events].reverse()));assert.deepEqual(c.bundle,data.get(`synthetic-pilot/${day}/archive.json`));assert.equal(c.evidence.requestId,requestId);assert.equal(c.report.restoreVerified,false);assert.equal(c.report.productionReady,false);});
test('truncated, missing, duplicate and conflicting chunks fail closed',()=>{
 assert.throws(()=>collect(text()+'\n[output truncated]'));
 assert.throws(()=>collect(text(events.slice(1))));assert.throws(()=>collect(text(events.slice(0,-1))));
 assert.throws(()=>collect(text([...events,events[1]])),/DUPLICATE_CHUNK/);
 const bad=structuredClone(events);bad[1].count++;assert.throws(()=>collect(text(bad)));
 const corrupt=structuredClone(events);corrupt[1].data='A'+corrupt[1].data.slice(1);assert.throws(()=>collect(text(corrupt)));
 const extra=structuredClone(events);extra[1].secret='untrusted';assert.throws(()=>collect(text(extra)),/CHUNK_SCHEMA/);
});
test('wrong deployment, project, origin, day, digest and request cannot mix',()=>{
 assert.throws(()=>collect(text(),{...select,deployment:'dpl_other'}));assert.throws(()=>collect(text().replace(WRITER,'prj_other')));
 assert.throws(()=>collect(text().replaceAll('GET /api/run','POST /api/run')));
 assert.throws(()=>collect(text(),{...select,requestId:'other'}),/NO_EVIDENCE/);
 assert.throws(()=>collect(text(),{...select,bundleDigest:'0'.repeat(64)}),/NO_EVIDENCE/);
 const wrong=structuredClone(events);wrong[0].day='2000-01-01';assert.throws(()=>collect(text(wrong)),/EVENT_IDENTITY/);
});
test('multiple request groups are ambiguous unless request explicitly selected',()=>{
 const second=text(events,'request-two').split('\n\n').slice(2).join('\n\n');
 const combined=text()+second;assert.throws(()=>collect(combined),/AMBIGUOUS_GROUPS/);
 assert.equal(collect(combined,{...select,requestId}).evidence.requestId,requestId);
});
test('diagnostic and runtime error markers prevent success',()=>{
 assert.throws(()=>collect(text([...events,{event:'RUBATO_SYNTHETIC_PILOT_DIAGNOSTIC_FAILED',synthetic:true,errorCode:'EVIDENCE_UNAVAILABLE'}])),/DIAGNOSTIC_FAILED/);
 assert.throws(()=>collect(text().replace('[info/function]','[error/function]')),/DIAGNOSTIC_FAILED/);
});
test('pending before13:10, missing afterward; not asserted Cron failure',()=>{
 for(const stamp of ['T11:00:00.000Z','T12:59:59.999Z','T13:09:59.999Z'])assert.equal(evaluateMonitoring({day,now:Date.parse(day+stamp)}).status,'pending');
 const r=evaluateMonitoring({day,now:Date.parse(day+'T13:10:00.000Z')});assert.equal(r.status,'missing');assert.equal(r.cronFailureConfirmed,false);
});
test('verified requires complete collection plus matching independent restore report',()=>{
 const c=collect(),later=Date.parse(day+'T13:11:00.000Z');assert.equal(evaluateMonitoring({day,now:later,collection:c}).status,'missing');
 assert.equal(evaluateMonitoring({day,now:later,collection:c,restoreReport:restored(c.receipt)}).status,'verified');
 for(const changes of [{bundleDigest:'0'.repeat(64)},{day:'2000-01-01'},{restoreVerified:false},{profileRows:2},{checkedAt:day+'T14:00:00.000Z'},{secret:'bad'}])assert.equal(evaluateMonitoring({day,now:later,collection:c,restoreReport:{...restored(c.receipt),...changes}}).status,'failure');
 assert.equal(evaluateMonitoring({day,now:later,collection:c,restoreReport:restored(c.receipt),failureCode:'DIAGNOSTIC_FAILED'}).status,'failure');
});
test('schema bounds and duplicate JSON keys rejected',()=>{
 assert.throws(()=>collect('x'.repeat(1024*1024+1)));
 assert.throws(()=>collect(text().replace('"index":0','"index":1,"index":0')));
 assert.throws(()=>collect(text().replace('"count":3','"count":999')));
});
test('exclusive private evidence files; existing directory and symlink never overwritten',async()=>{
 const parent=await mkdtemp(join(tmpdir(),'rubato-collector-')),out=join(parent,'saved'),c=collect(),monitor=evaluateMonitoring({day,now:Date.parse(day+'T13:11:00.000Z'),collection:c,restoreReport:restored(c.receipt)});
 try{await saveEvidence(out,c,monitor);assert.equal((await stat(out)).mode&0o777,0o700);for(const f of ['evidence.json','receipt.json','bundle.json','report.json'])assert.equal((await stat(join(out,f))).mode&0o777,0o600);assert.deepEqual(await readFile(join(out,'bundle.json')),c.bundle);await assert.rejects(saveEvidence(out,c,monitor));await symlink(out,join(parent,'link'));await assert.rejects(saveEvidence(join(parent,'link'),c,monitor));assert.equal(JSON.parse(await readFile(join(out,'report.json'))).monitor.status,'verified');}
 finally{await rm(parent,{recursive:true,force:true});}
});

test('input reads reject final and parent symlinks, excess size and broad permissions',async()=>{
 const parent=await mkdtemp(join(tmpdir(),'rubato-input-'));
 try{const file=join(parent,'source.txt');await writeFile(file,text(),{mode:0o600});assert.equal((await readEvidenceInput(file,1024*1024)).toString(),text());await assert.rejects(readEvidenceInput(file,10));await symlink(file,join(parent,'file-link'));await assert.rejects(readEvidenceInput(join(parent,'file-link'),1024*1024));await symlink(parent,join(parent,'parent-link'));await assert.rejects(readEvidenceInput(join(parent,'parent-link','source.txt'),1024*1024));await writeFile(join(parent,'public.txt'),'test',{mode:0o644});await assert.rejects(readEvidenceInput(join(parent,'public.txt'),100));}
 finally{await rm(parent,{recursive:true,force:true});}
});

test('scheduled log monitor keeps complete artifact distinct from restore and live Blob status',async()=>{
 const {classifySyntheticLogCheck}=await import('../synthetic-log-monitor.mjs');
 // The schedule is a bounded November pilot, independent of the runner's wall clock.
 const r=classifySyntheticLogCheck({text:text().replace(`${day}T12:00:00.000Z →`,`${day}T12:01:00.000Z →`),connectorOk:true,day,deployment,now:Date.parse(day+'T13:00:00.000Z')});
 assert.equal(r.state,'evidence_unverified');assert.equal(r.restoreVerified,false);assert.equal(r.currentBlobReadVerified,false);assert.equal(r.sourceAuthenticationVerifiedOffline,false);
});
