/**
 * Unified direct navigation to the trading dashboard
 */
export async function redirectToDashboard(): Promise<void> {
  if (typeof window !== 'undefined') {
    window.location.href = '/dashboard';
  }
}

/**
 * Check if user has email verified
 */
export function isEmailVerified(user: { email_confirmed_at?: string | null } | null): boolean {
  return Boolean(user?.email_confirmed_at);
}
