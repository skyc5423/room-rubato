import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,mkdir,rm,symlink,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {packageAppCandidate,PACKAGE_FILES} from '../package-app-candidate.mjs';
const root=fileURLToPath(new URL('../../../',import.meta.url));
async function sandbox(t){const p=await mkdtemp(join(tmpdir(),'rubato-package-test-'));t.after(()=>rm(p,{recursive:true,force:true}));return p;}
async function fixture(p){const r=join(p,'source');for(const [s] of PACKAGE_FILES){await mkdir(dirname(join(r,s)),{recursive:true});await writeFile(join(r,s),await readFile(join(root,s)));}return r;}
async function files(p,prefix=''){let result=[];for(const f of await readdir(p,{withFileTypes:true})){const k=prefix+f.name;if(f.isDirectory())result.push(...await files(join(p,f.name),k+'/'));else result.push(k);}return result.sort();}

test('isolated package exactly matches allowlist and hashed manifest; deployed entry imports without dependencies',async t=>{
 const p=await sandbox(t),src=await fixture(p),out=join(p,'package');
 // Never include secret-bearing side files, deployments, datasets or install output.
 for(const f of ['.env.local','.vercel/project.json','data/users.json','node_modules/secret.txt','ops/blob-app-candidate/escrow.pem']){await mkdir(dirname(join(src,f)),{recursive:true});await writeFile(join(src,f),'excluded_canary_7d3a1');}
 const manifest=await packageAppCandidate(out,{root:src});
 assert.equal(manifest.enabled,false);assert.equal(manifest.files.length,14);
 assert.deepEqual(await files(out),[...manifest.files.map(f=>f.path),'manifest.json'].sort());
 for(const f of manifest.files){const bytes=await readFile(join(out,f.path));assert.equal(bytes.length,f.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);assert.equal(bytes.includes('excluded_canary_7d3a1'),false);}
 const entry=await import(pathToFileURL(join(out,'api/app-backup.mjs')));
 assert.equal(typeof entry.default,'function');
 const response={headers:{},setHeader(k,v){this.headers[k]=v;},end(body){this.body=body;}};
 await entry.default({method:'POST',url:'/api/app-backup',headers:{}},response);
 assert.equal(response.statusCode,503);assert.match(response.body,/BACKUP_INACTIVE/);
 assert.equal(response.headers['cache-control'],'no-store');
 const v=JSON.parse(await readFile(join(out,'vercel.json')));
 assert.equal(v.crons,undefined);assert.deepEqual(v.routes,[{src:'/api/app-backup',dest:'/api/app-backup.mjs'},{src:'/.*',status:404}]);
});
test('package refuses activation, enrolled keys, literal secrets and linked source files before writing',async t=>{
 const p=await sandbox(t),src=await fixture(p),configPath=join(src,'ops/blob-app-candidate/config.json');
 const baseline=await readFile(configPath,'utf8');
 for(const change of [{enabled:true},{publicKey:'enrolled'},{password:'never_copy'},{source:{password:'nested_never_copy'}}]){
  await writeFile(configPath,JSON.stringify({...JSON.parse(baseline),...change}));
  await assert.rejects(packageAppCandidate(join(p,'package'),{root:src}),/PACKAGE_INPUT_REJECTED/);
 }
 await writeFile(configPath,baseline);
 const runtime=join(src,'ops/blob-app-candidate/runtime.mjs'),original=await readFile(runtime);
 await writeFile(runtime,original+'\n// -----BEGIN PRIVATE KEY-----');
 await assert.rejects(packageAppCandidate(join(p,'package'),{root:src}),/PACKAGE_INPUT_REJECTED/);
 await rm(runtime);await symlink(join(root,'ops/blob-app-candidate/runtime.mjs'),runtime);
 await assert.rejects(packageAppCandidate(join(p,'package'),{root:src}),/PACKAGE_INPUT_REJECTED/);
 assert.equal((await files(p)).includes('package/manifest.json'),false);
});
test('builder never overwrites destination and rejects checkout-contained output',async t=>{
 const p=await sandbox(t),src=await fixture(p),out=join(p,'package');await mkdir(out);await writeFile(join(out,'keep'),'keep');
 await assert.rejects(packageAppCandidate(out,{root:src}),/EEXIST/);assert.equal(await readFile(join(out,'keep'),'utf8'),'keep');
 await assert.rejects(packageAppCandidate(join(src,'output'),{root:src}),/OUTSIDE_CHECKOUT/);
});
