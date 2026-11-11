import { describe, expect, it } from 'vitest';
import { saveProfileCAS, type ProfileWrite, type ProfileRpc } from '../src/lib/profile-cas';
const write = (writeId: string, expectedRevision: string | null, state: Record<string,unknown>): ProfileWrite => ({ ownerId: 'alice', writeId, expectedRevision, state, consentAgreedAt: '2026-11-10T00:00:00Z', consentVersion: 'test' });
// Atomic server contract model. This is NOT a PostgreSQL integration test.
function server() {
  let revision: string | null = null; let state = {}; let lastWrite: unknown = null; let count = 0;
  const rpc: ProfileRpc = async (_name, p) => {
    if (p.p_write_id === lastWrite) return { data: revision, error: null };
    if (p.p_expected_revision !== revision) return { data: null, error: { message: 'PERSONA_REVISION_CONFLICT', code: 'P0001' } };
    revision = `revision-${++count}`; state = p.p_state as object; lastWrite = p.p_write_id;
    return { data: revision, error: null };
  };
  return { rpc, state: () => state };
}
describe('candidate profile CAS contract', () => {
  it('one of two clients with the same base wins, without overwriting it', async () => {
    const s = server();
    const results = await Promise.all([saveProfileCAS(s.rpc, write('a', null, { a: 1 })), saveProfileCAS(s.rpc, write('b', null, { b: 2 }))]);
    expect(results.map(r=>r.status)).toEqual(['saved','conflict']); expect(s.state()).toEqual({a:1});
  });
  it('retry after a lost response is idempotent', async () => {
    const s = server(); const request = write('a', null, {a:1});
    const lostResponse: ProfileRpc = async (name,p) => { await s.rpc(name,p); throw Error('network'); };
    expect((await saveProfileCAS(lostResponse, request)).status).toBe('failed');
    expect(await saveProfileCAS(s.rpc, request)).toEqual({status:'saved',revision:'revision-1'});
  });
  it('a stale client cannot restore old data after a reset', async () => {
    const s=server(); await saveProfileCAS(s.rpc,write('a',null,{a:1}));
    await saveProfileCAS(s.rpc,write('reset','revision-1',{}));
    expect((await saveProfileCAS(s.rpc,write('stale','revision-1',{a:1}))).status).toBe('conflict');
    expect(s.state()).toEqual({});
  });
});
