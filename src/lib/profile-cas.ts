/** Candidate transport for the proposed CAS migration; not wired into production.
 * Keep a failed write's id for retry: a response can be lost after DB commit.
 */
export interface ProfileWrite {
  ownerId: string;
  expectedRevision: string | null;
  writeId: string;
  state: Record<string, unknown>;
  consentAgreedAt: string;
  consentVersion: string;
}
interface RpcResponse { data: unknown; error: { message: string; code?: string } | null }
export type ProfileRpc = (name: string, params: Record<string, unknown>) => PromiseLike<RpcResponse>;
export type SaveResult = { status: 'saved'; revision: string } | { status: 'conflict' } | { status: 'failed'; message: string };
export async function saveProfileCAS(rpc: ProfileRpc, write: ProfileWrite): Promise<SaveResult> {
  try {
    const { data, error } = await rpc('save_persona_cas', {
      p_owner_id: write.ownerId, p_expected_revision: write.expectedRevision, p_write_id: write.writeId,
      p_state: write.state, p_consent_agreed_at: write.consentAgreedAt,
      p_consent_version: write.consentVersion,
    });
    if (error?.message.includes('PERSONA_REVISION_CONFLICT')) return { status: 'conflict' };
    if (error) return { status: 'failed', message: error.message };
    if (typeof data !== 'string' || !data) return { status: 'failed', message: '저장 결과를 확인하지 못했어요.' };
    return { status: 'saved', revision: data };
  } catch {
    return { status: 'failed', message: '연결이 끊겼어요. 같은 저장 요청으로 다시 확인해 주세요.' };
  }
}
