import { supabase, isSupabaseConfigured } from './supabase';
import {
  User,
  UserPermissions,
  SubscriptionTier,
  PaymentProofRequest,
  PaymentSettings,
  SubscriptionPlan,
  ActivityLog,
  CentralFeaturesDB,
  GlobalAppSettings,
  PushAlert,
  SocialTrader,
  CouponCode,
  CouponValidationResult,
  SupportTicket,
  SupportMessage,
  WebsiteSettings,
} from '../types';

export const DEFAULT_USER_PERMISSIONS: UserPermissions = {
  tradingAccess: true,
  buyAccess: true,
  sellAccess: true,
  fvgAccess: true,
  chochAccess: true,
  aiScanAccess: true,
  pineScriptAccess: true,
  tradingViewAccess: true,
  indicatorAccess: true,
  marketDataAccess: true,
  vipFeatures: false,
  advancedAnalysis: true,
  adminAccess: false,
};

// ==========================================
// 1. USERS & PROFILES (public.profiles)
// ==========================================

export function toDbTier(tier?: string): string {
  if (!tier || tier === 'FREE_TRIAL') return 'TRIAL';
  return tier;
}

export function fromDbTier(tier?: string): SubscriptionTier {
  if (!tier || tier === 'TRIAL' || tier === 'FREE_TRIAL') return 'FREE_TRIAL';
  if (tier === 'PRO_TRADER') return 'PRO_TRADER';
  if (tier === 'INSTITUTIONAL_VIP') return 'INSTITUTIONAL_VIP';
  return 'FREE_TRIAL';
}

export async function supabaseGetUser(userId: string): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      if (error && error.code !== 'PGRST116') {
        console.warn('[Supabase] getUser error:', error.message);
      }
      return null;
    }

    const resolvedTier = fromDbTier(data.tier);
    const resolvedExpiry = (data.subscription_expires_at !== undefined && data.subscription_expires_at !== null)
      ? Number(data.subscription_expires_at)
      : (resolvedTier === 'FREE_TRIAL' ? 0 : Date.now() + 30 * 86400000);

    return {
      id: data.id,
      email: data.email,
      name: data.name || 'Trader',
      role: data.role || 'USER',
      tier: resolvedTier,
      status: data.status || 'ACTIVE',
      createdAt: Number(data.created_at) || Date.now(),
      lastLoginAt: Number(data.last_login_at) || Date.now(),
      subscriptionExpiresAt: resolvedExpiry,
      emailVerified: Boolean(data.email_verified),
      permissions: data.permissions || DEFAULT_USER_PERMISSIONS,
    };
  } catch (err) {
    console.warn('[Supabase] getUser exception:', err);
    return null;
  }
}

export async function supabaseSaveUser(user: User): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tier: toDbTier(user.tier),
      status: user.status,
      created_at: user.createdAt,
      last_login_at: user.lastLoginAt || Date.now(),
      subscription_expires_at: user.subscriptionExpiresAt,
      email_verified: Boolean(user.emailVerified),
      permissions: user.permissions || DEFAULT_USER_PERMISSIONS,
      updated_at: Date.now(),
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('[Supabase] saveUser error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] saveUser exception:', err);
    return false;
  }
}

export async function supabaseUpdateUser(userId: string, data: Partial<User>): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const payload: Record<string, any> = { updated_at: Date.now() };
    if (data.name !== undefined) payload.name = data.name;
    if (data.role !== undefined) payload.role = data.role;
    if (data.tier !== undefined) payload.tier = toDbTier(data.tier);
    if (data.status !== undefined) payload.status = data.status;
    if (data.subscriptionExpiresAt !== undefined) payload.subscription_expires_at = data.subscriptionExpiresAt;
    if (data.lastLoginAt !== undefined) payload.last_login_at = data.lastLoginAt;
    if (data.emailVerified !== undefined) payload.email_verified = data.emailVerified;
    if (data.permissions !== undefined) payload.permissions = data.permissions;

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId);

    if (error) {
      console.error('[Supabase] updateUser error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] updateUser exception:', err);
    return false;
  }
}

export async function supabaseDeleteUser(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('[Supabase] deleteUser error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] deleteUser exception:', err);
    return false;
  }
}

