import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inspectRecoverySet} from '../blob-recovery-readiness.mjs';
const now=Date.parse('2026-11-18T12:00:00Z'), fingerprint='a'.repeat(64);
const key={fingerprint,escrowProject:'separate-test-project',recoveryVerified:true};
const archive={id:'test-archive',fingerprint,digest:'b'.repeat(64),capturedAt:'2026-11-18T11:00:00.000Z',readbackVerified:true,restoreVerified:true};
const check=(patch={})=>inspectRecoverySet({archives:[archive],keys:[key],inventoryComplete:true,now,...patch});
test('verified evidence never authorizes production or deletion',()=>{const r=check();assert.equal(r.status,'consistent');assert.equal(r.deletionAuthorized,false);assert.equal(r.productionReady,false);assert.deepEqual(r.keepArchiveIds,[archive.id]);});
test('different escrow key cannot be relabeled as archive recovery',()=>{const r=check({keys:[{...key,fingerprint:'c'.repeat(64)}]});assert(r.issues.some(x=>x.code==='KEY_MISSING'));});
test('unverified key and missing restore generate explicit failures',()=>{const r=check({keys:[{...key,recoveryVerified:false}],archives:[{...archive,restoreVerified:false}]});assert(r.issues.some(x=>x.code==='KEY_RECOVERY_UNVERIFIED'));assert(r.issues.some(x=>x.code==='ARCHIVE_RECOVERY_UNVERIFIED'));});
test('stale and missing evidence cannot report healthy',()=>{assert(check({archives:[]}).issues.some(x=>x.code==='BACKUP_MISSING'));assert(check({now:now+27*3600000}).issues.some(x=>x.code==='NO_FRESH_RECOVERABLE_BACKUP'));});
test('incomplete duplicate and future inventory fail closed',()=>{for(const p of [{inventoryComplete:false},{archives:[archive,archive]},{keys:[key,key]},{archives:[{...archive,capturedAt:'2027-01-01'}]},{maxAgeMs:Infinity}])assert.throws(()=>check(p));});
test('rotation retains old keys and every archive without deletion',()=>{const old={...archive,id:'older',fingerprint:'c'.repeat(64),capturedAt:'2026-10-01T00:00:00.000Z'};const r=check({archives:[old,archive],keys:[key,{...key,fingerprint:old.fingerprint}]});assert.equal(r.status,'consistent');assert.equal(r.requiredKeyFingerprints.length,2);assert.deepEqual(r.keepArchiveIds,['older','test-archive']);assert.equal(r.deletionAuthorized,false);});

test('unknown fields and coercible timestamps are rejected',()=>{for(const p of [{keys:[{...key,privateKey:'never-accept-secrets'}]},{archives:[{...archive,capturedAt:'2026-11-18'}]},{archives:[null]},{keys:[null]}])assert.throws(()=>check(p));const r=check();assert.equal(r.sourceAuthenticationVerifiedOffline,false);assert.equal(r.escrowIndependenceVerified,false);});
