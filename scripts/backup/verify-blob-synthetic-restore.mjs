/** OFFLINE synthetic-only restore. Never connects to hosted Postgres or restores real data. */
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {unseal,sha256,canonical,SCHEMA} from './core.mjs';
import {fixture,OWNER} from '../../ops/blob-pilot/lib/fixture.mjs';
const ddl=`CREATE TABLE owners(id uuid PRIMARY KEY);
CREATE TABLE persona_profiles(user_id uuid PRIMARY KEY REFERENCES owners(id),gender text,age_group text,occupation text,completed_count integer NOT NULL,state jsonb NOT NULL,consent_agreed_at timestamptz NOT NULL,consent_version text NOT NULL,updated_at timestamptz NOT NULL,revision uuid NOT NULL,last_write_id uuid);
CREATE TABLE taste_journals(user_id uuid PRIMARY KEY REFERENCES owners(id),state jsonb NOT NULL,revision uuid NOT NULL,last_write_id uuid,updated_at timestamptz NOT NULL);`;
export async function verifySyntheticRestore(raw,privateKey,receipt){
 assert(raw.length<=64*1024,'Oversize bundle');
 assert.equal(receipt.synthetic,true);assert.equal(receipt.status,'verified');assert.equal(sha256(raw),receipt.bundleDigest,'Independent bundle digest mismatch');
 const b=JSON.parse(raw.toString('utf8'));
 assert.equal(b.format,'rubato-synthetic-blob-v1');assert.equal(b.synthetic,true);assert.equal(b.day,receipt.day);
 assert.equal(b.archiveDigest,receipt.archiveDigest);assert.equal(b.snapshotDigest,receipt.snapshotDigest);
 const archive=Buffer.from(b.archive,'base64');assert.equal(archive.toString('base64'),b.archive);
 const recovered=unseal(archive,privateKey,b.fingerprint,receipt.archiveDigest);
 const expected=fixture(b.day);assert.equal(canonical(recovered),canonical(expected),'Not the exact synthetic fixture');
 assert.equal(sha256(canonical(recovered)),receipt.snapshotDigest);
 const db=new PGlite();
 try{
  await db.exec(ddl);await db.query('INSERT INTO owners VALUES($1)',[OWNER]);
  await db.transaction(async tx=>{for(const [table,columns] of Object.entries(SCHEMA))for(const row of recovered.tables[table])await tx.query(`INSERT INTO ${table}(${columns.join(',')}) VALUES(${columns.map((_,i)=>'$'+(i+1)).join(',')})`,columns.map(k=>k==='state'?JSON.stringify(row[k]):row[k]));});
  for(const table of Object.keys(SCHEMA)){
   const rows=(await db.query(`SELECT * FROM ${table}`)).rows;
   // Normalize PG timestamp representation, compare every column and original Unicode state.
   for(const row of rows)for(const key of ['updated_at','consent_agreed_at'])if(row[key])row[key]=new Date(row[key]).toISOString();
   assert.deepEqual(rows,expected.tables[table]);
  }
  return {synthetic:true,day:b.day,restoreVerified:true,isolatedDatabase:'in-memory PostgreSQL/PGlite',profileRows:1,journalRows:1,archiveDigest:receipt.archiveDigest,bundleDigest:receipt.bundleDigest,checkedAt:new Date().toISOString()};
 }finally{await db.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{
  const [bundleFile,receiptFile,keyFile]=process.argv.slice(2);if(!bundleFile||!receiptFile||!keyFile)throw Error('Usage: node scripts/backup/verify-blob-synthetic-restore.mjs BUNDLE RECEIPT PRIVATE_KEY');
  const result=await verifySyntheticRestore(await readFile(bundleFile),await readFile(keyFile,'utf8'),JSON.parse(await readFile(receiptFile,'utf8')));console.log(JSON.stringify(result));
 }catch{console.error('Synthetic isolated restore failed; no hosted writes performed.');process.exitCode=1;}
}