export async function supabaseGetAllUsers(): Promise<User[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('[Supabase] getAllUsers error:', error?.message);
      return [];
    }

    return data.map((d: any) => {
      const tier = fromDbTier(d.tier);
      const subscriptionExpiresAt = (d.subscription_expires_at !== undefined && d.subscription_expires_at !== null)
        ? Number(d.subscription_expires_at)
        : (tier === 'FREE_TRIAL' ? 0 : Date.now() + 30 * 86400000);

      return {
        id: d.id,
        email: d.email,
        name: d.name || 'Trader',
        role: d.role || 'USER',
        tier,
        status: d.status || 'ACTIVE',
        createdAt: Number(d.created_at) || Date.now(),
        lastLoginAt: Number(d.last_login_at) || Date.now(),
        subscriptionExpiresAt,
        emailVerified: Boolean(d.email_verified),
        permissions: d.permissions || DEFAULT_USER_PERMISSIONS,
      };
    });
  } catch (err) {
    console.error('[Supabase] getAllUsers exception:', err);
    return [];
  }
}

export function supabaseSubscribeToUser(userId: string, callback: (user: User | null) => void): (() => void) | null {
  if (!isSupabaseConfigured()) return null;
  try {
    const channel = supabase
      .channel(`profile-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        (payload: any) => {
          if (payload.eventType === 'DELETE') {
            callback(null);
          } else if (payload.new) {
            const d = payload.new;
            const tier = fromDbTier(d.tier);
            const subscriptionExpiresAt = (d.subscription_expires_at !== undefined && d.subscription_expires_at !== null)
              ? Number(d.subscription_expires_at)
              : (tier === 'FREE_TRIAL' ? 0 : Date.now() + 30 * 86400000);

            callback({
              id: d.id,
              email: d.email,
              name: d.name || 'Trader',
              role: d.role || 'USER',
              tier,
              status: d.status || 'ACTIVE',
              createdAt: Number(d.created_at) || Date.now(),
              lastLoginAt: Number(d.last_login_at) || Date.now(),
              subscriptionExpiresAt,
              emailVerified: Boolean(d.email_verified),
              permissions: d.permissions || DEFAULT_USER_PERMISSIONS,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch {
    return null;
  }
}



export function supabaseSubscribeToAllUsers(callback: () => void): (() => void) | null {
  if (!isSupabaseConfigured()) return null;
  try {
    const channel = supabase
      .channel('realtime-all-profiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          callback();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch {
    return null;
  }
}



// ==========================================
// 2. PAYMENT REQUESTS (public.payment_requests)
// ==========================================

export async function supabaseSubmitPayment(proof: PaymentProofRequest): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const payload = {
      id: proof.id,
      user_id: proof.userId || null,
      user_email: proof.userEmail,
      user_name: proof.userName || 'Trader',
      plan_id: proof.planId,
      amount: proof.totalAmountINR || proof.priceUSD || 0,
      currency: 'INR',
      method: 'UPI_QR',
      transaction_id: proof.utrNumber,
      screenshot_url: proof.screenshotUrl || null,
      submitted_at: proof.submittedAt || Date.now(),
      status: 'PENDING',
      updated_at: Date.now(),
    };

    const { error } = await supabase
      .from('payment_requests')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('[Supabase] submitPayment error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] submitPayment exception:', err);
    return false;
  }
}

export async function supabaseGetAllPayments(): Promise<PaymentProofRequest[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase
      .from('payment_requests')
      .select('*')
      .order('submitted_at', { ascending: false })
      .limit(100);

    if (error || !data) {
      console.error('[Supabase] getAllPayments error:', error?.message);
      return [];
    }

    return data.map((d: any) => ({
      id: d.id,
      userId: d.user_id,
      userEmail: d.user_email,
      userName: d.user_name,
      planId: d.plan_id,
      planName: d.plan_id === 'INSTITUTIONAL_VIP' ? 'Institutional VIP' : 'Pro Trader Monthly',
      priceUSD: Number(d.amount) / 83 || 49,
      conversionRate: 83,
      baseAmountINR: Number(d.amount),
      gstAmountINR: 0,
      totalAmountINR: Number(d.amount),
      utrNumber: d.transaction_id,
      screenshotUrl: d.screenshot_url || '',
      submittedAt: Number(d.submitted_at),
      status: d.status,
      rejectionReason: d.rejection_reason,
      approvedAt: d.approved_at ? Number(d.approved_at) : undefined,
    }));
  } catch (err) {
    console.error('[Supabase] getAllPayments exception:', err);
    return [];
  }
}

export async function supabaseApprovePayment(
  requestId: string,
  adminEmail: string = 'admin@smcsignal.pro'
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    // 1. Get request
    const { data: reqData, error: reqErr } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (reqErr || !reqData) return false;

    // 2. Update status
    const now = Date.now();
    await supabase
      .from('payment_requests')
      .update({
        status: 'APPROVED',
        approved_at: now,
        approved_by: adminEmail,
        updated_at: now,
      })
      .eq('id', requestId);

    // 3. Upgrade user by user_id or user_email and start 30 days active clock
    let targetProfile = null;
    let targetUserId = reqData.user_id;

    if (targetUserId) {
      const { data } = await supabase.from('profiles').select('*').eq('id', targetUserId).single();
      targetProfile = data;
    }
    if (!targetProfile && reqData.user_email) {
      const { data } = await supabase.from('profiles').select('*').eq('email', reqData.user_email).single();
      if (data) {
        targetProfile = data;
        targetUserId = data.id;
      }
    }

    if (targetUserId) {
      const nextTier = reqData.plan_id === 'INSTITUTIONAL_VIP' ? 'INSTITUTIONAL_VIP' : 'PRO_TRADER';
      // 30 Days Validity Window strictly begins at the moment of Administrator Approval
      const newExpiry = now + 30 * 24 * 60 * 60 * 1000;

      const updatedPermissions = {
        ...(targetProfile?.permissions || DEFAULT_USER_PERMISSIONS),
        vipFeatures: nextTier === 'INSTITUTIONAL_VIP',
        aiScanAccess: true,
        advancedAnalysis: true,
        pineScriptAccess: true,
      };

      await supabase
        .from('profiles')
        .update({
          tier: nextTier,
          subscription_expires_at: newExpiry,
          permissions: updatedPermissions,
          updated_at: now,
        })
        .eq('id', targetUserId);
    }

    return true;
  } catch (err) {
    console.error('[Supabase] approvePayment exception:', err);
    return false;
  }
}

export async function supabaseRejectPayment(
  requestId: string,
  reason: string,
  adminEmail: string = 'admin@smcsignal.pro'
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const now = Date.now();
    const { error } = await supabase
      .from('payment_requests')
      .update({
        status: 'REJECTED',
        rejection_reason: reason || 'Invalid Transaction / UTR ID',
        rejected_at: now,
        rejected_by: adminEmail,
        updated_at: now,
      })
      .eq('id', requestId);

    return !error;
  } catch (err) {
    console.error('[Supabase] rejectPayment exception:', err);
    return false;
  }
}

export function supabaseSubscribeToPayments(
  callback: (requests: PaymentProofRequest[]) => void
): (() => void) | null {
  if (!isSupabaseConfigured()) return null;
  try {
    const channel = supabase
      .channel('realtime-payment-requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payment_requests' },
        async () => {
          const list = await supabaseGetAllPayments();
          callback(list);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch {
    return null;
  }
}



// ==========================================
// 3. LIVE SIGNALS (public.signals)
// ==========================================

export interface LiveSignalRecord {
  id: string;
  pair: string;
  type: 'BUY' | 'SELL';
  entry: number;
  tp1: number;
  tp2?: number;
  sl: number;
  confidence: number;
  status: 'ACTIVE' | 'CLOSED' | 'INVALIDATED';
  timestamp: number;
  timeframe: string;
  smcReason: string;
}

export async function supabasePublishSignal(signal: LiveSignalRecord): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const payload = {
      id: signal.id,
      pair: signal.pair,
      type: signal.type,
      entry: signal.entry,
      tp1: signal.tp1,
      tp2: signal.tp2 || null,
      sl: signal.sl,
      confidence: signal.confidence,
      status: signal.status || 'ACTIVE',
      timestamp: signal.timestamp || Date.now(),
      timeframe: signal.timeframe || '15m',
      smc_reason: signal.smcReason,
      updated_at: Date.now(),
    };

    const { error } = await supabase
      .from('signals')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('[Supabase] publishSignal error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] publishSignal exception:', err);
    return false;
  }
}

export async function supabaseDeleteSignal(signalId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase
      .from('signals')
      .delete()
      .eq('id', signalId);

    return !error;
  } catch (err) {
    console.error('[Supabase] deleteSignal exception:', err);
    return false;
  }
}

export async function supabaseGetAllSignals(): Promise<LiveSignalRecord[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase
      .from('signals')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error || !data) {
      console.error('[Supabase] getAllSignals error:', error?.message);
      return [];
    }

    return data.map((d: any) => ({
      id: d.id,
      pair: d.pair,
      type: d.type,
      entry: Number(d.entry),
      tp1: Number(d.tp1),
      tp2: d.tp2 ? Number(d.tp2) : undefined,
      sl: Number(d.sl),
      confidence: Number(d.confidence) || 85,
      status: d.status,
      timestamp: Number(d.timestamp),
      timeframe: d.timeframe || '15m',
      smcReason: d.smc_reason || '',
    }));
  } catch (err) {
    console.error('[Supabase] getAllSignals exception:', err);
    return [];
  }
}

export function supabaseSubscribeToSignals(
  callback: (signals: LiveSignalRecord[]) => void
): (() => void) | null {
  if (!isSupabaseConfigured()) return null;
  try {
    const channel = supabase
      .channel('realtime-signals')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'signals' },
        async () => {
          const list = await supabaseGetAllSignals();
          callback(list);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch {
    return null;
  }
}



// ==========================================
// 4. BROADCAST ALERTS (public.broadcast_alerts)
// ==========================================

export async function supabaseBroadcastAlert(alert: PushAlert): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const payload = {
      id: alert.id,
      title: alert.title,
      message: alert.message,
      type: alert.type || 'info',
      timestamp: alert.timestamp || Date.now(),
    };

    const { error } = await supabase
      .from('broadcast_alerts')
      .upsert(payload, { onConflict: 'id' });

    return !error;
  } catch (err) {
    console.error('[Supabase] broadcastAlert exception:', err);
    return false;
  }
}

export function supabaseSubscribeToAlerts(
  callback: (alerts: PushAlert[]) => void
): (() => void) | null {
  if (!isSupabaseConfigured()) return null;
  try {
    const channel = supabase
      .channel('realtime-broadcast-alerts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'broadcast_alerts' },
        async () => {
          const { data } = await supabase
            .from('broadcast_alerts')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(30);

          if (data) {
            callback(data.map((d: any) => ({
              id: d.id,
              title: d.title,
              message: d.message,
              type: d.type || 'SIGNAL',
              timestamp: Number(d.timestamp),
              read: false,
            })));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch {
    return null;
  }
}



// ==========================================
// 5. APP CONFIG & GLOBAL SETTINGS (public.app_config)
// ==========================================

export async function supabaseGetPaymentSettings(): Promise<PaymentSettings | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('data')
      .eq('id', 'payment_settings')
      .maybeSingle();

    if (error || !data) return null;
    return data.data as PaymentSettings;
  } catch (err) {
    console.warn('[Supabase] getPaymentSettings error:', err);
    return null;
  }
}

export async function supabaseSavePaymentSettings(settings: PaymentSettings): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase
      .from('app_config')
      .upsert({
        id: 'payment_settings',
        data: settings,
        updated_at: Date.now(),
      }, { onConflict: 'id' });

    return !error;
  } catch (err) {
    console.error('[Supabase] savePaymentSettings exception:', err);
    return false;
  }
}

export async function supabaseGetGlobalSettings(): Promise<GlobalAppSettings | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('data')
      .eq('id', 'global_settings')
      .maybeSingle();

    if (error || !data) return null;
    return data.data as GlobalAppSettings;
  } catch (err) {
    console.warn('[Supabase] getGlobalSettings error:', err);
    return null;
  }
}

export async function supabaseSaveGlobalSettings(
  settings: GlobalAppSettings,
  adminEmail?: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase
      .from('app_config')
      .upsert({
        id: 'global_settings',
        data: settings,
        updated_at: Date.now(),
      }, { onConflict: 'id' });

    if (error) {
      console.error('[Supabase] saveGlobalSettings error:', error.message);
      return false;
    }

    // Auto-record audit log for admin changes
    if (adminEmail) {
      await supabaseLogActivity({
        id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
        adminEmail,
        action: 'UPDATE_GLOBAL_SETTINGS',
        target: 'Global Settings',
        status: 'SUCCESS',
        details: `GlobalFreeAccess=${settings.globalFreeAccess ? 'ON' : 'OFF'}, EnforceVerify=${settings.enforceEmailVerification ? 'ON' : 'OFF'}, Maintenance=${settings.maintenanceMode ? 'ON' : 'OFF'}`,
      }).catch(() => {});
    }

    return true;
  } catch (err) {
    console.error('[Supabase] saveGlobalSettings exception:', err);
    return false;
  }
}

export async function supabaseGetPlans(): Promise<SubscriptionPlan[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('data')
      .eq('id', 'subscription_plans')
      .maybeSingle();

    if (error || !data) return null;
    return (data.data as any)?.plans || null;
  } catch (err) {
    console.warn('[Supabase] getPlans error:', err);
    return null;
  }
}

export async function supabaseSavePlans(plans: SubscriptionPlan[]): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase
      .from('app_config')
      .upsert({
        id: 'subscription_plans',
        data: { plans },
        updated_at: Date.now(),
      }, { onConflict: 'id' });

    return !error;
  } catch (err) {
    console.error('[Supabase] savePlans exception:', err);
    return false;
  }
}

// ----------------------------------------------------
// Coupon Codes Management (Stored under 'coupon_codes')
// ----------------------------------------------------

export const DEFAULT_COUPONS: CouponCode[] = [
  {
    id: 'coupon-smc50',
    code: 'SMC50',
    description: '50% Institutional Launch Discount',
    discountType: 'PERCENTAGE',
    discountValue: 50,
    active: true,
    expiresAt: null,
    maxUses: null,
    usedCount: 0,
    usedByEmails: [],
    createdAt: Date.now(),
  },
  {
    id: 'coupon-pro20',
    code: 'PROMO20',
    description: '20% Special Trader Discount',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    active: true,
    expiresAt: null,
    maxUses: null,
    usedCount: 0,
    usedByEmails: [],
    createdAt: Date.now(),
  },
  {
    id: 'coupon-flat500',
    code: 'SAVE500',
    description: '₹500 Flat Discount on any tier',
    discountType: 'FLAT_INR',
    discountValue: 500,
    active: true,
    expiresAt: null,
    maxUses: null,
    usedCount: 0,
    usedByEmails: [],
    createdAt: Date.now(),
  },
];

export async function supabaseGetCoupons(): Promise<CouponCode[]> {
  if (!isSupabaseConfigured()) return DEFAULT_COUPONS;
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('data')
      .eq('id', 'coupon_codes')
      .maybeSingle();

    if (error || !data || !(data.data as any)?.coupons) {
      // Initialize with default coupons if not present
      await supabaseSaveCoupons(DEFAULT_COUPONS);
      return DEFAULT_COUPONS;
    }

    return (data.data as any).coupons as CouponCode[];
  } catch (err) {
    console.warn('[Supabase] getCoupons error:', err);
    return DEFAULT_COUPONS;
  }
}

export async function supabaseSaveCoupons(coupons: CouponCode[]): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase
      .from('app_config')
      .upsert({
        id: 'coupon_codes',
        data: { coupons },
        updated_at: Date.now(),
      }, { onConflict: 'id' });

    return !error;
  } catch (err) {
    console.error('[Supabase] saveCoupons exception:', err);
    return false;
  }
}

export async function supabaseCreateCoupon(coupon: Omit<CouponCode, 'id' | 'usedCount' | 'usedByEmails' | 'createdAt'>): Promise<boolean> {
  const existing = await supabaseGetCoupons();
  const cleanCode = coupon.code.trim().toUpperCase();

  if (existing.some((c) => c.code.toUpperCase() === cleanCode)) {
    throw new Error(`Coupon with code "${cleanCode}" already exists.`);
  }

  const newCoupon: CouponCode = {
    id: `coupon-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    code: cleanCode,
    description: coupon.description || '',
    discountType: coupon.discountType || 'PERCENTAGE',
    discountValue: Number(coupon.discountValue) || 0,
    active: coupon.active !== false,
    expiresAt: coupon.expiresAt || null,
    maxUses: coupon.maxUses || null,
    usedCount: 0,
    usedByEmails: [],
    createdAt: Date.now(),
  };

  return supabaseSaveCoupons([newCoupon, ...existing]);
}

export async function supabaseUpdateCoupon(coupon: CouponCode): Promise<boolean> {
  const existing = await supabaseGetCoupons();
  const index = existing.findIndex((c) => c.id === coupon.id);
  if (index === -1) return false;

  existing[index] = {
    ...existing[index],
    ...coupon,
    code: coupon.code.trim().toUpperCase(),
  };

  return supabaseSaveCoupons([...existing]);
}

export async function supabaseDeleteCoupon(couponId: string): Promise<boolean> {
  const existing = await supabaseGetCoupons();
  const updated = existing.filter((c) => c.id !== couponId);
  return supabaseSaveCoupons(updated);
}

/**
 * Validate a coupon code with strict single-use per email enforcement.
 */
export async function supabaseValidateCoupon(
  code: string,
  userEmail: string | undefined,
  priceUSD: number,
  priceINR: number
): Promise<CouponValidationResult> {
  const cleanCode = (code || '').trim().toUpperCase();
  const cleanEmail = (userEmail || '').trim().toLowerCase();

  if (!cleanCode) {
    return {
      valid: false,
      message: 'Please enter a coupon code.',
      discountUSD: 0,
      discountINR: 0,
      finalPriceUSD: priceUSD,
      finalPriceINR: priceINR,
    };
  }

  const coupons = await supabaseGetCoupons();
  const coupon = coupons.find((c) => c.code.toUpperCase() === cleanCode);

  if (!coupon) {
    return {
      valid: false,
      message: `Invalid coupon code "${cleanCode}".`,
      discountUSD: 0,
      discountINR: 0,
      finalPriceUSD: priceUSD,
      finalPriceINR: priceINR,
    };
  }

  if (!coupon.active) {
    return {
      valid: false,
      message: `Coupon code "${cleanCode}" is currently inactive.`,
      discountUSD: 0,
      discountINR: 0,
      finalPriceUSD: priceUSD,
      finalPriceINR: priceINR,
    };
  }

  if (coupon.expiresAt && Date.now() > coupon.expiresAt) {
    return {
      valid: false,
      message: `Coupon code "${cleanCode}" has expired.`,
      discountUSD: 0,
      discountINR: 0,
      finalPriceUSD: priceUSD,
      finalPriceINR: priceINR,
    };
  }

  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return {
      valid: false,
      message: `Coupon code "${cleanCode}" has reached its maximum global redemptions limit.`,
      discountUSD: 0,
      discountINR: 0,
      finalPriceUSD: priceUSD,
      finalPriceINR: priceINR,
    };
  }

  // 🔒 STRICT SINGLE-USE PER EMAIL ENFORCEMENT
  if (cleanEmail && coupon.usedByEmails && Array.isArray(coupon.usedByEmails)) {
    const hasAlreadyUsed = coupon.usedByEmails.some((e) => e.toLowerCase() === cleanEmail);
    if (hasAlreadyUsed) {
      return {
        valid: false,
        message: `This coupon code has already been redeemed once by (${cleanEmail}). Each coupon is single-use per email address.`,
        discountUSD: 0,
        discountINR: 0,
        finalPriceUSD: priceUSD,
        finalPriceINR: priceINR,
      };
    }
  }

  // Calculate discount
  let discountUSD = 0;
  let discountINR = 0;

  if (coupon.discountType === 'PERCENTAGE') {
    const pct = Math.min(Math.max(coupon.discountValue, 0), 100);
    discountUSD = Number(((priceUSD * pct) / 100).toFixed(2));
    discountINR = Number(((priceINR * pct) / 100).toFixed(2));
  } else if (coupon.discountType === 'FLAT_USD') {
    discountUSD = Math.min(coupon.discountValue, priceUSD);
    const usdToInr = priceUSD > 0 ? priceINR / priceUSD : 95;
    discountINR = Number((discountUSD * usdToInr).toFixed(2));
  } else if (coupon.discountType === 'FLAT_INR') {
    discountINR = Math.min(coupon.discountValue, priceINR);
    const inrToUsd = priceINR > 0 ? priceUSD / priceINR : 1 / 95;
    discountUSD = Number((discountINR * inrToUsd).toFixed(2));
  }

  const finalPriceUSD = Math.max(Number((priceUSD - discountUSD).toFixed(2)), 0);
  const finalPriceINR = Math.max(Number((priceINR - discountINR).toFixed(2)), 0);

  return {
    valid: true,
    message: `Coupon applied: ${coupon.description || coupon.code}`,
    coupon,
    discountUSD,
    discountINR,
    finalPriceUSD,
    finalPriceINR,
  };
}

