// Synthetic-only, in-memory PostgreSQL recovery rehearsal. No production importer.
import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
import {generateKeyPairSync,randomUUID,sign} from 'node:crypto';
import {PROJECT,SCHEMA,canonical,seal,unseal,sha256,publicFingerprint,ledgerDigest,restorePlan} from '../core.mjs';
const ddl=`CREATE TABLE owners(id uuid PRIMARY KEY);
CREATE TABLE persona_profiles(user_id uuid PRIMARY KEY REFERENCES owners(id),gender text,age_group text,occupation text,completed_count integer NOT NULL,state jsonb NOT NULL,consent_agreed_at timestamptz NOT NULL,consent_version text NOT NULL,updated_at timestamptz NOT NULL,revision uuid NOT NULL,last_write_id uuid);
CREATE TABLE taste_journals(user_id uuid PRIMARY KEY REFERENCES owners(id),state jsonb NOT NULL,revision uuid NOT NULL,last_write_id uuid,updated_at timestamptz NOT NULL);`;
test('isolated PostgreSQL: export, encrypt, recover, suppress deleted owner and invalidate stale revision',async()=>{
  const source=new PGlite(),target=new PGlite();
  try {
    await source.exec(ddl);await target.exec(ddl);
    const live=randomUUID(),deleted=randomUUID();
    for(const id of [live,deleted]) {
      await source.query('INSERT INTO owners VALUES ($1)',[id]);
      await source.query(`INSERT INTO persona_profiles VALUES($1,null,null,null,1,'{"synthetic":true}',now(),'fixture',now(),gen_random_uuid(),gen_random_uuid())`,[id]);
      await source.query(`INSERT INTO taste_journals VALUES($1,'{"synthetic":true}',gen_random_uuid(),gen_random_uuid(),now())`,[id]);
    }
    const outputs=await source.exec(await readFile(new URL('../export.sql',import.meta.url),'utf8'));
    const snapshot=outputs.flatMap(result=>result.rows).find(row=>row.jsonb_build_object).jsonb_build_object;
    const rsa=generateKeyPairSync('rsa',{modulusLength:3072,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
    const signer=generateKeyPairSync('ed25519',{publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
    const fp=publicFingerprint(rsa.publicKey),archive=seal(snapshot,rsa.publicKey,fp);
    const recovered=unseal(archive,rsa.privateKey,fp,sha256(archive));
    const stamp=new Date().toISOString(),signBody=body=>({...body,signature:sign(null,Buffer.from(canonical(body)),signer.privateKey).toString('base64')});
    const ledger=signBody({project:PROJECT,epoch:randomUUID(),sequence:1,observedAt:stamp,events:[{sequence:1,userId:deleted,deletedAt:stamp,previous:'0'.repeat(64)}]});
    const owners=signBody({project:PROJECT,observedAt:stamp,owners:[live]});
    const plan=restorePlan(recovered,ledger,signer.publicKey,{epoch:ledger.epoch,sequence:1,digest:ledgerDigest(ledger)},owners);
    assert.equal(plan.applicationAuthorized,false);assert.equal(plan.rejected.deleted,2);
    await target.query('INSERT INTO owners VALUES($1)',[live]);
    // This insertion exists ONLY inside a synthetic in-memory test, not a deployable importer.
    await target.transaction(async tx=>{
      for(const [table,columns] of Object.entries(SCHEMA)) for(const row of plan.tables[table]) {
        await tx.query(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map((_,i)=>'$'+(i+1)).join(',')})`,columns.map(c=>c==='state'?JSON.stringify(row[c]):row[c]));
      }
    });
    for(const table of Object.keys(SCHEMA)) {
      const rows=(await target.query(`SELECT user_id,revision,last_write_id,state FROM ${table}`)).rows;
      assert.equal(rows.length,1);assert.equal(rows[0].user_id,live);assert.equal(rows[0].last_write_id,null);assert.deepEqual(rows[0].state,{synthetic:true});
      const old=snapshot.tables[table].find(row=>row.user_id===live).revision;
      assert.notEqual(rows[0].revision,old);
      const stale=await target.query(`UPDATE ${table} SET state='{}' WHERE user_id=$1 AND revision=$2 RETURNING user_id`,[live,old]);
      assert.equal(stale.rows.length,0);
    }
  } finally {await source.close();await target.close();}
});
