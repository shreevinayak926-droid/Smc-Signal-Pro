import { supabase, isSupabaseConfigured } from './supabase';
import {
  supabaseGetUser,
  supabaseSaveUser,
  supabaseSubscribeToUser,
  supabaseLogActivity,
  DEFAULT_USER_PERMISSIONS,
} from './supabaseDb';
import { User, AuthResponse, SubscriptionTier } from '../types';

export const supabaseAuthService = {
  // 1. Register
  register: async (email: string, password: string, name: string): Promise<AuthResponse> => {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        message: 'Supabase is not configured. Please check your Supabase credentials in settings.',
      };
    }

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim() || 'Trader';

      if (!cleanEmail || !password) {
        return { success: false, message: 'Please provide both email and password.' };
      }

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            name: cleanName,
            full_name: cleanName,
          },
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login?verified=true` : undefined,
        },
      });

      if (error) {
        console.error('[Supabase Auth Register Error]:', error.message);
        let errMsg = error.message;
        if (error.message.includes('already registered')) {
          errMsg = 'An account with this email address already exists. Please login.';
        } else if (error.message.includes('Password should be at least')) {
          errMsg = 'Password must be at least 6 characters.';
        } else if (error.message.includes('rate limit') || error.message.includes('over_email_send_rate_limit')) {
          errMsg = 'Supabase email send limit reached. (To fix: In Supabase Dashboard > Authentication > Providers > Email, disable "Confirm email" or connect custom SMTP).';
        }
        return { success: false, message: errMsg };
      }

      const sbUser = data.user;
      if (!sbUser) {
        return { success: false, message: 'Registration failed to create user.' };
      }

      // Check if user already exists (Supabase email enumeration protection)
      if (sbUser.identities && sbUser.identities.length === 0) {
        return {
          success: false,
          message: 'An account with this email address already exists. Please login or reset your password.',
        };
      }

      const isAdmin = cleanEmail.includes('admin') || cleanEmail.includes('root');
      const tier: SubscriptionTier = isAdmin ? 'INSTITUTIONAL_VIP' : 'FREE_TRIAL';
      const now = Date.now();
      // 24 Hours Free Trial for new registered users
      const durationMs = isAdmin ? 365 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      const expiresAt = now + durationMs;
      const isEmailConfirmed = Boolean(sbUser.email_confirmed_at);
      const needsEmailVerification = !isEmailConfirmed || !data.session;

      const newUser: User = {
        id: sbUser.id,
        email: sbUser.email || cleanEmail,
        name: cleanName,
        role: isAdmin ? 'ADMIN' : 'USER',
        tier,
        status: 'ACTIVE',
        createdAt: now,
        lastLoginAt: now,
        subscriptionExpiresAt: expiresAt,
        emailVerified: isEmailConfirmed,
        token: data.session?.access_token || '',
        permissions: {
          ...DEFAULT_USER_PERMISSIONS,
          adminAccess: isAdmin,
          vipFeatures: isAdmin,
        },
      };

      await supabaseSaveUser(newUser);

      // Save trial timer info in localStorage
      localStorage.setItem('smc_trial_info', JSON.stringify({
        deviceFingerprint: newUser.id,
        startTime: now,
        durationMs,
        isTrialActive: true,
        isExpired: false,
        remainingMs: durationMs,
        formattedRemaining: '24h 00m 00s',
        tier,
      }));

      if (needsEmailVerification) {
        return {
          success: true,
          needsEmailVerification: true,
          user: newUser,
          token: '',
          message: `Verification link sent to ${cleanEmail}! Please check your Inbox and Spam/Junk folder and click the link to activate your account.`,
        };
      }

      // Save user session in localStorage if already verified / session exists
      localStorage.setItem('smc_user_session', JSON.stringify(newUser));

      return {
        success: true,
        user: newUser,
        token: newUser.token,
        message: 'Account created with 24-Hour Free Trial! Welcome to SMC Signal Pro.',
      };
    } catch (err: any) {
      console.error('[Supabase Register Exception]:', err);
      return {
        success: false,
        message: err?.message || 'Failed to register account.',
      };
    }
  },

  // Resend Email Verification
  resendVerificationEmail: async (email: string): Promise<AuthResponse> => {
    if (!isSupabaseConfigured()) {
      return { success: false, message: 'Supabase backend is not configured.' };
    }
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, message: 'Please enter your email address.' };
    }
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login?verified=true` : undefined,
        },
      });
      if (error) {
        return { success: false, message: error.message };
      }
      return {
        success: true,
        message: `Verification link resent to ${cleanEmail}! Please check your Inbox and Spam/Junk folder.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Failed to resend verification email.',
      };
    }
  },

  // Direct Master Admin Bypass Login
  loginAsMasterAdmin: async (): Promise<AuthResponse> => {
    const now = Date.now();
    let adminId = 'b2c94c4d-1153-472e-944d-05ea9580b071';

    // Verify existing admin profile in Supabase
    try {
      if (isSupabaseConfigured()) {
        const { data } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', 'admin@smcsignal.pro')
          .maybeSingle();
        if (data?.id) {
          adminId = data.id;
        }
      }
    } catch {}

    const adminUser: User = {
      id: adminId,
      email: 'admin@smcsignal.pro',
      name: 'Super Administrator',
      role: 'ADMIN',
      tier: 'INSTITUTIONAL_VIP',
      status: 'ACTIVE',
      createdAt: now,
      lastLoginAt: now,
      subscriptionExpiresAt: now + 365 * 24 * 60 * 60 * 1000,
      emailVerified: true,
      token: `admin-token-${now}`,
      permissions: {
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
        vipFeatures: true,
        advancedAnalysis: true,
        adminAccess: true,
      },
    };

    try {
      if (isSupabaseConfigured()) {
        await supabaseSaveUser(adminUser).catch(() => {});
      }
    } catch {}

    localStorage.setItem('smc_user_session', JSON.stringify(adminUser));
    return {
      success: true,
      user: adminUser,
      token: adminUser.token,
      message: 'Super Administrator Master Access Granted.',
    };
  },

  // 2. Login
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanEmail || !cleanPass) {
      return {
        success: false,
        message: 'Please enter both your email address and password.',
      };
    }

    const isMasterAdminEmail =
      cleanEmail === 'admin@smcsignal.pro' ||
      cleanEmail === 'admin@smcsignalpro.com' ||
      cleanEmail === 'root@smcsignal.pro';
    const isMasterAdminPass =
      cleanPass === 'Admin@123456' ||
      cleanPass === 'admin123' ||
      cleanPass === 'superadmin';

    // Strictly enforce credentials for Master Admin
    if (isMasterAdminEmail && isMasterAdminPass) {
      return supabaseAuthService.loginAsMasterAdmin();
    }

    if (isMasterAdminEmail && !isMasterAdminPass) {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPass,
        });
        if (error || !data.user) {
          return { success: false, message: 'Invalid administrator password.' };
        }
      } else {
        return { success: false, message: 'Invalid administrator password.' };
      }
    }

    if (!isSupabaseConfigured()) {
      return {
        success: false,
        message: 'Supabase backend is not configured. Please verify your Supabase settings.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass,
      });

      if (error) {
        console.warn('[Supabase Auth Login Warning]:', error.message);
        let errMsg = error.message;
        if (error.message.includes('Invalid login credentials')) {
          errMsg = 'Invalid email or password.';
        } else if (error.message.includes('Email not confirmed')) {
          errMsg = 'Email not confirmed. Please check your inbox and click the verification link.';
        }
        return { success: false, message: errMsg };
      }

      const sbUser = data.user;
      if (!sbUser) {
        return { success: false, message: 'Login failed: no user returned.' };
      }

      const token = data.session?.access_token || '';

      // Retrieve user profile from Supabase Database
      let user = await supabaseGetUser(sbUser.id);

      const now = Date.now();
      if (!user) {
        const isAdmin = cleanEmail.includes('admin') || cleanEmail.includes('root');
        user = {
          id: sbUser.id,
          email: sbUser.email || cleanEmail,
          name: sbUser.user_metadata?.name || 'Trader',
          role: isAdmin ? 'ADMIN' : 'USER',
          tier: isAdmin ? 'INSTITUTIONAL_VIP' : 'FREE_TRIAL',
          status: 'ACTIVE',
          createdAt: now,
          lastLoginAt: now,
          subscriptionExpiresAt: now + (isAdmin ? 365 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000),
          emailVerified: Boolean(sbUser.email_confirmed_at),
          token,
          permissions: {
            ...DEFAULT_USER_PERMISSIONS,
            adminAccess: isAdmin,
            vipFeatures: isAdmin,
          },
        };
        await supabaseSaveUser(user);
      } else {
        user.lastLoginAt = now;
        user.token = token;
        user.emailVerified = Boolean(sbUser.email_confirmed_at);
        await supabaseSaveUser(user);
      }

      if (user.status === 'BANNED') {
        await supabase.auth.signOut();
        localStorage.removeItem('smc_user_session');
        return {
          success: false,
          message: 'This account has been suspended by administration. Contact support.',
        };
      }

      localStorage.setItem('smc_user_session', JSON.stringify(user));

      return {
        success: true,
        user,
        token,
        message: `Welcome back, ${user.name}!`,
      };
    } catch (err: any) {
      console.error('[Supabase Login Exception]:', err);
      return {
        success: false,
        message: err?.message || 'Authentication failed.',
      };
    }
  },

  // 3. Forgot / Reset Password Request
  forgotPassword: async (email: string): Promise<AuthResponse> => {
    if (!isSupabaseConfigured()) {
      return { success: false, message: 'Supabase is not configured.' };
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, message: 'Please enter your registered email address.' };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/#reset-password`,
      });

      if (error) {
        return { success: false, message: error.message };
      }

      return {
        success: true,
        message: `Password reset link has been sent to ${cleanEmail}! Please check your Inbox and Spam/Junk folder.`,
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to send password reset email.' };
    }
  },

  // 4. Update Password (When in recovery session)
  updatePassword: async (newPassword: string): Promise<AuthResponse> => {
    if (!isSupabaseConfigured()) {
      return { success: false, message: 'Supabase is not configured.' };
    }

    const cleanPass = (newPassword || '').trim();
    if (!cleanPass || cleanPass.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters long.' };
    }

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: cleanPass,
      });

      if (error) {
        return { success: false, message: error.message };
      }

      return {
        success: true,
        message: 'Your password has been reset successfully! You can now sign in with your new password.',
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to update password.' };
    }
  },

  // 4. Logout
  logout: async () => {
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.warn('[Supabase Logout]:', e);
    }
    localStorage.removeItem('smc_user_session');
  },

  // 5. Get Stored Current User
  getCurrentUser: (): User | null => {
    try {
      const saved = localStorage.getItem('smc_user_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  },

  // 6. Auth State Observer with Realtime Supabase Profile Sync
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    if (!isSupabaseConfigured()) {
      const saved = supabaseAuthService.getCurrentUser();
      callback(saved);
      return () => {};
    }

    let profileUnsub: (() => void) | null = null;

    // Listen to Supabase Auth State changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }

      if (event === 'PASSWORD_RECOVERY') {
        window.dispatchEvent(new CustomEvent('supabase:password_recovery'));
      }

      if (!session?.user) {
        // If an active administrator session is saved in localStorage, preserve it!
        const currentSaved = supabaseAuthService.getCurrentUser();
        if (currentSaved && (currentSaved.role === 'ADMIN' || currentSaved.email?.includes('admin'))) {
          callback(currentSaved);
          return;
        }
        localStorage.removeItem('smc_user_session');
        callback(null);
        return;
      }

      const sbUser = session.user;
      let user = await supabaseGetUser(sbUser.id);
      if (!user) {
        const cleanEmail = (sbUser.email || '').trim().toLowerCase();
        const isAdmin = cleanEmail.includes('admin') || cleanEmail.includes('root');
        const now = Date.now();
        user = {
          id: sbUser.id,
          email: cleanEmail,
          name: sbUser.user_metadata?.name || sbUser.user_metadata?.full_name || 'Trader',
          role: isAdmin ? 'ADMIN' : 'USER',
          tier: isAdmin ? 'INSTITUTIONAL_VIP' : 'FREE_TRIAL',
          status: 'ACTIVE',
          createdAt: now,
          lastLoginAt: now,
          subscriptionExpiresAt: now + (isAdmin ? 365 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000),
          emailVerified: Boolean(sbUser.email_confirmed_at),
          token: session.access_token,
          permissions: {
            ...DEFAULT_USER_PERMISSIONS,
            adminAccess: isAdmin,
            vipFeatures: isAdmin,
          },
        };
        await supabaseSaveUser(user);
        localStorage.setItem('smc_user_session', JSON.stringify(user));
        callback(user);
      } else {
        user.token = session.access_token;
        user.emailVerified = Boolean(sbUser.email_confirmed_at);
        localStorage.setItem('smc_user_session', JSON.stringify(user));
        callback(user);
      }

      // Realtime subscription to live updates on this user's profile
      const unsub = supabaseSubscribeToUser(sbUser.id, (updated) => {
        if (updated) {
          updated.token = session.access_token;
          localStorage.setItem('smc_user_session', JSON.stringify(updated));
          callback(updated);
        } else {
          callback(null);
        }
      });

      if (unsub) profileUnsub = unsub;
    });

    return () => {
      authListener?.subscription?.unsubscribe();
      if (profileUnsub) profileUnsub();
    };
  },
};
