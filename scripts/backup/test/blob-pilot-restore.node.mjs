import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {verifySyntheticRestore} from '../verify-blob-synthetic-restore.mjs';
import {run} from '../../../ops/blob-pilot/lib/pilot.mjs';
import {publicFingerprint} from '../core.mjs';
test('Blob pilot independent artifact decrypt and exact synthetic SQL restore',async()=>{
 const keys=generateKeyPairSync('rsa',{modulusLength:3072,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}}),data=new Map();
 const store={read:async p=>data.get(p)??null,create:async(p,b)=>{if(data.has(p))return false;data.set(p,b);return true;}};
 const receipt=await run(store,{publicKey:keys.publicKey,fingerprint:publicFingerprint(keys.publicKey),secret:'synthetic-only-'.repeat(5)});
 const raw=data.get(`synthetic-pilot/${receipt.day}/archive.json`);
 const result=await verifySyntheticRestore(raw,keys.privateKey,receipt);assert.equal(result.restoreVerified,true);assert.equal(result.profileRows,1);assert.equal(result.journalRows,1);
 await assert.rejects(verifySyntheticRestore(raw,keys.privateKey,{...receipt,bundleDigest:'0'.repeat(64)}));
 await assert.rejects(verifySyntheticRestore(raw,keys.privateKey,{...receipt,synthetic:false}));
 await assert.rejects(verifySyntheticRestore(raw,keys.privateKey,{...receipt,archiveDigest:'0'.repeat(64)}));
});