/**
 * Record a single-use coupon redemption against the user email.
 */
export async function supabaseRedeemCoupon(code: string, userEmail: string): Promise<boolean> {
  const cleanCode = (code || '').trim().toUpperCase();
  const cleanEmail = (userEmail || '').trim().toLowerCase();
  if (!cleanCode || !cleanEmail) return false;

  const coupons = await supabaseGetCoupons();
  const index = coupons.findIndex((c) => c.code.toUpperCase() === cleanCode);
  if (index === -1) return false;

  const coupon = coupons[index];
  const usedEmails = Array.isArray(coupon.usedByEmails) ? [...coupon.usedByEmails] : [];

  if (!usedEmails.some((e) => e.toLowerCase() === cleanEmail)) {
    usedEmails.push(cleanEmail);
  }

  coupons[index] = {
    ...coupon,
    usedCount: (coupon.usedCount || 0) + 1,
    usedByEmails: usedEmails,
  };

  return supabaseSaveCoupons(coupons);
}

export async function supabaseGetCentralFeatures(): Promise<CentralFeaturesDB | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('data')
      .eq('id', 'central_features')
      .maybeSingle();

    if (error || !data) return null;
    return data.data as CentralFeaturesDB;
  } catch (err) {
    console.warn('[Supabase] getCentralFeatures error:', err);
    return null;
  }
}

