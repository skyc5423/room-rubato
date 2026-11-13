// Service-managed signature, not a recovery/decryption key. Public key is sufficient to verify old backups.
import {sign,verify,createPrivateKey,createPublicKey} from 'node:crypto';import {ensure,canonical,PROJECT} from './core.mjs';
const fields=['project','bucketId','fileId','fileName','capturedAt','sha256','bytes','encryptionMode','acknowledgedAt','readbackVerified','restoreVerified'];
function validate(payload) {
  ensure(payload&&canonical(Object.keys(payload).sort())===canonical([...fields].sort()),'Invalid receipt fields');
  ensure(payload.project===PROJECT&&payload.bucketId==='a593f42c829bd620a011031b'&&payload.encryptionMode==='SSE-B2','Invalid receipt target');
  ensure(typeof payload.fileId==='string'&&payload.fileId&&/^snapshots\/\d{4}-\d{2}-\d{2}\/[a-f0-9-]{36}\.managed\.json$/.test(payload.fileName),'Invalid archive identity');
  ensure(/^[a-f0-9]{64}$/.test(payload.sha256)&&Number.isSafeInteger(payload.bytes)&&payload.bytes>0&&payload.bytes<=32*1024*1024,'Invalid archive digest/length');
  ensure(Number.isFinite(Date.parse(payload.capturedAt))&&Number.isFinite(Date.parse(payload.acknowledgedAt)),'Invalid receipt time');
  ensure(typeof payload.readbackVerified==='boolean'&&typeof payload.restoreVerified==='boolean','Invalid verification flags');return payload;
}
export function signReceipt(receipt,privatePem) {
  const payload=Object.fromEntries(fields.map(k=>[k,receipt[k]]));validate(payload);ensure(createPrivateKey(privatePem).asymmetricKeyType==='ed25519','Ed25519 required');
  const body={format:'room-rubato-managed-receipt-v1',payload};return {...body,signature:sign(null,Buffer.from(canonical(body)),privatePem).toString('base64')};
}
export function verifyReceipt(envelope,publicPem) {
  ensure(envelope&&canonical(Object.keys(envelope).sort())===canonical(['format','payload','signature']),'Invalid signed receipt');
  ensure(envelope.format==='room-rubato-managed-receipt-v1'&&createPublicKey(publicPem).asymmetricKeyType==='ed25519','Wrong receipt format/key');
  const signature=Buffer.from(envelope.signature,'base64');ensure(signature.length===64&&signature.toString('base64')===envelope.signature,'Invalid signature encoding');
  ensure(verify(null,Buffer.from(canonical({format:envelope.format,payload:envelope.payload})),publicPem,signature),'Invalid receipt signature');return validate(envelope.payload);
}
