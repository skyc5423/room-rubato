/** Enable only after custom SMTP, confirmation and recovery have been verified.
 * This is an application UI guard, not a substitute for provider configuration. */
export function isEmailSignupEnabled(): boolean {
  return process.env.NEXT_PUBLIC_EMAIL_SIGNUP_ENABLED === 'true';
}
export const EMAIL_SIGNUP_PAUSED_MESSAGE = '이메일 신규 가입은 아직 준비 중이에요. Google 로그인으로 시작해 주세요. 기존 이메일 계정은 로그인할 수 있어요.';