export async function supabaseSaveCentralFeatures(features: CentralFeaturesDB): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase
      .from('app_config')
      .upsert({
        id: 'central_features',
        data: features,
        updated_at: Date.now(),
      }, { onConflict: 'id' });

    return !error;
  } catch (err) {
    console.error('[Supabase] saveCentralFeatures exception:', err);
    return false;
  }
}

// ==========================================
// 6. ACTIVITY LOGS (public.activity_logs)
// ==========================================

export async function supabaseLogActivity(log: ActivityLog): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        id: log.id,
        user_email: log.adminEmail,
        action: log.action,
        details: `${log.target} - ${log.status} ${log.details || ''}`,
        timestamp: log.timestamp || Date.now(),
      });

    return !error;
  } catch (err) {
    console.error('[Supabase] logActivity exception:', err);
    return false;
  }
}

export async function supabaseGetActivityLogs(): Promise<ActivityLog[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      timestamp: Number(d.timestamp),
      adminEmail: d.user_email || 'admin@smcsignal.pro',
      action: d.action,
      target: d.details?.split(' - ')[0] || 'System',
      status: (d.details?.includes('FAILED') ? 'FAILED' : 'SUCCESS') as 'SUCCESS' | 'WARNING' | 'FAILED',
      details: d.details,
    }));
  } catch (err) {
    console.error('[Supabase] getActivityLogs exception:', err);
    return [];
  }
}

