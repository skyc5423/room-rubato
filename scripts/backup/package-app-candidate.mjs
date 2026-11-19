/** Offline allowlisted package. Does not install, link, deploy or load any credentials. */
import {readFile,lstat,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,relative,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {canonical} from './core.mjs';
import {BLOB_SOURCE_TARGET} from './blob-source.mjs';
import {BLOB_TARGET} from './blob-store.mjs';
const ROOT=fileURLToPath(new URL('../../',import.meta.url));
export const PACKAGE_FILES=Object.freeze([
 ['ops/blob-app-candidate/package.json','package.json'],
 ['ops/blob-app-candidate/package-lock.json','package-lock.json'],
 ['ops/blob-app-candidate/vercel.json','vercel.json'],
 ['ops/blob-app-candidate/api/app-backup.mjs','ops/blob-app-candidate/api/app-backup.mjs'],
 ['ops/blob-app-candidate/runtime.mjs','ops/blob-app-candidate/runtime.mjs'],
 ['ops/blob-app-candidate/config.json','ops/blob-app-candidate/config.json'],
 ...['core.mjs','blob-export.mjs','blob-source.mjs','blob-store.mjs','blob-runtime.mjs','export.sql','supabase-ca.pem'].map(n=>[`scripts/backup/${n}`,`scripts/backup/${n}`])
]);
const fail=()=>{throw Error('PACKAGE_INPUT_REJECTED');};
// A deny-pattern is supplementary; exact allowlisting excludes secrets/rows/fixtures by path.
const secretPattern=/-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----|vercel_blob_rw_[A-Za-z0-9]+_[A-Za-z0-9_-]{16,}|postgres(?:ql)?:\/\/[^\s]+:[^\s]+@/;
export async function packageAppCandidate(destination,{root=ROOT}={}){
 const base=resolve(root),out=resolve(destination);
 if(out===base||relative(base,out).split(sep)[0]!== '..')throw Error('PACKAGE_DESTINATION_MUST_BE_OUTSIDE_CHECKOUT');
 const inputs=[];
 for(const [source,target] of PACKAGE_FILES){
  // Reject intermediate links as well as symlink files; never follow secrets via a link.
  let current=base;
  for(const part of source.split('/')){current=resolve(current,part);if((await lstat(current)).isSymbolicLink())fail();}
  if(!(await lstat(current)).isFile())fail();
  const bytes=await readFile(current);if(bytes.length>256*1024||secretPattern.test(bytes.toString('utf8')))fail();
  inputs.push({source,target,bytes});
 }
 inputs.push({source:null,target:'api/app-backup.mjs',bytes:Buffer.from("export {default,config} from '../ops/blob-app-candidate/api/app-backup.mjs';\n")});
 const config=JSON.parse(inputs.find(i=>i.target.endsWith('/config.json')).bytes);
 // This preparatory build cannot emit an active or enrolled package.
 const expectedConfig={enabled:false,mode:'app-data-candidate',sourceProject:'nhusocbyuxzjsfwitkhe',source:BLOB_SOURCE_TARGET,destination:BLOB_TARGET,confirmedScope:['persona_profiles','taste_journals'],keyFingerprint:'',receiptKeyFingerprint:'',maxArchiveBytes:50331648};
 if(canonical(config)!==canonical(expectedConfig))fail();
 const pkg=JSON.parse(inputs.find(i=>i.target==='package.json').bytes);
 const lock=JSON.parse(inputs.find(i=>i.target==='package-lock.json').bytes);
 if(pkg.private!==true||pkg.type!=='module'||pkg.scripts||JSON.stringify(pkg.dependencies)!==JSON.stringify({'@vercel/blob':'2.9.0',pg:'8.16.3'}))fail();
 if(lock.packages?.['node_modules/@vercel/blob']?.version!=='2.9.0'||lock.packages?.['node_modules/pg']?.version!=='8.16.3')fail();
 for(const p of Object.values(lock.packages||{}))if(p.resolved&&(!p.resolved.startsWith('https://registry.npmjs.org/')||!p.integrity))fail();
 const v=JSON.parse(inputs.find(i=>i.target==='vercel.json').bytes);
 const expectedVercel={version:2,framework:null,functions:{'api/app-backup.mjs':{maxDuration:300,includeFiles:'{ops/blob-app-candidate/config.json,scripts/backup/export.sql,scripts/backup/supabase-ca.pem}'}},routes:[{src:'/api/app-backup',dest:'/api/app-backup.mjs'},{src:'/.*',status:404}]};
 if(canonical(v)!==canonical(expectedVercel))fail();
 await mkdir(out,{recursive:false,mode:0o700}); // existing/nonempty destination is never overwritten
 for(const {target,bytes} of inputs){await mkdir(dirname(resolve(out,target)),{recursive:true});await writeFile(resolve(out,target),bytes,{flag:'wx',mode:0o600});}
 const manifest={format:'room-rubato-inactive-package-v1',enabled:false,files:inputs.map(({target,bytes})=>({path:target,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')}))};
 await writeFile(resolve(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx',mode:0o600});
 return manifest;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length!==3)throw Error('Usage: node scripts/backup/package-app-candidate.mjs <new-directory-outside-checkout>');
 const m=await packageAppCandidate(process.argv[2]);console.log(JSON.stringify({enabled:m.enabled,files:m.files.length}));
}
