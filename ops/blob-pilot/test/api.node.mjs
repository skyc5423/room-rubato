import test from 'node:test';
import assert from 'node:assert/strict';
import run from '../api/run.mjs';
import status from '../api/status.mjs';
import archive from '../api/archive.mjs';
function response(){return {code:null,body:null,setHeader(){},status(c){this.code=c;return this;},json(b){this.body=b;return this;},send(b){this.body=b;return this;}};}
test('every endpoint refuses anonymous requests before storage access',async()=>{for(const [handler,method] of [[run,'GET'],[run,'POST'],[status,'GET'],[archive,'POST']]){const r=response();await handler({method,headers:{},body:{}},r);assert.equal(r.code,401);}});
test('methods separated and manual secret cannot claim cron authentication',async()=>{
 const previous={CRON_SECRET:process.env.CRON_SECRET,PILOT_RUN_SECRET:process.env.PILOT_RUN_SECRET};process.env.CRON_SECRET='c'.repeat(64);process.env.PILOT_RUN_SECRET='p'.repeat(64);
 try{const a=response();await run({method:'GET',headers:{authorization:'Bearer '+'p'.repeat(64)}},a);assert.equal(a.code,401);const b=response();await run({method:'POST',headers:{authorization:'Bearer '+'c'.repeat(64)}},b);assert.equal(b.code,401);for(const handler of [run,status,archive]){const r=response();await handler({method:'DELETE',headers:{}},r);assert.equal(r.code,405);}}
 finally{for(const[k,v]of Object.entries(previous))if(v===undefined)delete process.env[k];else process.env[k]=v;}
});
test('archive endpoint rejects arbitrary paths, surplus fields and malformed IDs',async()=>{
 const old=process.env.PILOT_RUN_SECRET;process.env.PILOT_RUN_SECRET='p'.repeat(64);
 try{for(const body of [{runId:'../private.pem'},{runId:'2026-11-17',path:'other'},{}]){const r=response();await archive({method:'POST',headers:{authorization:'Bearer '+'p'.repeat(64)},body},r);assert.equal(r.code,400);}}
 finally{if(old===undefined)delete process.env.PILOT_RUN_SECRET;else process.env.PILOT_RUN_SECRET=old;}
});