// ==========================================
// 7. SOCIAL TRADERS (public.social_traders)
// ==========================================

export async function supabaseGetSocialTraders(): Promise<SocialTrader[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase
      .from('social_traders')
      .select('*')
      .order('rank', { ascending: true });

    if (error || !data || data.length === 0) return [];

    return data.map((d: any) => ({
      id: d.id,
      name: d.name,
      handle: d.handle,
      avatar: d.avatar,
      rank: d.rank,
      badge: d.badge,
      copiersCount: d.copiers_count,
      verifiedWinRate: d.verified_win_rate,
      monthlyROI: d.monthly_roi,
      totalProfitUSD: d.total_profit_usd,
      favoritePair: d.favorite_pair,
      riskScore: 'LOW',
      strategyDescription: d.strategy_description,
      equityHistory: [10000, 11200, 12500, 14200, 15800, 18400],
      currentOpenTrades: d.current_open_trades,
    }));
  } catch (err) {
    console.error('[Supabase] getSocialTraders exception:', err);
    return [];
  }
}

// ==========================================
// 8. SUPPORT TICKETS & HELP DESK (public.app_config -> support_tickets)
// ==========================================

export async function supabaseGetSupportTickets(): Promise<SupportTicket[]> {
  if (!isSupabaseConfigured()) {
    try {
      const local = localStorage.getItem('smc_support_tickets_cache');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  }

  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('data')
      .eq('id', 'support_tickets')
      .maybeSingle();

    if (error || !data) {
      const local = localStorage.getItem('smc_support_tickets_cache');
      return local ? JSON.parse(local) : [];
    }

    const tickets: SupportTicket[] = (data.data as any)?.tickets || data.data || [];
    localStorage.setItem('smc_support_tickets_cache', JSON.stringify(tickets));
    return tickets;
  } catch (err) {
    console.warn('[Supabase] getSupportTickets error:', err);
    const local = localStorage.getItem('smc_support_tickets_cache');
    return local ? JSON.parse(local) : [];
  }
}

