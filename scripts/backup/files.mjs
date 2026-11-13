import {open,constants} from 'node:fs/promises';
import {ensure} from './core.mjs';
// Bound untrusted inputs before allocation; reject final-component symlinks.
export async function readBounded(path,limit,privateOnly=false) {
  const file=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);
  try {
    const info=await file.stat();
    ensure(info.isFile() && info.size<=limit && (!privateOnly || (info.mode&0o077)===0),'Unsafe input file');
    const buffer=Buffer.alloc(info.size+1); const {bytesRead}=await file.read(buffer,0,buffer.length,0);
    ensure(bytesRead===info.size,'Input changed while reading'); return buffer.subarray(0,bytesRead);
  } finally { await file.close(); }
}
