/** Staged protocol only: not wired into live account UI until hosted verification. */
export const WITHDRAWAL_CONFIRMATION = 'DELETE MY ACCOUNT';
export type WithdrawalResult =
  | { status: 'deleted' }
  | { status: 'disabled' | 'confirmation-required' | 'sign-in-required' | 'blocked' | 'unknown' | 'account-changed' };

type Client = {
  auth: { getUser: () => Promise<{ data: { user: { id: string } | null }; error: unknown }> };
  rpc: (name: string, args: { p_confirmation: string; p_expected_owner: string; p_expected_session: string }) => PromiseLike<{ data: unknown; error: { code?: string; message?: string } | null }>;
};

/** No admin key, caller-controlled deletion target, cookie-auth endpoint, or decoded-JWT trust. */
export async function withdrawOwnAccount(
  client: Client, confirmation: string, enabled = false, expectedOwner?: string, expectedSession?: string,
): Promise<WithdrawalResult> {
  if (!enabled) return { status: 'disabled' };
  if (confirmation !== WITHDRAWAL_CONFIRMATION) return { status: 'confirmation-required' };
  try {
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return { status: 'sign-in-required' };
    // Caller captures this identity when opening confirmation, never at submit.
    if (!expectedOwner || !expectedSession || data.user.id !== expectedOwner) return { status: 'account-changed' };
    const result = await client.rpc('withdraw_own_account', { p_confirmation: confirmation, p_expected_owner: expectedOwner, p_expected_session: expectedSession });
    if (result.error) {
      if (result.error.message === 'WITHDRAWAL_DISABLED') return { status: 'disabled' };
      if (result.error.code === '42501') return { status: 'sign-in-required' };
      // A database exception is a rolled-back transaction. Network/PostgREST
      // errors cannot prove rollback and must not be reported as "not deleted".
      if (result.error.code === 'P0001' || result.error.code === '22023') return { status: 'blocked' };
      return { status: 'unknown' };
    }
    return { status: result.data === true ? 'deleted' : 'unknown' };
  } catch {
    // Lost acknowledgments are not success. Do not erase local recovery copies
    // or retry automatically, and never show raw server errors containing data.
    return { status: 'unknown' };
  }
}