export async function supabaseSaveSupportTickets(tickets: SupportTicket[]): Promise<boolean> {
  localStorage.setItem('smc_support_tickets_cache', JSON.stringify(tickets));
  if (!isSupabaseConfigured()) return true;

  try {
    const { error } = await supabase
      .from('app_config')
      .upsert({
        id: 'support_tickets',
        data: { tickets },
        updated_at: Date.now(),
      }, { onConflict: 'id' });

    return !error;
  } catch (err) {
    console.warn('[Supabase] saveSupportTickets error:', err);
    return true;
  }
}

export async function supabaseCreateSupportTicket(ticket: SupportTicket): Promise<boolean> {
  try {
    const current = await supabaseGetSupportTickets();
    const updated = [ticket, ...current.filter((t) => t.id !== ticket.id)];
    return await supabaseSaveSupportTickets(updated);
  } catch (err) {
    console.error('[Supabase] createSupportTicket error:', err);
    return false;
  }
}

export async function supabaseAddSupportMessage(ticketId: string, message: SupportMessage): Promise<boolean> {
  try {
    const current = await supabaseGetSupportTickets();
    const updated = current.map((t) => {
      if (t.id === ticketId) {
        return {
          ...t,
          updatedAt: Date.now(),
          lastMessage: message.message,
          unreadByAdmin: message.sender === 'USER',
          unreadByUser: message.sender === 'ADMIN',
          messages: [...(t.messages || []), message],
        };
      }
      return t;
    });
    return await supabaseSaveSupportTickets(updated);
  } catch (err) {
    console.error('[Supabase] addSupportMessage error:', err);
    return false;
  }
}

