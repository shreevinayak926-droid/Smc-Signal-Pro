import { User, GlobalAppSettings, SubscriptionTier } from '../types';

export interface AccessStatus {
  isGuest: boolean;
  isEligibleForGlobalFree: boolean;
  effectiveTier: SubscriptionTier;
  isPaidUser: boolean;
  isPro: boolean;
  isVIP: boolean;
  reason: 'GUEST' | 'EMAIL_UNVERIFIED' | 'BANNED' | 'EXPIRED' | 'ACTIVE_SUBSCRIPTION' | 'GLOBAL_FREE_ACCESS' | 'FREE_TRIAL';
  statusMessage?: string;
}

/**
 * Checks whether a given user is eligible for Global Free Access.
 * 
 * CRITICAL SIGNUP & VERIFICATION RULES:
 * 1. Visitors who have not signed up (unauthenticated / guest) must NOT receive free access.
 * 2. Logged-out users must sign in again.
 * 3. Banned or suspended accounts must NOT receive free access.
 * 4. If email verification is required (enforceEmailVerification), access is granted ONLY
 *    after the user has emailVerified === true.
 * 5. Fails closed: if globalSettings is null/unavailable, returns false.
 */
export function isUserEligibleForGlobalFreeAccess(
  user: User | null,
  globalSettings: GlobalAppSettings | null
): boolean {
  if (!globalSettings || !globalSettings.globalFreeAccess) {
    return false;
  }

  // 1. Visitors who have not signed up / logged out users
  if (!user || !user.id || !user.email) {
    return false;
  }

  // 2. Suspended / Banned users
  if (user.status === 'BANNED') {
    return false;
  }

  // 3. Admin-managed Free Plan users: if admin explicitly placed user on Free Plan (subscriptionExpiresAt === 0 or vipFeatures === false), they strictly access only the Free Plan
  if (user.tier === 'FREE_TRIAL' && (user.subscriptionExpiresAt === 0 || user.permissions?.vipFeatures === false)) {
    return false;
  }

  // 4. Email verification requirement
  // Default to requiring verification unless explicitly set to false
  const requireVerification = globalSettings.enforceEmailVerification ?? true;
  if (requireVerification && !user.emailVerified) {
    return false;
  }

  return true;
}

/**
 * Evaluates comprehensive tier, feature permissions, and gating rules.
 *
 * Behavior:
 * - When Global Free Access is ON:
 *   Eligible authenticated users receive full INSTITUTIONAL_VIP access without payment.
 *   Visitors and unverified accounts remain restricted.
 * - When Global Free Access is OFF (or settings unavailable):
 *   Restores normal subscription, trial, and payment restrictions.
 *   Preserves existing subscription records and billing history in the database.
 */
export function evaluateUserAccess(
  user: User | null,
  trialInfo: any | null,
  globalSettings: GlobalAppSettings | null
): AccessStatus {
  // 1. Unauthenticated Visitor
  if (!user || !user.id || !user.email) {
    return {
      isGuest: true,
      isEligibleForGlobalFree: false,
      effectiveTier: 'FREE_TRIAL',
      isPaidUser: false,
      isPro: false,
      isVIP: false,
      reason: 'GUEST',
      statusMessage: 'Please sign in or register to access institutional trading tools.',
    };
  }

  // 2. Banned Account
  if (user.status === 'BANNED') {
    return {
      isGuest: false,
      isEligibleForGlobalFree: false,
      effectiveTier: 'FREE_TRIAL',
      isPaidUser: false,
      isPro: false,
      isVIP: false,
      reason: 'BANNED',
      statusMessage: 'This account has been suspended by administration.',
    };
  }

  // 3. Administrator: Always Institutional VIP
  if (user.role === 'ADMIN') {
    return {
      isGuest: false,
      isEligibleForGlobalFree: false,
      effectiveTier: 'INSTITUTIONAL_VIP',
      isPaidUser: true,
      isPro: true,
      isVIP: true,
      reason: 'ACTIVE_SUBSCRIPTION',
      statusMessage: 'Super Administrator Master Access Active.',
    };
  }

  const isGlobalFreeActive = Boolean(globalSettings?.globalFreeAccess);
  const isEligible = isUserEligibleForGlobalFreeAccess(user, globalSettings);

  // 4. When Global Free Access is ON
  if (isGlobalFreeActive) {
    if (isEligible) {
      return {
        isGuest: false,
        isEligibleForGlobalFree: true,
        effectiveTier: 'INSTITUTIONAL_VIP',
        isPaidUser: true,
        isPro: true,
        isVIP: true,
        reason: 'GLOBAL_FREE_ACCESS',
        statusMessage: 'Global Free Access is ON: Full Institutional VIP unlocked for your account.',
      };
    }

    // Registered user whose email is not yet verified
    const requireVerification = globalSettings?.enforceEmailVerification ?? true;
    if (requireVerification && !user.emailVerified) {
      return {
        isGuest: false,
        isEligibleForGlobalFree: false,
        effectiveTier: 'FREE_TRIAL',
        isPaidUser: false,
        isPro: false,
        isVIP: false,
        reason: 'EMAIL_UNVERIFIED',
        statusMessage: 'Email verification required. Please click the link in your email to activate free access.',
      };
    }
  }

  // 5. When Global Free Access is OFF (or fail-safe default)
  // Restore normal subscription, payment, and plan restrictions
  const isSubscriptionExpired = user.subscriptionExpiresAt
    ? Date.now() > user.subscriptionExpiresAt
    : false;
  const rawTier = user.tier || trialInfo?.tier || 'FREE_TRIAL';
  const effectiveTier: SubscriptionTier = isSubscriptionExpired ? 'FREE_TRIAL' : rawTier;

  const isVIP = effectiveTier === 'INSTITUTIONAL_VIP' && !isSubscriptionExpired;
  const isPro = (effectiveTier === 'PRO_TRADER' || isVIP) && !isSubscriptionExpired;
  const isPaidUser = isPro || isVIP;

  return {
    isGuest: false,
    isEligibleForGlobalFree: false,
    effectiveTier,
    isPaidUser,
    isPro,
    isVIP,
    reason: isSubscriptionExpired ? 'EXPIRED' : (isPaidUser ? 'ACTIVE_SUBSCRIPTION' : 'FREE_TRIAL'),
    statusMessage: isPaidUser ? 'Active Paid Subscription' : (isSubscriptionExpired ? 'Subscription Expired' : 'Free Trial'),
  };
}
