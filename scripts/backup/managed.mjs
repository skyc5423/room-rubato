import {ensure,validateSnapshot,sha256,MAX_BYTES} from './core.mjs';
/** Service-managed encryption: downloaded bytes are plaintext and must remain private. */
export function readManagedSnapshot(bytes,independentDigest,now=Date.now()) {
  ensure(Buffer.isBuffer(bytes) && bytes.length<=MAX_BYTES,'Snapshot too large');
  ensure(typeof independentDigest==='string' && /^[a-f0-9]{64}$/.test(independentDigest) && sha256(bytes)===independentDigest,'Independent receipt mismatch');
  return validateSnapshot(JSON.parse(bytes.toString()),now);
}