export async function supabaseUpdateTicketStatus(
  ticketId: string,
  status: SupportTicket['status']
): Promise<boolean> {
  try {
    const current = await supabaseGetSupportTickets();
    const updated = current.map((t) => {
      if (t.id === ticketId) {
        return {
          ...t,
          status,
          updatedAt: Date.now(),
        };
      }
      return t;
    });
    return await supabaseSaveSupportTickets(updated);
  } catch (err) {
    console.error('[Supabase] updateTicketStatus error:', err);
    return false;
  }
}

export function supabaseSubscribeToSupportTickets(
  callback: (tickets: SupportTicket[]) => void
): (() => void) | null {
  if (!isSupabaseConfigured()) return null;
  try {
    const channel = supabase
      .channel('realtime-support-tickets')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_config', filter: 'id=eq.support_tickets' },
        async (payload: any) => {
          const raw = payload.new?.data;
          const list = raw?.tickets || raw;
          if (Array.isArray(list)) {
            callback(list);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch {
    return null;
  }
}

export const DEFAULT_WEBSITE_SETTINGS: WebsiteSettings = {
  siteUrl: 'http://localhost:3000',
  supportEmail: 'support@smcsignal.pro',
  telegramUrl: 'https://t.me/smcsignalpro',
  announcementBannerEnabled: false,
  announcementBannerText: 'Welcome to SMC SIGNAL — Institutional Smart Money Concept Analysis.',
  promoBadgeText: 'Institutional SMC Analysis Platform',
  heroHeadline: 'Trade Smarter with SMC SIGNAL',
  heroSubheadline: 'Detect institutional order blocks, fair value gaps, and liquidity sweeps in real-time. Practice risk-free before putting real capital to work.',
  freeTrialHeadline: 'Get Started with Free Trial',
  proPlanMonthlyPrice: 29,
  vipPlanMonthlyPrice: 99,
  maintenanceNoticeEnabled: false,
  maintenanceNoticeText: 'Website is currently undergoing routine maintenance.',
  lastUpdated: Date.now(),
};

export async function supabaseGetWebsiteSettings(): Promise<WebsiteSettings> {
  if (!isSupabaseConfigured()) return DEFAULT_WEBSITE_SETTINGS;
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('data')
      .eq('id', 'website_settings')
      .maybeSingle();

    if (error || !data?.data) {
      return DEFAULT_WEBSITE_SETTINGS;
    }
    return { ...DEFAULT_WEBSITE_SETTINGS, ...data.data };
  } catch (err) {
    console.warn('[Supabase] getWebsiteSettings error:', err);
    return DEFAULT_WEBSITE_SETTINGS;
  }
}

export async function supabaseSaveWebsiteSettings(
  settings: WebsiteSettings,
  adminEmail?: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const payload = {
      ...settings,
      lastUpdated: Date.now(),
    };

    const { error } = await supabase
      .from('app_config')
      .upsert(
        {
          id: 'website_settings',
          data: payload,
          updated_at: Date.now(),
        },
        { onConflict: 'id' }
      );

    if (error) {
      console.error('[Supabase] saveWebsiteSettings error:', error.message);
      return false;
    }

    if (adminEmail) {
      await supabaseLogActivity({
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        adminEmail,
        action: 'UPDATE_SETTINGS',
        target: 'WEBSITE_SETTINGS',
        status: 'SUCCESS',
        details: 'Updated marketing website configurations (Hero, Banners, Contact, Pricing)',
        timestamp: Date.now(),
      });
    }

    return true;
  } catch (err) {
    console.error('[Supabase] saveWebsiteSettings exception:', err);
    return false;
  }
}


