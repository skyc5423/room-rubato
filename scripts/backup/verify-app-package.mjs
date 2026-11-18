/** Offline installed-dependency/import smoke. Never connects or creates a client. */
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=resolve(process.argv[2]||'');
if(!process.argv[2])throw Error('package directory required');
const require=createRequire(pathToFileURL(resolve(root,'package.json')));
for(const [name,version] of [['@vercel/blob','2.9.0'],['pg','8.16.3']]){
 const lock=JSON.parse(await readFile(resolve(root,'package-lock.json')));
 assert.equal(lock.packages[`node_modules/${name}`].version,version);
}
const store=await import(pathToFileURL(resolve(root,'scripts/backup/blob-store.mjs')));
store.assertAppBlobRuntime(); // before first pinned SDK import
const sdk=await import(pathToFileURL(require.resolve('@vercel/blob')));
assert.equal(typeof sdk.get,'function');assert.equal(typeof sdk.put,'function');
const pg=await import(pathToFileURL(require.resolve('pg')));assert.equal(typeof pg.default.Client,'function');
const {default:entry}=await import(pathToFileURL(resolve(root,'api/app-backup.mjs')));
const res={headers:{},setHeader(k,v){this.headers[k]=v;},end(body){this.body=body;}};
await entry({method:'POST',url:'/api/app-backup',headers:{}},res);
assert.equal(res.statusCode,503);assert.deepEqual(JSON.parse(res.body),{code:'BACKUP_INACTIVE'});
console.log('Standalone dependency imports and inactive route verified; no source/store call.');
