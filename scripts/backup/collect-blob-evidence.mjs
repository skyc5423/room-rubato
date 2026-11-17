/** Explicit offline CLI. Never fetch logs, recover keys, deploy, or write hosted data. */
import {mkdir,open,realpath} from 'node:fs/promises';
import {resolve,dirname,isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readBounded} from './files.mjs';
import {analyzeLogs,collectEvidence,evaluateMonitoring,LIMIT} from './blob-evidence.mjs';
export async function readEvidenceInput(path,limit){
 const absolute=resolve(path);if(await realpath(dirname(absolute))!==dirname(absolute))throw Error('INPUT_PARENT_SYMLINK');
 return readBounded(absolute,limit,true);
}
export async function saveEvidence(output,collection,monitor){
 if(!isAbsolute(output)||await realpath(dirname(output))!==resolve(dirname(output)))throw Error('OUTPUT_PATH');
 const files={'evidence.json':JSON.stringify(collection.evidence,null,2)+'\n','receipt.json':JSON.stringify(collection.receipt,null,2)+'\n','bundle.json':collection.bundle,'report.json':JSON.stringify({...collection.report,monitor},null,2)+'\n'};
 // Exclusive directory creation: existing files/directories/symlinks are never replaced.
 await mkdir(output,{mode:0o700});
 for(const [name,body]of Object.entries(files)){const f=await open(resolve(output,name),'wx',0o600);try{await f.writeFile(body);}finally{await f.close();}}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 let report;
 try{
  const [input,deployment,day,output,restoreFile,nowArg,requestId,bundleDigest]=process.argv.slice(2);
  if(!input||!deployment||!day||!output)throw Error('ARGUMENTS');
  const now=nowArg?Date.parse(nowArg):Date.now();const text=(await readEvidenceInput(input,LIMIT)).toString('utf8');
  const analysis=analyzeLogs(text,{deployment,day,requestId,bundleDigest});let collection=null,failureCode=null;
  try{collection=collectEvidence(analysis);}catch(e){if(e.code!=='NO_EVIDENCE')failureCode=e.code??'INVALID_EVIDENCE';}
  const restoreReport=restoreFile&&restoreFile!=='-'?JSON.parse((await readEvidenceInput(restoreFile,8192)).toString('utf8')):null;
  report=evaluateMonitoring({day,now,collection,restoreReport,failureCode});
  if(collection)await saveEvidence(output,collection,report);
  console.log(JSON.stringify(report));process.exitCode=report.status==='failure'?1:report.status==='missing'?2:0;
 }catch{console.log(JSON.stringify({synthetic:true,status:'failure',reason:'OFFLINE_COLLECTION_REJECTED',productionReady:false,independentKeyEscrowConfigured:false}));process.exitCode=1;}
}
