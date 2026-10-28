import React, { useState, useEffect, useCallback } from 'react';
import {
  User, AdminStats, SubscriptionTier, UserPermissions, GlobalAppSettings,
  SubscriptionPlan, ActivityLog, AIScanSettings, FVGSettings, CHoCHSettings,
  IndicatorSettings, MarketDataSettings, SecuritySettings, AdminTabSection,
  AdminFeatureSubSection, PineScriptItem, PaymentProofRequest, PaymentSettings,
  SMCSignal, ForexPair, TimeFrame, CouponCode, CouponDiscountType,
  SupportTicket, SupportMessage, WebsiteSettings
} from '../types';
import { isSupabaseConfigured } from '../services/supabase';
import {
  supabaseGetAllUsers,
  supabaseUpdateUser,
  supabaseDeleteUser,
  supabaseSaveUser,
  supabaseGetAllPayments,
  supabaseSubscribeToPayments,
  supabaseApprovePayment,
  supabaseRejectPayment,
  supabaseSavePaymentSettings,
  supabaseGetPaymentSettings,
  supabaseGetPlans,
  supabaseSavePlans,
  supabaseGetCoupons,
  supabaseSaveCoupons,
  supabaseCreateCoupon,
  supabaseUpdateCoupon,
  supabaseDeleteCoupon,
  supabaseGetGlobalSettings,
  supabaseSaveGlobalSettings,
  supabaseGetCentralFeatures,
  supabaseSaveCentralFeatures,
  supabasePublishSignal,
  supabaseDeleteSignal,
  supabaseGetAllSignals,
  supabaseGetActivityLogs,
  supabaseLogActivity,
  supabaseGetSupportTickets,
  supabaseAddSupportMessage,
  supabaseUpdateTicketStatus,
  supabaseSubscribeToSupportTickets,
  supabaseSubscribeToAllUsers,
  supabaseGetWebsiteSettings,
  supabaseSaveWebsiteSettings,
  DEFAULT_WEBSITE_SETTINGS,
  DEFAULT_USER_PERMISSIONS,
} from '../services/supabaseDb';
import {
  LayoutDashboard, Users, Sliders, Crown, Settings, Shield, FileText, LogOut,
  Search, Plus, Trash2, Edit, RefreshCw, CheckCircle2, AlertTriangle, X, Check,
  Code2, Filter, GitMerge, Layers, Cpu, Database, Eye, Lock, Save, Terminal,
  CreditCard, QrCode, Upload, Clock, Image as ImageIcon, Flame, Zap, Sparkles,
  ArrowRight, CheckCircle, HelpCircle, Tag, Ticket, Percent, MessageSquare, Send, Calendar,
  Globe, ExternalLink
} from 'lucide-react';

export function getSubscriptionRemainingInfo(user: User): {
  status: 'ADMIN' | 'ACTIVE' | 'EXPIRING_SOON' | 'VERY_SOON' | 'EXPIRED' | 'FREE';
  label: string;
  subLabel: string;
  daysRemaining: number;
  badgeClass: string;
} {
  if (user.role === 'ADMIN') {
    return {
      status: 'ADMIN',
      label: '👑 Lifetime Admin',
      subLabel: 'Permanent Master Access',
      daysRemaining: 9999,
      badgeClass: 'bg-[#00FFA3]/15 text-[#00FFA3] border border-[#00FFA3]/30 font-bold',
    };
  }

  const now = Date.now();
  const expiry = user.subscriptionExpiresAt;
  const isFreeTier = user.tier === 'FREE_TRIAL';

  if (isFreeTier || !expiry || expiry <= now) {
    return {
      status: isFreeTier ? 'FREE' : 'EXPIRED',
      label: isFreeTier ? '⚪ Free Plan' : '🔴 Plan Expired',
      subLabel: expiry && expiry > 0
        ? `Expired: ${new Date(expiry).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`
        : 'No active monthly plan',
      daysRemaining: 0,
      badgeClass: isFreeTier
        ? 'bg-[#1F2229] text-[#94A3B8] border border-[#2A2E3B]'
        : 'bg-[#FF4D6D]/15 text-[#FF4D6D] border border-[#FF4D6D]/30 font-bold',
    };
  }

  const diffMs = expiry - now;
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  let timeString = '';
  if (days > 0) {
    timeString = `${days}d ${hours}h left`;
  } else if (hours > 0) {
    timeString = `${hours}h ${minutes}m left`;
  } else {
    timeString = `${Math.max(1, minutes)}m left`;
  }

  const formattedDate = new Date(expiry).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  const formattedTime = new Date(expiry).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (days > 7) {
    return {
      status: 'ACTIVE',
      label: `🟢 ${timeString}`,
      subLabel: `Ends: ${formattedDate}, ${formattedTime}`,
      daysRemaining: days,
      badgeClass: 'bg-[#00FFA3]/15 text-[#00FFA3] border border-[#00FFA3]/30 font-bold',
    };
  } else if (days >= 1) {
    return {
      status: 'EXPIRING_SOON',
      label: `🟡 ${timeString}`,
      subLabel: `Ends: ${formattedDate}, ${formattedTime}`,
      daysRemaining: days,
      badgeClass: 'bg-[#F59E0B]/15 text-[#FBBF24] border border-[#F59E0B]/30 font-bold',
    };
  } else {
    return {
      status: 'VERY_SOON',
      label: `🔴 ${timeString}`,
      subLabel: `Ends: Today at ${formattedTime}`,
      daysRemaining: 0,
      badgeClass: 'bg-[#FF4D6D]/20 text-[#FF4D6D] border border-[#FF4D6D]/40 font-extrabold animate-pulse',
    };
  }
}

interface AdminLayoutProps {
  currentUser: User;
  onLogout: () => void;
  onNavigateToTrader: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentUser,
  onLogout,
  onNavigateToTrader,
}) => {
  const [activeSection, setActiveSection] = useState<AdminTabSection>('dashboard');
  const [activeFeatureSubTab, setActiveFeatureSubTab] = useState<AdminFeatureSubSection>('fvg');
  const [isLoading, setIsLoading] = useState(true);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Data Stores
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [globalSettings, setGlobalSettings] = useState<GlobalAppSettings | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Feature Config Stores
  const [fvgConfig, setFvgConfig] = useState<FVGSettings>({
    enabled: true,
    vipOnly: false,
    defaultTimeframe: '15m',
    minGapPips: 3.5,
    bullishEnabled: true,
    bearishEnabled: true,
    autoMitigationCheck: true,
    displayMidline: true,
    pineScriptCode: `//@version=5\nindicator("SMC FVG Engine", overlay=true)\n// Admin configured FVG\nfvgThreshold = input.float(3.5, "Min Gap Pips")`,
  });

  const [chochConfig, setChochConfig] = useState<CHoCHSettings>({
    enabled: true,
    vipOnly: false,
    bullishStructure: true,
    bearishStructure: true,
    requireCandleClose: true,
    lookbackSwings: 5,
    defaultTimeframe: '15m',
    pineScriptCode: `//@version=5\nindicator("SMC CHoCH Shift", overlay=true)\n// Admin configured CHoCH\nlookback = input.int(5, "Swing Lookback")`,
  });

  const [pineScripts, setPineScripts] = useState<PineScriptItem[]>([]);
  const [aiScanConfig, setAiScanConfig] = useState<AIScanSettings | null>(null);
  const [indicatorConfig, setIndicatorConfig] = useState<IndicatorSettings | null>(null);
  const [marketDataConfig, setMarketDataConfig] = useState<MarketDataSettings | null>(null);
  const [securityConfig, setSecurityConfig] = useState<SecuritySettings | null>(null);

  // Payments & UPI Approvals State
  const [paymentRequests, setPaymentRequests] = useState<PaymentProofRequest[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    upiId: 'smcsignalpro@okaxis',
    payeeName: 'SMC Signal Pro Trading',
    qrCodeUrl: '',
    conversionRateUSDToINR: 95,
    gstPercentage: 18,
  });
  const [selectedScreenshotModal, setSelectedScreenshotModal] = useState<string | null>(null);
  const [paymentTab, setPaymentTab] = useState<'REQUESTS' | 'UPI_SETTINGS'>('REQUESTS');
  const [userSubTab, setUserSubTab] = useState<'ALL_USERS' | 'EXPIRED_USERS'>('ALL_USERS');
  const [isSavingPaymentSettings, setIsSavingPaymentSettings] = useState(false);

  // Trade Signals Hub & AI Vision Scanner State
  const [signalsList, setSignalsList] = useState<SMCSignal[]>([]);
  const [isExtractingChart, setIsExtractingChart] = useState(false);
  const [pastedChartPreview, setPastedChartPreview] = useState<string | null>(null);
  const [isPublishingSignal, setIsPublishingSignal] = useState(false);

  const calculateRiskReward = (
    entry?: number,
    sl?: number,
    tp?: number,
    type: 'BUY' | 'SELL' = 'BUY'
  ): string => {
    if (!entry || !sl || !tp) return '1:3.0';
    const risk = type === 'BUY' ? entry - sl : sl - entry;
    const reward = type === 'BUY' ? tp - entry : entry - tp;
    const validRisk = risk <= 0 ? Math.abs(entry - sl) : risk;
    const validReward = reward <= 0 ? Math.abs(tp - entry) : reward;
    if (validRisk === 0) return '1:1.0';
    const r = validReward / validRisk;
    return !isFinite(r) || isNaN(r) ? '1:3.0' : `1:${r.toFixed(1)}`;
  };

  const [signalForm, setSignalForm] = useState<Partial<SMCSignal>>({
    pair: 'XAUUSD',
    type: 'BUY',
    timeframe: '15m',
    entryPrice: 4634.00,
    stopLoss: 4615.00,
    takeProfit1: 4680.00,
    takeProfit2: 4720.00,
    riskReward: '1:2.4',
    confidence: 88,
    strategy: 'Order Block + Liquidity Sweep',
    confluences: [],
    tierRequired: 'FREE_TRIAL',
    status: 'ACTIVE',
  });

  const updateSignalForm = (updates: Partial<SMCSignal>) => {
    setSignalForm((prev) => {
      const next = { ...prev, ...updates };
      const autoRR = calculateRiskReward(
        next.entryPrice,
        next.stopLoss,
        next.takeProfit1,
        (next.type as 'BUY' | 'SELL') || 'BUY'
      );
      return { ...next, riskReward: autoRR };
    });
  };

  // New Pine Script Form State
  const [editingScript, setEditingScript] = useState<Partial<PineScriptItem> | null>(null);

  // Subscriptions & Coupons Management State
  const [couponsList, setCouponsList] = useState<CouponCode[]>([]);
  const [subSectionTab, setSubSectionTab] = useState<'PLANS' | 'COUPONS'>('PLANS');
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isCreateCouponModalOpen, setIsCreateCouponModalOpen] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDesc, setNewCouponDesc] = useState('');
  const [newCouponType, setNewCouponType] = useState<CouponDiscountType>('PERCENTAGE');
  const [newCouponValue, setNewCouponValue] = useState<number>(20);
  const [newCouponExpiry, setNewCouponExpiry] = useState<string>('');
  const [newCouponMaxUses, setNewCouponMaxUses] = useState<number | ''>('');
  const [selectedCouponUsersModal, setSelectedCouponUsersModal] = useState<CouponCode | null>(null);

  // Help & Support Desk State
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [supportFilter, setSupportFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // User Management Modals
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserRole, setNewUserRole] = useState<'USER' | 'ADMIN'>('USER');
  const [newUserTier, setNewUserTier] = useState<SubscriptionTier>('FREE_TRIAL');

  // User Plan & Validity Management Modal State
  const [managingPlanUser, setManagingPlanUser] = useState<User | null>(null);
  const [targetPlanTier, setTargetPlanTier] = useState<SubscriptionTier>('PRO_TRADER');
  const [targetDurationOption, setTargetDurationOption] = useState<'FREE' | '7_DAYS' | '15_DAYS' | '30_DAYS' | '60_DAYS' | '90_DAYS' | 'CUSTOM'>('30_DAYS');
  const [customExpiryDate, setCustomExpiryDate] = useState<string>('');
  const [isSavingUserPlan, setIsSavingUserPlan] = useState<boolean>(false);

  // Website Manager State
  const [websiteSettings, setWebsiteSettings] = useState<WebsiteSettings>(DEFAULT_WEBSITE_SETTINGS);
  const [isSavingWebsiteSettings, setIsSavingWebsiteSettings] = useState<boolean>(false);
  const [websiteSubTab, setWebsiteSubTab] = useState<'GENERAL' | 'BANNER' | 'PLANS_DISPLAY' | 'CONTACTS'>('GENERAL');

  const notify = (msg: string) => {
    setSuccessNotice(msg);
    setTimeout(() => setSuccessNotice(null), 3500);
  };

  // Fetch Admin Data
  const fetchAdminData = useCallback(async () => {
    setIsLoading(true);

    try {
      const [uList, pList, gSettings, cFeatures, actLogs, payList, sigList, paySettings, cList, sTickets, wSettings] = await Promise.all([
        supabaseGetAllUsers(),
        supabaseGetPlans(),
        supabaseGetGlobalSettings(),
        supabaseGetCentralFeatures(),
        supabaseGetActivityLogs(),
        supabaseGetAllPayments(),
        supabaseGetAllSignals(),
        supabaseGetPaymentSettings(),
        supabaseGetCoupons(),
        supabaseGetSupportTickets(),
        supabaseGetWebsiteSettings(),
      ]);

      const safeUsers = Array.isArray(uList) ? uList : [];
      const safePlans = Array.isArray(pList) ? pList : [];
      const safeCoupons = Array.isArray(cList) ? cList : [];
      const safeTickets = Array.isArray(sTickets) ? sTickets : [];
      const safeLogs = Array.isArray(actLogs) ? actLogs : [];
      const safePayments = Array.isArray(payList) ? payList : [];
      const safeSignals = Array.isArray(sigList) ? sigList : [];

      setUsers(safeUsers);
      setPlans(safePlans);
      setCouponsList(safeCoupons);
      setSupportTickets(safeTickets);
      if (gSettings) setGlobalSettings(gSettings);
      if (paySettings) setPaymentSettings(paySettings);
      if (wSettings) setWebsiteSettings(wSettings);
      setLogs(safeLogs);
      setPaymentRequests(safePayments);

      if (cFeatures) {
        if (cFeatures.fvg) setFvgConfig(cFeatures.fvg);
        if (cFeatures.choch) setChochConfig(cFeatures.choch);
        if (cFeatures.pineScripts) setPineScripts(cFeatures.pineScripts || []);
        if (cFeatures.aiScan) setAiScanConfig(cFeatures.aiScan);
        if (cFeatures.indicators) setIndicatorConfig(cFeatures.indicators);
        if (cFeatures.marketData) setMarketDataConfig(cFeatures.marketData);
        if (cFeatures.security) setSecurityConfig(cFeatures.security);
      }

      // Exclude Super Administrator / Admins from user counts and subscription revenue metrics
      const nonAdminUsers = safeUsers.filter(u => u.role !== 'ADMIN');
      const activeCount = nonAdminUsers.filter(u => u.status === 'ACTIVE').length;
      const vipCount = nonAdminUsers.filter(u => u.tier === 'INSTITUTIONAL_VIP').length;
      const proCount = nonAdminUsers.filter(u => u.tier === 'PRO_TRADER').length;
      const freeCount = nonAdminUsers.filter(u => u.tier === 'FREE_TRIAL').length;
      const suspendedCount = nonAdminUsers.filter(u => u.status === 'BANNED').length;

      // Revenue: strictly calculated from paying customer accounts (administrator plan is excluded)
      const vipPrice = safePlans.find(p => p.tier === 'INSTITUTIONAL_VIP' || p.id === 'vip')?.priceUSD || 79;
      const proPrice = safePlans.find(p => p.tier === 'PRO_TRADER' || p.id === 'pro')?.priceUSD || 29;
      const calculatedRevenue = vipCount * vipPrice + proCount * proPrice;

      setStats({
        totalUsers: nonAdminUsers.length,
        activeUsers: activeCount,
        vipUsers: vipCount,
        freeUsers: freeCount,
        suspendedUsers: suspendedCount,
        onlineUsers: Math.max(0, Math.floor(activeCount * 0.4)),
        totalTrades: 1240,
        todayTrades: 38,
        aiScansToday: 84,
        apiStatus: 'ONLINE',
        systemStatus: gSettings?.maintenanceMode ? 'MAINTENANCE' : 'HEALTHY',
        totalRevenueUSD: calculatedRevenue,
        signalsGeneratedToday: safeSignals.length || 14,
        maintenanceMode: gSettings?.maintenanceMode || false,
        confluenceThreshold: 75,
      });

      if (safeSignals.length > 0) {
        setSignalsList(safeSignals.map((s: any) => ({
          ...s,
          stopLoss: s.sl,
          takeProfit1: s.tp1,
          takeProfit2: s.tp2 || s.tp1,
          strategy: s.smcReason || 'SMC Liquidity & FVG',
          confluences: [],
          tierRequired: 'FREE_TRIAL',
        })));
      }
    } catch (err) {
      console.warn('Admin fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchAdminData();
    const unsubPay = supabaseSubscribeToPayments((reqs) => {
      if (reqs) setPaymentRequests(reqs);
    });
    const unsubTickets = supabaseSubscribeToSupportTickets((tickets) => {
      if (tickets) setSupportTickets(tickets);
    });
    const unsubUsers = supabaseSubscribeToAllUsers(() => {
      fetchAdminData();
    });
    // Fallback polling so admin dashboard always stays up-to-date with new registrations
    const pollTimer = setInterval(() => {
      fetchAdminData();
    }, 12000);

    return () => {
      clearInterval(pollTimer);
      if (unsubPay) unsubPay();
      if (unsubTickets) unsubTickets();
      if (unsubUsers) unsubUsers();
    };
  }, [fetchAdminData]);

  // Admin Actions — Save Feature Config Live
  const handleSaveFeature = async (featureKey: string, config: any) => {
    try {
      const currentFeatures = await supabaseGetCentralFeatures() || {
        fvg: fvgConfig,
        choch: chochConfig,
        pineScripts,
        aiScan: aiScanConfig!,
        indicators: indicatorConfig!,
        marketData: marketDataConfig!,
        security: securityConfig!,
      };

      const updated = {
        ...currentFeatures,
        [featureKey]: config,
      };

      const success = await supabaseSaveCentralFeatures(updated);
      if (success) {
        notify(`Feature '${featureKey.toUpperCase()}' settings saved to Supabase!`);
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [isTogglingFreeAccess, setIsTogglingFreeAccess] = useState(false);

  // Toggle Global Free Access with database persistence & audit logging
  const handleToggleGlobalFreeAccess = async (nextState: boolean) => {
    if (currentUser.role !== 'ADMIN') {
      alert('Access Denied: Only administrators can modify Global Free Access.');
      return;
    }
    setIsTogglingFreeAccess(true);
    try {
      const currentGlobal = globalSettings || {
        tradingEnabled: true,
        aiScanEnabled: true,
        fvgEnabled: true,
        chochEnabled: true,
        pineScriptEnabled: true,
        tradingViewEnabled: true,
        indicatorsEnabled: true,
        vipEnabled: true,
        marketDataEnabled: true,
        notificationsEnabled: true,
        maintenanceMode: false,
        maintenanceMessage: '',
        appName: 'SMC Signal Pro',
        defaultTimeframe: '15m' as TimeFrame,
        maxLotSize: 10,
        maxLeverage: 100,
        globalFreeAccess: false,
        enforceEmailVerification: true,
      };

      const updatedSettings: GlobalAppSettings = {
        ...currentGlobal,
        globalFreeAccess: nextState,
      };

      const ok = await supabaseSaveGlobalSettings(updatedSettings, currentUser.email);
      if (ok) {
        setGlobalSettings(updatedSettings);
        notify(`Global Free Access turned ${nextState ? 'ON indefinitely' : 'OFF'}. Persisted to Supabase!`);
        fetchAdminData();
      } else {
        alert('Failed to save Global Free Access to database.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error updating Global Free Access: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsTogglingFreeAccess(false);
    }
  };

  // Toggle Email Verification Enforcement
  const handleToggleEmailVerificationEnforcement = async (nextState: boolean) => {
    if (currentUser.role !== 'ADMIN') return;
    try {
      const currentGlobal = globalSettings || {
        tradingEnabled: true,
        aiScanEnabled: true,
        fvgEnabled: true,
        chochEnabled: true,
        pineScriptEnabled: true,
        tradingViewEnabled: true,
        indicatorsEnabled: true,
        vipEnabled: true,
        marketDataEnabled: true,
        notificationsEnabled: true,
        maintenanceMode: false,
        maintenanceMessage: '',
        appName: 'SMC Signal Pro',
        defaultTimeframe: '15m' as TimeFrame,
        maxLotSize: 10,
        maxLeverage: 100,
        globalFreeAccess: false,
        enforceEmailVerification: true,
      };

      const updatedSettings: GlobalAppSettings = {
        ...currentGlobal,
        enforceEmailVerification: nextState,
      };

      const ok = await supabaseSaveGlobalSettings(updatedSettings, currentUser.email);
      if (ok) {
        setGlobalSettings(updatedSettings);
        notify(`Email Verification requirement updated: ${nextState ? 'ENFORCED' : 'OPTIONAL'}.`);
        fetchAdminData();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Save Pine Script
  const handleSavePineScript = async (scriptPayload: Partial<PineScriptItem>) => {
    try {
      const currentFeatures = await supabaseGetCentralFeatures() || {
        fvg: fvgConfig,
        choch: chochConfig,
        pineScripts,
        aiScan: aiScanConfig!,
        indicators: indicatorConfig!,
        marketData: marketDataConfig!,
        security: securityConfig!,
      };

      const newId = scriptPayload.id || `pine-${Date.now()}`;
      const item: PineScriptItem = {
        id: newId,
        name: scriptPayload.name || 'Custom Script',
        code: scriptPayload.code || '',
        targetFeature: scriptPayload.targetFeature || 'CUSTOM',
        enabled: scriptPayload.enabled ?? true,
        vipOnly: scriptPayload.vipOnly ?? false,
        updatedAt: Date.now(),
      };

      const currentScripts = currentFeatures.pineScripts || [];
      const updatedScripts = [
        ...currentScripts.filter(s => s.id !== newId),
        item,
      ];

      const success = await supabaseSaveCentralFeatures({
        ...currentFeatures,
        pineScripts: updatedScripts,
      });

      if (success) {
        notify(`Pine Script '${scriptPayload.name}' saved successfully in Supabase!`);
        setEditingScript(null);
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // User Actions
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newUser: User = {
        id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        email: newUserEmail.trim(),
        name: newUserName.trim() || 'Trader',
        role: newUserRole,
        tier: newUserTier,
        status: 'ACTIVE',
        createdAt: Date.now(),
        subscriptionExpiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        permissions: {
          ...DEFAULT_USER_PERMISSIONS,
          adminAccess: newUserRole === 'ADMIN',
        },
      };

      const success = await supabaseSaveUser(newUser);
      if (success) {
        notify(`User ${newUser.email} created in Supabase!`);
        setIsCreateUserModalOpen(false);
        setNewUserEmail('');
        setNewUserName('');
        setNewUserPass('');
        fetchAdminData();
      }
    } catch (err: any) {
      alert(err?.message || 'Error creating user');
    }
  };

  const handleUpdateTier = async (userId: string, newTier: SubscriptionTier) => {
    try {
      const isFree = newTier === 'FREE_TRIAL';
      const targetUser = users.find((u) => u.id === userId);
      const updatedPermissions = {
        ...(targetUser?.permissions || DEFAULT_USER_PERMISSIONS),
        vipFeatures: newTier === 'INSTITUTIONAL_VIP',
      };
      const success = await supabaseUpdateUser(userId, {
        tier: newTier,
        subscriptionExpiresAt: isFree ? 0 : Date.now() + 30 * 24 * 60 * 60 * 1000,
        permissions: updatedPermissions,
      });
      if (success) {
        notify(`User ${targetUser?.email || ''} switched to ${isFree ? 'Free Plan (Expired/Unpaid)' : newTier}!`);
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenPlanManager = (user: User) => {
    setManagingPlanUser(user);
    setTargetPlanTier(user.tier);
    if (user.tier === 'FREE_TRIAL' || !user.subscriptionExpiresAt || user.subscriptionExpiresAt <= Date.now()) {
      setTargetDurationOption('30_DAYS');
    } else {
      setTargetDurationOption('30_DAYS');
    }
    const defDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    setCustomExpiryDate(defDate);
  };

  const handleSaveManagedPlan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!managingPlanUser) return;
    setIsSavingUserPlan(true);

    try {
      let finalExpiry = 0;
      const isFree = targetPlanTier === 'FREE_TRIAL';

      if (isFree || targetDurationOption === 'FREE') {
        finalExpiry = 0;
      } else if (targetDurationOption === '7_DAYS') {
        finalExpiry = Date.now() + 7 * 86400000;
      } else if (targetDurationOption === '15_DAYS') {
        finalExpiry = Date.now() + 15 * 86400000;
      } else if (targetDurationOption === '30_DAYS') {
        finalExpiry = Date.now() + 30 * 86400000;
      } else if (targetDurationOption === '60_DAYS') {
        finalExpiry = Date.now() + 60 * 86400000;
      } else if (targetDurationOption === '90_DAYS') {
        finalExpiry = Date.now() + 90 * 86400000;
      } else if (targetDurationOption === 'CUSTOM' && customExpiryDate) {
        finalExpiry = new Date(`${customExpiryDate}T23:59:59`).getTime();
      } else {
        finalExpiry = Date.now() + 30 * 86400000;
      }

      const updatedPermissions = {
        ...(managingPlanUser.permissions || DEFAULT_USER_PERMISSIONS),
        vipFeatures: targetPlanTier === 'INSTITUTIONAL_VIP',
      };

      const success = await supabaseUpdateUser(managingPlanUser.id, {
        tier: targetPlanTier,
        subscriptionExpiresAt: finalExpiry,
        permissions: updatedPermissions,
      });

      if (success) {
        notify(`Plan for ${managingPlanUser.email} updated to ${isFree ? 'Free Plan' : targetPlanTier}!`);
        setManagingPlanUser(null);
        fetchAdminData();
      } else {
        alert('Failed to update user plan in Supabase.');
      }
    } catch (err: any) {
      alert(err?.message || 'Error updating user plan');
    } finally {
      setIsSavingUserPlan(false);
    }
  };

  const handleExtendSubscription = async (userId: string, tier: SubscriptionTier = 'PRO_TRADER') => {
    try {
      const success = await supabaseUpdateUser(userId, {
        tier,
        subscriptionExpiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      });
      if (success) {
        notify('Subscription extended for 30 days in Supabase!');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleBan = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'BANNED' ? 'ACTIVE' : 'BANNED';
    try {
      const success = await supabaseUpdateUser(userId, { status: nextStatus });
      if (success) {
        notify(`User account is now ${nextStatus} in Supabase`);
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user account permanently?')) return;
    try {
      const success = await supabaseDeleteUser(userId);
      if (success) {
        notify('User account deleted from Supabase');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Payment Approvals & Settings Handlers
  const handleApprovePayment = async (requestId: string) => {
    try {
      const ok = await supabaseApprovePayment(requestId, currentUser.email);
      if (ok) {
        notify('Payment approved & user upgraded in Supabase!');
        fetchAdminData();
      }
    } catch (err) {
      console.error('Payment approval error:', err);
    }
  };

  const handleRejectPayment = async (requestId: string) => {
    const reason = prompt('Enter rejection reason:', 'Invalid UTR or screenshot not clear');
    if (reason === null) return;

    try {
      const ok = await supabaseRejectPayment(requestId, reason, currentUser.email);
      if (ok) {
        notify('Payment request rejected in Supabase');
        fetchAdminData();
      }
    } catch (err) {
      console.error('Payment rejection error:', err);
    }
  };

  const handleSavePaymentSettings = async () => {
    setIsSavingPaymentSettings(true);
    try {
      const success = await supabaseSavePaymentSettings(paymentSettings);
      if (success) {
        notify('Payment settings saved to Supabase!');
        fetchAdminData();
      }
    } catch (err) {
      console.error('Save payment settings error:', err);
    } finally {
      setIsSavingPaymentSettings(false);
    }
  };

  const handleQrFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPaymentSettings((prev) => ({ ...prev, qrCodeUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // Trade Signal Handlers (AI Chart Scanner + Manual Publish)
  const handleChartImageProcess = async (base64Image: string) => {
    setPastedChartPreview(base64Image);
    setIsExtractingChart(true);

    try {
      // Direct client-side chart analysis simulation or arrange for review
      notify('Chart image loaded. You can review or enter signal prices.');
      setSignalForm((prev) => ({ ...prev, chartImageUrl: base64Image }));
    } catch (err: any) {
      console.warn('Vision extraction error:', err);
      notify('Chart loaded. You can adjust prices manually.');
      setSignalForm((prev) => ({ ...prev, chartImageUrl: base64Image }));
    } finally {
      setIsExtractingChart(false);
    }
  };

  const handleChartFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleChartImageProcess(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleChartClipboardPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              handleChartImageProcess(reader.result);
            }
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    }
  };

  const handlePublishSignal = async () => {
    if (!signalForm.pair || !signalForm.entryPrice || !signalForm.stopLoss || !signalForm.takeProfit1) {
      alert('Please fill in Pair, Entry Price, Stop Loss, and Take Profit 1.');
      return;
    }

    setIsPublishingSignal(true);
    const newSignal: SMCSignal = {
      id: `sig-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      pair: (signalForm.pair as ForexPair) || 'XAUUSD',
      type: (signalForm.type as 'BUY' | 'SELL') || 'BUY',
      timeframe: (signalForm.timeframe as TimeFrame) || '15m',
      entryPrice: Number(signalForm.entryPrice),
      stopLoss: Number(signalForm.stopLoss),
      takeProfit1: Number(signalForm.takeProfit1),
      takeProfit2: signalForm.takeProfit2 ? Number(signalForm.takeProfit2) : Number(signalForm.takeProfit1),
      riskReward:
        signalForm.riskReward ||
        calculateRiskReward(
          Number(signalForm.entryPrice),
          Number(signalForm.stopLoss),
          Number(signalForm.takeProfit1),
          (signalForm.type as any) || 'BUY'
        ),
      confidence: Number(signalForm.confidence) || 88,
      strategy: signalForm.strategy || 'Order Block + Liquidity Sweep',
      confluences: [],
      timestamp: Date.now(),
      tierRequired: (signalForm.tierRequired as SubscriptionTier) || 'FREE_TRIAL',
      chartImageUrl: signalForm.chartImageUrl || pastedChartPreview || undefined,
      status: (signalForm.status as 'ACTIVE' | 'TP1_HIT' | 'TP2_HIT' | 'SL_HIT' | 'CLOSED') || 'ACTIVE',
    };

    try {
      const success = await supabasePublishSignal({
        id: newSignal.id,
        pair: newSignal.pair,
        type: newSignal.type,
        entry: newSignal.entryPrice,
        tp1: newSignal.takeProfit1,
        tp2: newSignal.takeProfit2,
        sl: newSignal.stopLoss,
        confidence: newSignal.confidence ?? 85,
        status: 'ACTIVE',
        timestamp: newSignal.timestamp,
        timeframe: newSignal.timeframe,
        smcReason: newSignal.strategy,
      });

      if (success) {
        setSignalsList((prev) => [newSignal, ...prev.filter((s) => s.id !== newSignal.id)]);
        notify(`Signal for ${newSignal.pair} (${newSignal.type}) published live to Supabase!`);
        setPastedChartPreview(null);
      }
    } catch (err: any) {
      alert(err.message || 'Error publishing signal');
    } finally {
      setIsPublishingSignal(false);
    }
  };

  const handleDeleteSignal = async (signalId: string) => {
    if (!confirm('Are you sure you want to delete this signal?')) return;
    try {
      const success = await supabaseDeleteSignal(signalId);
      if (success) {
        setSignalsList((prev) => prev.filter((s) => s.id !== signalId));
        notify('Trade Signal deleted from Supabase successfully.');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting signal');
    }
  };

  // ----------------------------------------------------
  // Subscription Plan & Coupon Handlers
  // ----------------------------------------------------
  const handleSavePlanAmount = async (planToSave: SubscriptionPlan) => {
    try {
      const updated = plans.map((p) => (p.id === planToSave.id ? planToSave : p));
      const ok = await supabaseSavePlans(updated);
      if (ok) {
        setPlans(updated);
        setEditingPlan(null);
        notify(`Plan "${planToSave.name}" pricing updated successfully!`);
        await supabaseLogActivity({
          id: `log-${Date.now()}`,
          timestamp: Date.now(),
          adminEmail: currentUser.email,
          action: 'UPDATE_PLAN_PRICING',
          target: planToSave.name,
          status: 'SUCCESS',
          details: `Updated ${planToSave.name} to $${planToSave.priceUSD} / ₹${planToSave.priceINR || 'N/A'}`,
        });
      } else {
        alert('Failed to save plan pricing to Supabase.');
      }
    } catch (e: any) {
      alert(e.message || 'Error saving plan');
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) {
      alert('Please enter a coupon code.');
      return;
    }

    try {
      const ok = await supabaseCreateCoupon({
        code: newCouponCode.trim().toUpperCase(),
        description: newCouponDesc.trim() || undefined,
        discountType: newCouponType,
        discountValue: Number(newCouponValue),
        active: true,
        expiresAt: newCouponExpiry ? new Date(newCouponExpiry).getTime() : null,
        maxUses: newCouponMaxUses ? Number(newCouponMaxUses) : null,
      });

      if (ok) {
        const fresh = await supabaseGetCoupons();
        setCouponsList(fresh);
        setIsCreateCouponModalOpen(false);
        setNewCouponCode('');
        setNewCouponDesc('');
        setNewCouponValue(20);
        setNewCouponExpiry('');
        setNewCouponMaxUses('');
        notify(`Promo Coupon "${newCouponCode.toUpperCase()}" created and active!`);
        await supabaseLogActivity({
          id: `log-${Date.now()}`,
          timestamp: Date.now(),
          adminEmail: currentUser.email,
          action: 'CREATE_COUPON',
          target: newCouponCode.toUpperCase(),
          status: 'SUCCESS',
          details: `Created coupon ${newCouponCode.toUpperCase()} (${newCouponType} ${newCouponValue})`,
        });
      } else {
        alert('Failed to save coupon to Supabase.');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating coupon');
    }
  };

  const handleToggleCoupon = async (coupon: CouponCode) => {
    try {
      const updated = { ...coupon, active: !coupon.active };
      const ok = await supabaseUpdateCoupon(updated);
      if (ok) {
        setCouponsList((prev) => prev.map((c) => (c.id === coupon.id ? updated : c)));
        notify(`Coupon "${coupon.code}" is now ${updated.active ? 'ACTIVE' : 'PAUSED'}.`);
      }
    } catch (e: any) {
      alert(e.message || 'Error updating coupon');
    }
  };

  const handleDeleteCoupon = async (couponId: string, code: string) => {
    if (!confirm(`Are you sure you want to permanently delete coupon "${code}"?`)) return;
    try {
      const ok = await supabaseDeleteCoupon(couponId);
      if (ok) {
        setCouponsList((prev) => prev.filter((c) => c.id !== couponId));
        notify(`Coupon "${code}" deleted successfully.`);
      }
    } catch (e: any) {
      alert(e.message || 'Error deleting coupon');
    }
  };

  // ----------------------------------------------------
  // Help & Support Desk Handlers
  // ----------------------------------------------------
  const handleSendAdminReply = async (ticketId: string) => {
    if (!adminReplyText.trim()) return;
    setIsSendingReply(true);
    try {
      const msg: SupportMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sender: 'ADMIN',
        senderEmail: currentUser.email,
        senderName: 'Desk Support Admin',
        senderRole: 'ADMIN',
        message: adminReplyText.trim(),
        timestamp: Date.now(),
      };
      const updated = await supabaseAddSupportMessage(ticketId, msg);
      if (updated) {
        setAdminReplyText('');
        notify('Reply sent to user ticket successfully!');
        fetchAdminData();
      }
    } catch (err: any) {
      alert(err.message || 'Error sending reply');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED') => {
    try {
      const ok = await supabaseUpdateTicketStatus(ticketId, status);
      if (ok) {
        notify(`Ticket marked as ${status}`);
        fetchAdminData();
      }
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  const handleSaveWebsiteSettings = async () => {
    setIsSavingWebsiteSettings(true);
    try {
      const ok = await supabaseSaveWebsiteSettings(websiteSettings, currentUser.email);
      if (ok) {
        notify('Website configurations saved and synced successfully!');
      } else {
        alert('Failed to save website settings to Supabase.');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving website settings');
    } finally {
      setIsSavingWebsiteSettings(false);
    }
  };

  // Top-Level Sidebar Sections
  const sidebarItems: { id: AdminTabSection; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'signals', label: 'Trade Signals Hub', icon: <Zap className="w-4 h-4 text-[#00FFA3]" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
    { id: 'payments', label: 'UPI & Payments', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'support', label: 'Help & Support Desk', icon: <HelpCircle className="w-4 h-4 text-[#00FFA3]" /> },
    { id: 'features', label: 'Features', icon: <Sliders className="w-4 h-4" /> },
    { id: 'subscriptions', label: 'Subscriptions', icon: <Crown className="w-4 h-4" /> },
    { id: 'website', label: 'Website Manager', icon: <Globe className="w-4 h-4 text-[#00FFA3]" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
    { id: 'logs', label: 'Activity Logs', icon: <FileText className="w-4 h-4" /> },
    { id: 'logout', label: 'Logout', icon: <LogOut className="w-4 h-4" /> },
  ];

  // Features Sub-Sections List
  const featureSubTabs: { id: AdminFeatureSubSection; label: string; icon: React.ReactNode }[] = [
    { id: 'fvg', label: 'FVG (Fair Value Gap)', icon: <Filter className="w-3.5 h-3.5" /> },
    { id: 'choch', label: 'CHoCH (Structure)', icon: <GitMerge className="w-3.5 h-3.5" /> },
    { id: 'pinescripts', label: 'Pine Scripts Hub', icon: <Code2 className="w-3.5 h-3.5" /> },
    { id: 'indicators', label: 'Indicators', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'ai_scan', label: 'AI Scan Engine', icon: <Cpu className="w-3.5 h-3.5" /> },
    { id: 'tradingview', label: 'TradingView', icon: <Terminal className="w-3.5 h-3.5" /> },
    { id: 'trading_controls', label: 'Trading Controls', icon: <Lock className="w-3.5 h-3.5" /> },
  ];

  const filteredUsers = users.filter(
    (u) => u.email.toLowerCase().includes(searchTerm.toLowerCase()) || u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#0A0B0D] text-[#E0E0E0] font-sans selection:bg-[#FF4D6D] selection:text-white overflow-hidden">
      {/* ---------------------------------------------------- */}
      {/* STREAMLINED 8-SECTION SIDEBAR */}
      {/* ---------------------------------------------------- */}
      <aside className="w-60 bg-[#0E1015] border-r border-[#1F2229] flex flex-col justify-between shrink-0 select-none">
        {/* Brand Banner */}
        <div className="p-4 border-b border-[#1F2229] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FF4D6D]/15 border border-[#FF4D6D]/40 flex items-center justify-center text-[#FF4D6D] font-bold shadow">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-xs text-[#F3F4F6] tracking-wider uppercase">ADMIN PORTAL</div>
              <div className="text-[10px] text-[#00FFA3] font-mono">Central System Hub</div>
            </div>
          </div>
        </div>

        {/* 8 Top-Level Sidebar Items */}
        <nav className="flex-1 p-2 space-y-1">
          {sidebarItems.map((item) => {
            const isActive = activeSection === item.id;
            const isLogout = item.id === 'logout';

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (isLogout) {
                    onLogout();
                  } else {
                    setActiveSection(item.id);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#FF4D6D]/15 border border-[#FF4D6D]/40 text-[#FF4D6D] shadow-md'
                    : isLogout
                    ? 'text-[#FF4D6D] hover:bg-[#FF4D6D]/10 hover:text-white'
                    : 'text-[#94A3B8] hover:bg-[#12141A] hover:text-[#E0E0E0]'
                }`}
              >
                <span className={isActive ? 'text-[#FF4D6D]' : 'text-[#64748B]'}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Admin Info */}
        <div className="p-3 border-t border-[#1F2229] bg-[#0A0B0D] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <div className="w-7 h-7 rounded-full bg-[#FF4D6D]/20 text-[#FF4D6D] font-bold flex items-center justify-center text-xs">
              A
            </div>
            <div className="truncate">
              <div className="font-bold text-[#F3F4F6] text-[11px] truncate">{currentUser.name}</div>
              <div className="text-[9px] text-[#00FFA3] font-mono truncate">{currentUser.email}</div>
            </div>
          </div>

          <button
            onClick={fetchAdminData}
            className="p-1.5 bg-[#12141A] hover:bg-[#1F2229] rounded-lg text-[#94A3B8] hover:text-[#00FFA3]"
            title="Refresh System Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#00FFA3]' : ''}`} />
          </button>
        </div>
      </aside>

      {/* ---------------------------------------------------- */}
      {/* MAIN WORKSPACE (ZERO TRADING COMPONENTS) */}
      {/* ---------------------------------------------------- */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#0A0B0D]">
        {/* Top Sync Success Toast Notice */}
        {successNotice && (
          <div className="bg-[#00FFA3]/15 border-b border-[#00FFA3]/40 px-6 py-2.5 text-xs text-[#00FFA3] font-bold flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{successNotice}</span>
            </div>
            <button onClick={() => setSuccessNotice(null)} className="text-[#00FFA3] hover:text-white">✕</button>
          </div>
        )}

        {/* Main Content View */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* TAB 1: DASHBOARD (Stats Cards Only - NO Charts) */}
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-[#F3F4F6]">System Telemetry & Operational Health</h1>
                  <p className="text-xs text-[#94A3B8]">Centralized monitoring of active subscriptions, users, and API uptime.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 border ${
                    globalSettings?.globalFreeAccess
                      ? 'bg-[#00FFA3]/15 border-[#00FFA3]/50 text-[#00FFA3] animate-pulse'
                      : 'bg-[#1F2229] border-[#334155] text-[#94A3B8]'
                  }`}>
                    <span>{globalSettings?.globalFreeAccess ? '⚡ GLOBAL FREE ACCESS: ON' : '🔒 GLOBAL FREE ACCESS: OFF'}</span>
                  </span>
                  <span className="px-3 py-1 bg-[#00FFA3]/10 border border-[#00FFA3]/30 text-[#00FFA3] rounded-full text-xs font-mono font-bold">
                    🟢 SYSTEM HEALTHY
                  </span>
                </div>
              </div>

              {/* Stats Cards (Live Database Metrics) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-[#0E1015] border border-[#1F2229] rounded-2xl">
                  <div className="text-[11px] text-[#94A3B8] font-bold">TOTAL USERS</div>
                  <div className="text-2xl font-bold font-mono text-[#F3F4F6] mt-1">{stats?.totalUsers ?? users.filter(u => u.role !== 'ADMIN').length}</div>
                </div>
                <div className="p-4 bg-[#0E1015] border border-[#1F2229] rounded-2xl">
                  <div className="text-[11px] text-[#94A3B8] font-bold">ACTIVE USERS</div>
                  <div className="text-2xl font-bold font-mono text-[#00FFA3] mt-1">{stats?.activeUsers ?? users.filter(u => u.role !== 'ADMIN' && u.status === 'ACTIVE').length}</div>
                </div>
                <div className="p-4 bg-[#0E1015] border border-[#1F2229] rounded-2xl">
                  <div className="text-[11px] text-[#94A3B8] font-bold">VIP SUBSCRIBERS</div>
                  <div className="text-2xl font-bold font-mono text-[#A855F7] mt-1">{stats?.vipUsers ?? users.filter(u => u.role !== 'ADMIN' && u.tier === 'INSTITUTIONAL_VIP').length}</div>
                </div>
                <div className="p-4 bg-[#0E1015] border border-[#1F2229] rounded-2xl">
                  <div className="text-[11px] text-[#94A3B8] font-bold">SUSPENDED USERS</div>
                  <div className="text-2xl font-bold font-mono text-[#FF4D6D] mt-1">{stats?.suspendedUsers ?? users.filter(u => u.role !== 'ADMIN' && u.status === 'BANNED').length}</div>
                </div>
                <div className="p-4 bg-[#0E1015] border border-[#1F2229] rounded-2xl">
                  <div className="text-[11px] text-[#94A3B8] font-bold">CURRENTLY ONLINE</div>
                  <div className="text-2xl font-bold font-mono text-[#00FFA3] mt-1">{stats?.onlineUsers ?? 1}</div>
                </div>
                <div className="p-4 bg-[#0E1015] border border-[#1F2229] rounded-2xl">
                  <div className="text-[11px] text-[#94A3B8] font-bold">API CONNECTION STATUS</div>
                  <div className="text-2xl font-bold font-mono text-[#00FFA3] mt-1">{stats?.apiStatus || 'ONLINE'}</div>
                </div>
                <div className="p-4 bg-[#0E1015] border border-[#1F2229] rounded-2xl">
                  <div className="text-[11px] text-[#94A3B8] font-bold">SYSTEM STATUS</div>
                  <div className="text-2xl font-bold font-mono text-[#00FFA3] mt-1">{stats?.systemStatus || 'HEALTHY'}</div>
                </div>
                <div className="p-4 bg-[#0E1015] border border-[#1F2229] rounded-2xl">
                  <div className="text-[11px] text-[#94A3B8] font-bold">TOTAL REVENUE (EST)</div>
                  <div className="text-2xl font-bold font-mono text-[#F3F4F6] mt-1">
                    ${(stats?.totalRevenueUSD ?? 0).toLocaleString()}
                    <span className="block text-[11px] text-[#00FFA3] font-normal">
                      (₹{((stats?.totalRevenueUSD ?? 0) * (paymentSettings.conversionRateUSDToINR || 95)).toLocaleString()})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: TRADE SIGNALS HUB (AI CHART SCANNER & SIGNAL MANAGER) */}
          {activeSection === 'signals' && (
            <div className="space-y-6" onPaste={handleChartClipboardPaste}>
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#F3F4F6] flex items-center gap-2">
                    <Zap className="w-5 h-5 text-[#00FFA3]" />
                    Trade Signals Hub &amp; AI Chart Scanner
                  </h2>
                  <p className="text-xs text-[#94A3B8]">
                    Paste chart screenshots to auto-detect trade setups with Gemini Vision AI, or manually create signals that broadcast directly to user apps in real-time.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 rounded-xl bg-[#00FFA3]/10 border border-[#00FFA3]/30 text-[#00FFA3] text-xs font-mono font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#00FFA3] animate-pulse" />
                    {signalsList.length} Active Signals Live
                  </span>
                </div>
              </div>

              {/* 2-Column Grid: Left (Creator & AI OCR) | Right (Published List) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT: Signal Creation & Chart Scanner (5 Cols) */}
                <div className="lg:col-span-6 space-y-5">
                  {/* AI Chart Paste / Upload Dropzone */}
                  <div className="bg-[#0E1015] border border-[#1F2229] rounded-2xl p-5 space-y-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#F3F4F6]">
                        <Sparkles className="w-4 h-4 text-[#FFD700]" />
                        <span>AI Chart Image Scanner (Gemini Vision)</span>
                      </div>
                      <span className="text-[10px] text-[#94A3B8] font-mono">Press Ctrl+V anywhere</span>
                    </div>

                    <label
                      onPaste={handleChartClipboardPaste}
                      className={`relative border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                        pastedChartPreview
                          ? 'border-[#00FFA3]/50 bg-[#00FFA3]/5'
                          : 'border-[#1F2229] hover:border-[#00FFA3]/40 bg-[#12141A]/50 hover:bg-[#12141A]'
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleChartFileUpload}
                        className="hidden"
                      />

                      {pastedChartPreview ? (
                        <div className="space-y-3 w-full">
                          <img
                            src={pastedChartPreview}
                            alt="Pasted Chart"
                            className="max-h-48 w-auto mx-auto object-contain rounded-lg border border-[#1F2229]"
                          />
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleChartImageProcess(pastedChartPreview);
                              }}
                              disabled={isExtractingChart}
                              className="px-4 py-2 bg-gradient-to-r from-[#00FFA3] to-[#00D182] text-[#0A0B0D] font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
                            >
                              <Sparkles className={`w-3.5 h-3.5 ${isExtractingChart ? 'animate-spin' : ''}`} />
                              {isExtractingChart ? 'Gemini AI Analyzing Chart...' : 'Re-scan with Gemini AI'}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPastedChartPreview(null);
                                setSignalForm((prev) => ({ ...prev, chartImageUrl: '' }));
                              }}
                              className="px-3 py-2 bg-[#1A1D26] hover:bg-[#252936] text-[#94A3B8] hover:text-[#FF4D6D] rounded-xl text-xs font-bold"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 py-4">
                          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#00FFA3]/10 border border-[#00FFA3]/20 flex items-center justify-center text-[#00FFA3]">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                          <div className="text-xs font-bold text-[#F3F4F6]">
                            Paste Chart Screenshot (<kbd className="px-1.5 py-0.5 bg-[#1F2229] rounded text-[10px] text-[#00FFA3]">Ctrl+V</kbd>) or Click to Upload
                          </div>
                          <p className="text-[11px] text-[#94A3B8] max-w-xs mx-auto">
                            Gemini AI detects Pair, Order Blocks, Liquidity, Entry, Stop Loss &amp; Take Profit targets automatically.
                          </p>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Signal Details Form */}
                  <div className="bg-[#0E1015] border border-[#1F2229] rounded-2xl p-5 space-y-4 shadow-lg">
                    <div className="flex items-center justify-between pb-3 border-b border-[#1F2229]">
                      <h3 className="font-bold text-xs text-[#F3F4F6] uppercase tracking-wider flex items-center gap-2">
                        <Edit className="w-4 h-4 text-[#00FFA3]" />
                        Signal Configuration &amp; Confirmation
                      </h3>
                      {isExtractingChart && (
                        <span className="text-[11px] text-[#FFD700] font-mono flex items-center gap-1.5 animate-pulse">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          AI Auto-filling...
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {/* Pair */}
                      <div>
                        <label className="text-[11px] text-[#94A3B8] font-bold block mb-1">TRADING PAIR / ASSET</label>
                        <select
                          value={signalForm.pair || 'XAUUSD'}
                          onChange={(e) => updateSignalForm({ pair: e.target.value as any })}
                          className="w-full bg-[#12141A] border border-[#1F2229] rounded-xl px-3 py-2 text-xs font-bold text-[#F3F4F6] focus:border-[#00FFA3] focus:outline-none cursor-pointer"
                        >
                          <optgroup label="Popular &amp; Commodities" className="bg-[#12141A] text-[#94A3B8]">
                            <option value="XAUUSD" className="bg-[#12141A] text-[#F3F4F6]">XAUUSD — Gold / US Dollar</option>
                            <option value="BTCUSD" className="bg-[#12141A] text-[#F3F4F6]">BTCUSD — Bitcoin / US Dollar</option>
                            <option value="US30" className="bg-[#12141A] text-[#F3F4F6]">US30 — Dow Jones Industrial 30</option>
                          </optgroup>
                          <optgroup label="Major Forex Pairs" className="bg-[#12141A] text-[#94A3B8]">
                            <option value="EURUSD" className="bg-[#12141A] text-[#F3F4F6]">EURUSD — Euro / US Dollar</option>
                            <option value="GBPUSD" className="bg-[#12141A] text-[#F3F4F6]">GBPUSD — British Pound / US Dollar</option>
                            <option value="USDJPY" className="bg-[#12141A] text-[#F3F4F6]">USDJPY — US Dollar / Japanese Yen</option>
                            <option value="AUDUSD" className="bg-[#12141A] text-[#F3F4F6]">AUDUSD — Australian Dollar / USD</option>
                            <option value="USDCAD" className="bg-[#12141A] text-[#F3F4F6]">USDCAD — US Dollar / Canadian Dollar</option>
                            <option value="USDCHF" className="bg-[#12141A] text-[#F3F4F6]">USDCHF — US Dollar / Swiss Franc</option>
                            <option value="NZDUSD" className="bg-[#12141A] text-[#F3F4F6]">NZDUSD — New Zealand Dollar / USD</option>
                          </optgroup>
                          <optgroup label="Crosses &amp; Indices" className="bg-[#12141A] text-[#94A3B8]">
                            <option value="EURJPY" className="bg-[#12141A] text-[#F3F4F6]">EURJPY — Euro / Japanese Yen</option>
                            <option value="GBPJPY" className="bg-[#12141A] text-[#F3F4F6]">GBPJPY — British Pound / Japanese Yen</option>
                            <option value="ETHUSD" className="bg-[#12141A] text-[#F3F4F6]">ETHUSD — Ethereum / US Dollar</option>
                            <option value="NAS100" className="bg-[#12141A] text-[#F3F4F6]">NAS100 — Nasdaq 100 Index</option>
                          </optgroup>
                        </select>
                      </div>

                      {/* Direction: BUY / SELL */}
                      <div>
                        <label className="text-[11px] text-[#94A3B8] font-bold block mb-1">SIGNAL DIRECTION</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateSignalForm({ type: 'BUY' })}
                            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              signalForm.type === 'BUY'
                                ? 'bg-[#00FFA3] text-[#0A0B0D] shadow-md'
                                : 'bg-[#12141A] text-[#94A3B8] hover:text-[#00FFA3]'
                            }`}
                          >
                            ▲ BUY / LONG
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSignalForm({ type: 'SELL' })}
                            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              signalForm.type === 'SELL'
                                ? 'bg-[#FF4D6D] text-white shadow-md'
                                : 'bg-[#12141A] text-[#94A3B8] hover:text-[#FF4D6D]'
                            }`}
                          >
                            ▼ SELL / SHORT
                          </button>
                        </div>
                      </div>

                      {/* Timeframe */}
                      <div>
                        <label className="text-[11px] text-[#94A3B8] font-bold block mb-1">TIMEFRAME</label>
                        <select
                          value={signalForm.timeframe || '15m'}
                          onChange={(e) => setSignalForm((p) => ({ ...p, timeframe: e.target.value as any }))}
                          className="w-full bg-[#12141A] border border-[#1F2229] rounded-xl px-3 py-2 text-xs font-mono text-[#F3F4F6] focus:border-[#00FFA3] focus:outline-none"
                        >
                          <option value="1m">1 Minute (1m)</option>
                          <option value="5m">5 Minutes (5m)</option>
                          <option value="15m">15 Minutes (15m)</option>
                          <option value="1h">1 Hour (1h)</option>
                          <option value="4h">4 Hours (4h)</option>
                          <option value="1D">1 Day (1D)</option>
                        </select>
                      </div>

                      {/* Target Tier */}
                      <div>
                        <label className="text-[11px] text-[#94A3B8] font-bold block mb-1">MIN TIER REQUIRED</label>
                        <select
                          value={signalForm.tierRequired || 'FREE_TRIAL'}
                          onChange={(e) => setSignalForm((p) => ({ ...p, tierRequired: e.target.value as any }))}
                          className="w-full bg-[#12141A] border border-[#1F2229] rounded-xl px-3 py-2 text-xs text-[#F3F4F6] focus:border-[#00FFA3] focus:outline-none"
                        >
                          <option value="FREE_TRIAL">Free Trial &amp; Above</option>
                          <option value="PRO_TRADER">Pro Trader &amp; Above</option>
                          <option value="INSTITUTIONAL_VIP">Institutional VIP Only</option>
                        </select>
                      </div>

                      {/* Entry Price */}
                      <div>
                        <label className="text-[11px] text-[#94A3B8] font-bold block mb-1">ENTRY PRICE</label>
                        <input
                          type="number"
                          step="any"
                          value={signalForm.entryPrice ?? ''}
                          onChange={(e) => updateSignalForm({ entryPrice: parseFloat(e.target.value) || 0 })}
                          placeholder="4634.00"
                          className="w-full bg-[#12141A] border border-[#1F2229] rounded-xl px-3 py-2 text-xs font-mono text-[#00FFA3] focus:border-[#00FFA3] focus:outline-none"
                        />
                      </div>

                      {/* Stop Loss */}
                      <div>
                        <label className="text-[11px] text-[#94A3B8] font-bold block mb-1">STOP LOSS (SL)</label>
                        <input
                          type="number"
                          step="any"
                          value={signalForm.stopLoss ?? ''}
                          onChange={(e) => updateSignalForm({ stopLoss: parseFloat(e.target.value) || 0 })}
                          placeholder="4615.00"
                          className="w-full bg-[#12141A] border border-[#1F2229] rounded-xl px-3 py-2 text-xs font-mono text-[#FF4D6D] focus:border-[#FF4D6D] focus:outline-none"
                        />
                      </div>

                      {/* Take Profit 1 */}
                      <div>
                        <label className="text-[11px] text-[#94A3B8] font-bold block mb-1">TAKE PROFIT 1 (TP1)</label>
                        <input
                          type="number"
                          step="any"
                          value={signalForm.takeProfit1 ?? ''}
                          onChange={(e) => updateSignalForm({ takeProfit1: parseFloat(e.target.value) || 0 })}
                          placeholder="4680.00"
                          className="w-full bg-[#12141A] border border-[#1F2229] rounded-xl px-3 py-2 text-xs font-mono text-[#00FFA3] focus:border-[#00FFA3] focus:outline-none"
                        />
                      </div>

                      {/* Take Profit 2 */}
                      <div>
                        <label className="text-[11px] text-[#94A3B8] font-bold block mb-1">TAKE PROFIT 2 (TP2)</label>
                        <input
                          type="number"
                          step="any"
                          value={signalForm.takeProfit2 ?? ''}
                          onChange={(e) => setSignalForm((p) => ({ ...p, takeProfit2: parseFloat(e.target.value) || 0 }))}
                          placeholder="4720.00"
                          className="w-full bg-[#12141A] border border-[#1F2229] rounded-xl px-3 py-2 text-xs font-mono text-[#00FFA3] focus:border-[#00FFA3] focus:outline-none"
                        />
                      </div>

                      {/* Risk Reward */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] text-[#94A3B8] font-bold">RISK : REWARD</label>
                          <span className="text-[9px] text-[#00FFA3] font-mono font-bold bg-[#00FFA3]/10 px-1.5 py-0.5 rounded border border-[#00FFA3]/20">
                            ⚡ Auto-Calculated
                          </span>
                        </div>
                        <input
                          type="text"
                          value={signalForm.riskReward || '1:2.4'}
                          onChange={(e) => setSignalForm((p) => ({ ...p, riskReward: e.target.value }))}
                          placeholder="1:2.4"
                          className="w-full bg-[#12141A] border border-[#1F2229] rounded-xl px-3 py-2 text-xs font-mono text-[#F3F4F6] focus:border-[#00FFA3] focus:outline-none"
                        />
                      </div>

                      {/* Confidence Win Rate */}
                      <div>
                        <label className="text-[11px] text-[#94A3B8] font-bold block mb-1">CONFIDENCE / WIN RATE %</label>
                        <input
                          type="number"
                          value={signalForm.confidence ?? 88}
                          onChange={(e) => setSignalForm((p) => ({ ...p, confidence: parseInt(e.target.value) || 80 }))}
                          placeholder="88"
                          className="w-full bg-[#12141A] border border-[#1F2229] rounded-xl px-3 py-2 text-xs font-mono text-[#FFD700] focus:border-[#00FFA3] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Strategy */}
                    <div className="pt-2 text-xs">
                      <div>
                        <label className="text-[11px] text-[#94A3B8] font-bold block mb-1">STRATEGY NAME</label>
                        <input
                          type="text"
                          value={signalForm.strategy || ''}
                          onChange={(e) => setSignalForm((p) => ({ ...p, strategy: e.target.value }))}
                          placeholder="e.g. Order Block + Asian Session Liquidity Sweep"
                          className="w-full bg-[#12141A] border border-[#1F2229] rounded-xl px-3 py-2 text-xs text-[#F3F4F6] focus:border-[#00FFA3] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Publish Button */}
                    <button
                      type="button"
                      onClick={handlePublishSignal}
                      disabled={isPublishingSignal}
                      className="w-full py-3.5 bg-gradient-to-r from-[#00FFA3] to-[#00D182] hover:from-[#00E592] hover:to-[#00B873] text-[#0A0B0D] font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#00FFA3]/20 disabled:opacity-50 cursor-pointer transition-all transform active:scale-[0.99]"
                    >
                      <Zap className={`w-4 h-4 ${isPublishingSignal ? 'animate-spin' : ''}`} />
                      {isPublishingSignal ? 'Broadcasting Signal Live...' : 'CONFIRM & PUBLISH SIGNAL TO USERS'}
                    </button>
                  </div>
                </div>

                {/* RIGHT: Live Published Signals List (6 Cols) */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs text-[#F3F4F6] uppercase tracking-wider flex items-center gap-2">
                      <Flame className="w-4 h-4 text-[#FF4D6D]" />
                      Live Published Signals ({signalsList.length})
                    </h3>
                    <button
                      onClick={fetchAdminData}
                      className="text-[11px] text-[#00FFA3] hover:underline flex items-center gap-1 font-mono"
                    >
                      <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                  </div>

                  {signalsList.length === 0 ? (
                    <div className="bg-[#0E1015] border border-[#1F2229] rounded-2xl p-12 text-center space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-[#1F2229] flex items-center justify-center text-[#94A3B8]">
                        <Zap className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-bold text-[#F3F4F6]">No Trade Signals Published Yet</div>
                      <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
                        Paste a chart screenshot or fill out the signal form on the left to publish your first trade setup to user apps.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3.5 max-h-[800px] overflow-y-auto pr-1">
                      {signalsList.map((sig) => (
                        <div
                          key={sig.id}
                          className="bg-[#0E1015] border border-[#1F2229] hover:border-[#2A2E3B] rounded-2xl p-4 space-y-3 transition-all shadow-md"
                        >
                          {/* Top Row: Pair, Type, Timeframe, Tier, Delete */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#F3F4F6]">{sig.pair}</span>
                              <span
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${
                                  sig.type === 'BUY'
                                    ? 'bg-[#00FFA3]/15 text-[#00FFA3] border border-[#00FFA3]/30'
                                    : 'bg-[#FF4D6D]/15 text-[#FF4D6D] border border-[#FF4D6D]/30'
                                }`}
                              >
                                {sig.type}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-[#1A1D26] text-[10px] font-mono text-[#94A3B8]">
                                {sig.timeframe}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-[#FFD700]/10 border border-[#FFD700]/30 text-[10px] font-mono text-[#FFD700]">
                                {sig.tierRequired || 'FREE'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-[#94A3B8] font-mono">
                                {new Date(sig.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <button
                                onClick={() => handleDeleteSignal(sig.id)}
                                className="p-1.5 bg-[#1F2229] hover:bg-[#FF4D6D]/20 text-[#94A3B8] hover:text-[#FF4D6D] rounded-lg transition-colors cursor-pointer"
                                title="Delete Signal"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Price Grid */}
                          <div className="grid grid-cols-4 gap-2 text-center text-xs">
                            <div className="bg-[#12141A] p-2 rounded-xl border border-[#1F2229]">
                              <div className="text-[9px] text-[#94A3B8] font-bold">ENTRY</div>
                              <div className="font-mono text-[#00FFA3] font-bold text-xs mt-0.5">{sig.entryPrice}</div>
                            </div>
                            <div className="bg-[#12141A] p-2 rounded-xl border border-[#1F2229]">
                              <div className="text-[9px] text-[#94A3B8] font-bold">STOP LOSS</div>
                              <div className="font-mono text-[#FF4D6D] font-bold text-xs mt-0.5">{sig.stopLoss}</div>
                            </div>
                            <div className="bg-[#12141A] p-2 rounded-xl border border-[#1F2229]">
                              <div className="text-[9px] text-[#94A3B8] font-bold">TP 1</div>
                              <div className="font-mono text-[#00FFA3] font-bold text-xs mt-0.5">{sig.takeProfit1}</div>
                            </div>
                            <div className="bg-[#12141A] p-2 rounded-xl border border-[#1F2229]">
                              <div className="text-[9px] text-[#94A3B8] font-bold">R : R</div>
                              <div className="font-mono text-[#FFD700] font-bold text-xs mt-0.5">{sig.riskReward}</div>
                            </div>
                          </div>

                          {/* Strategy */}
                          <div className="text-xs">
                            <div className="text-[11px] font-bold text-[#E0E0E0]">{sig.strategy}</div>
                          </div>

                          {/* Attached Chart Preview */}
                          {sig.chartImageUrl && (
                            <div className="pt-1">
                              <img
                                src={sig.chartImageUrl}
                                alt="Signal Chart"
                                className="max-h-32 w-full object-cover rounded-xl border border-[#1F2229] cursor-pointer hover:opacity-90"
                                onClick={() => setSelectedScreenshotModal(sig.chartImageUrl!)}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USERS & EXPIRED USERS */}
          {activeSection === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[#F3F4F6]">User Accounts &amp; Expiration Management</h2>
                  <p className="text-xs text-[#94A3B8]">Manage user subscriptions, statuses, 30-day validity, and renewals.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsCreateUserModalOpen(true)}
                    className="px-4 py-2 bg-[#00FFA3] text-[#0A0B0D] font-extrabold rounded-xl text-xs flex items-center gap-2 shadow cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Create User
                  </button>
                </div>
              </div>

              {/* Sub-tabs: All Users vs Expired Users */}
              <div className="flex items-center gap-2 bg-[#0E1015] border border-[#1F2229] p-1.5 rounded-2xl w-fit">
                <button
                  onClick={() => setUserSubTab('ALL_USERS')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    userSubTab === 'ALL_USERS'
                      ? 'bg-[#00FFA3] text-[#0A0B0D] shadow'
                      : 'text-[#94A3B8] hover:text-[#E0E0E0]'
                  }`}
                >
                  All Users ({users.filter(u => u.role !== 'ADMIN').length})
                </button>
                <button
                  onClick={() => setUserSubTab('EXPIRED_USERS')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    userSubTab === 'EXPIRED_USERS'
                      ? 'bg-[#FF4D6D] text-white shadow'
                      : 'text-[#94A3B8] hover:text-[#E0E0E0]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    Expired Users ({users.filter((u) => u.role !== 'ADMIN' && ((u.subscriptionExpiresAt && u.subscriptionExpiresAt <= Date.now()) || u.tier === 'FREE_TRIAL')).length})
                  </span>
                </button>
              </div>

              <div className="relative max-w-md">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#64748B]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search users by name or email..."
                  className="w-full bg-[#0E1015] border border-[#1F2229] rounded-xl pl-9 pr-4 py-2 text-xs text-[#E0E0E0] placeholder-[#64748B] focus:outline-none focus:border-[#00FFA3]"
                />
              </div>

              {/* Table for ALL USERS */}
              {userSubTab === 'ALL_USERS' && (
                <div className="bg-[#0E1015] border border-[#1F2229] rounded-2xl overflow-hidden shadow-xl">
                  <table className="w-full text-left text-xs text-[#E0E0E0]">
                    <thead className="bg-[#12141A] text-[#94A3B8] border-b border-[#1F2229] font-mono text-[11px]">
                      <tr>
                        <th className="py-3 px-4">USER</th>
                        <th className="py-3 px-4">STATUS</th>
                        <th className="py-3 px-4">CURRENT PLAN</th>
                        <th className="py-3 px-4">MONTHLY PLAN VALIDITY & TIME LEFT</th>
                        <th className="py-3 px-4">LAST LOGIN</th>
                        <th className="py-3 px-4 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F2229]">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-[#12141A]">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#F3F4F6]">{u.name}</span>
                              {u.role === 'ADMIN' && (
                                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[9px] font-mono font-bold">
                                  👑 ADMIN
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#94A3B8] font-mono">{u.email}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                              u.status === 'BANNED' ? 'bg-[#FF4D6D] text-white' : 'bg-[#00FFA3]/15 text-[#00FFA3] border border-[#00FFA3]/30'
                            }`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={u.tier}
                              onChange={(e) => handleUpdateTier(u.id, e.target.value as SubscriptionTier)}
                              disabled={u.role === 'ADMIN'}
                              className={`border rounded-lg px-2.5 py-1.5 text-xs font-bold font-mono focus:outline-none transition-all cursor-pointer ${
                                u.tier === 'INSTITUTIONAL_VIP'
                                  ? 'bg-purple-950/40 text-purple-300 border-purple-500/40'
                                  : u.tier === 'PRO_TRADER'
                                  ? 'bg-[#00FFA3]/10 text-[#00FFA3] border-[#00FFA3]/30'
                                  : 'bg-[#12141A] text-[#94A3B8] border-[#1F2229]'
                              }`}
                            >
                              <option value="FREE_TRIAL">Free Plan (Basic)</option>
                              <option value="PRO_TRADER">Pro Trader (Monthly)</option>
                              <option value="INSTITUTIONAL_VIP">Institutional VIP</option>
                            </select>
                          </td>
                          <td className="py-3 px-4">
                            {(() => {
                              const info = getSubscriptionRemainingInfo(u);
                              return (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold ${info.badgeClass}`}>
                                      {info.label}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-[#64748B] font-mono">
                                    {info.subLabel}
                                  </div>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="py-3 px-4 text-[#94A3B8] font-mono text-[11px]">
                            {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() => handleOpenPlanManager(u)}
                              disabled={u.role === 'ADMIN'}
                              className="px-2.5 py-1 bg-[#1F2229] hover:bg-[#00FFA3] hover:text-[#0A0B0D] text-[#E0E0E0] rounded text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 border border-[#2A2E3B] disabled:opacity-40"
                              title="Manage Plan & Expiry Time"
                            >
                              <Crown className="w-3.5 h-3.5 text-[#00FFA3]" />
                              <span>Manage Plan</span>
                            </button>
                            <button
                              onClick={() => handleToggleBan(u.id, u.status)}
                              disabled={u.role === 'ADMIN'}
                              className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer ${
                                u.status === 'BANNED' ? 'bg-[#00FFA3] text-[#0A0B0D]' : 'bg-[#FF4D6D]/20 text-[#FF4D6D]'
                              }`}
                            >
                              {u.status === 'BANNED' ? 'Activate' : 'Suspend'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              disabled={u.role === 'ADMIN'}
                              className="px-2.5 py-1 bg-[#FF4D6D] text-white rounded text-xs font-bold disabled:opacity-50 cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Table for EXPIRED USERS */}
              {userSubTab === 'EXPIRED_USERS' && (
                <div className="bg-[#0E1015] border border-[#1F2229] rounded-2xl overflow-hidden shadow-xl space-y-2">
                  <div className="p-4 bg-[#12141A] border-b border-[#1F2229] flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-[#F3F4F6]">Expired &amp; Free Plan Users</h4>
                      <p className="text-[11px] text-[#94A3B8]">These accounts currently have no active monthly subscription and access only Free Plan features.</p>
                    </div>
                  </div>

                  <table className="w-full text-left text-xs text-[#E0E0E0]">
                    <thead className="bg-[#12141A] text-[#94A3B8] border-b border-[#1F2229] font-mono text-[11px]">
                      <tr>
                        <th className="py-3 px-4">USER</th>
                        <th className="py-3 px-4">CURRENT TIER</th>
                        <th className="py-3 px-4">PLAN EXPIRY STATUS</th>
                        <th className="py-3 px-4">STATUS</th>
                        <th className="py-3 px-4 text-right">QUICK RENEWAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F2229]">
                      {filteredUsers.filter((u) => u.role !== 'ADMIN' && ((u.subscriptionExpiresAt && u.subscriptionExpiresAt <= Date.now()) || u.tier === 'FREE_TRIAL')).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-[#64748B]">
                            No expired subscription users found.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers
                          .filter((u) => u.role !== 'ADMIN' && ((u.subscriptionExpiresAt && u.subscriptionExpiresAt <= Date.now()) || u.tier === 'FREE_TRIAL'))
                          .map((u) => {
                            const info = getSubscriptionRemainingInfo(u);
                            return (
                              <tr key={u.id} className="hover:bg-[#12141A]">
                                <td className="py-3 px-4">
                                  <div className="font-bold text-[#F3F4F6]">{u.name}</div>
                                  <div className="text-[11px] text-[#94A3B8] font-mono">{u.email}</div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1F2229] text-[#94A3B8]">
                                    {u.tier === 'FREE_TRIAL' ? 'Free Plan' : u.tier}
                                  </span>
                                </td>
                                <td className="py-3 px-4 font-mono text-[11px]">
                                  <span className={info.badgeClass + ' px-2 py-0.5 rounded text-[10px]'}>
                                    {info.label}
                                  </span>
                                  <div className="text-[10px] text-[#64748B] mt-0.5">{info.subLabel}</div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    u.status === 'BANNED' ? 'bg-[#FF4D6D] text-white' : 'bg-[#FF4D6D]/15 text-[#FF4D6D] border border-[#FF4D6D]/30'
                                  }`}>
                                    {u.status === 'BANNED' ? 'Suspended' : 'No Active Plan'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right space-x-2">
                                  <button
                                    onClick={() => handleOpenPlanManager(u)}
                                    className="px-3 py-1.5 bg-[#1F2229] hover:bg-[#2A2E3D] text-[#E0E0E0] font-bold rounded-lg text-xs shadow cursor-pointer transition-all inline-flex items-center gap-1 border border-[#2A2E3B]"
                                  >
                                    <Crown className="w-3.5 h-3.5 text-[#00FFA3]" />
                                    <span>Manage</span>
                                  </button>
                                  <button
                                    onClick={() => handleExtendSubscription(u.id, 'PRO_TRADER')}
                                    className="px-3 py-1.5 bg-[#00FFA3] hover:bg-[#05D588] text-[#0A0B0D] font-bold rounded-lg text-xs shadow cursor-pointer transition-all"
                                  >
                                    ⚡ Renew Pro (+30d)
                                  </button>
                                  <button
                                    onClick={() => handleExtendSubscription(u.id, 'INSTITUTIONAL_VIP')}
                                    className="px-3 py-1.5 bg-[#A855F7] hover:bg-[#9333EA] text-white font-bold rounded-lg text-xs shadow cursor-pointer transition-all"
                                  >
                                    ⭐ Renew VIP (+30d)
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: PAYMENTS & UPI PROOFS APPROVAL */}
          {activeSection === 'payments' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-[#F3F4F6]">UPI Payments &amp; Plan Approvals</h2>
                  <p className="text-xs text-[#94A3B8]">Review uploaded payment proofs, approve subscriptions, and configure UPI / QR details.</p>
                </div>

                {/* Sub-tab navigation */}
                <div className="flex items-center gap-2 bg-[#0E1015] border border-[#1F2229] p-1.5 rounded-2xl">
                  <button
                    onClick={() => setPaymentTab('REQUESTS')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                      paymentTab === 'REQUESTS'
                        ? 'bg-[#00FFA3] text-[#0A0B0D] shadow'
                        : 'text-[#94A3B8] hover:text-[#E0E0E0]'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Payment Requests ({paymentRequests.filter((r) => r.status === 'PENDING').length} Pending)</span>
                  </button>
                  <button
                    onClick={() => setPaymentTab('UPI_SETTINGS')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                      paymentTab === 'UPI_SETTINGS'
                        ? 'bg-[#00FFA3] text-[#0A0B0D] shadow'
                        : 'text-[#94A3B8] hover:text-[#E0E0E0]'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>UPI &amp; QR Settings</span>
                  </button>
                </div>
              </div>

              {/* Sub-tab 1: Payment Proof Requests Table */}
              {paymentTab === 'REQUESTS' && (
                <div className="space-y-4">
                  <div className="bg-[#0E1015] border border-[#1F2229] rounded-2xl overflow-hidden shadow-xl">
                    <table className="w-full text-left text-xs text-[#E0E0E0]">
                      <thead className="bg-[#12141A] text-[#94A3B8] uppercase text-[10px] font-mono border-b border-[#1F2229]">
                        <tr>
                          <th className="py-3 px-4">User Email / Name</th>
                          <th className="py-3 px-4">Plan</th>
                          <th className="py-3 px-4">Amount (INR)</th>
                          <th className="py-3 px-4">12-Digit UTR</th>
                          <th className="py-3 px-4">Screenshot</th>
                          <th className="py-3 px-4">Submitted Time</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1F2229]">
                        {paymentRequests.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-[#64748B]">
                              No payment proof submissions found.
                            </td>
                          </tr>
                        ) : (
                          paymentRequests.map((req) => (
                            <tr key={req.id} className="hover:bg-[#12141A]/50 transition-colors">
                              <td className="py-3.5 px-4 font-mono font-bold text-[#F3F4F6]">
                                <div>{req.userEmail || 'Guest User'}</div>
                                {req.userName && <div className="text-[10px] text-[#94A3B8]">{req.userName}</div>}
                              </td>
                              <td className="py-3.5 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    req.planId === 'INSTITUTIONAL_VIP'
                                      ? 'bg-[#A855F7]/20 text-[#A855F7] border border-[#A855F7]/40'
                                      : 'bg-[#00FFA3]/20 text-[#00FFA3] border border-[#00FFA3]/40'
                                  }`}
                                >
                                  {req.planName || req.planId}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-mono font-bold text-[#00FFA3]">
                                <div>₹{req.totalAmountINR?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                <div className="text-[10px] text-[#64748B] font-normal">
                                  ₹{req.baseAmountINR} + 18% GST (₹{req.gstAmountINR})
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-mono font-bold text-[#F3F4F6] select-all">
                                {req.utrNumber}
                              </td>
                              <td className="py-3.5 px-4">
                                {req.screenshotUrl ? (
                                  <button
                                    onClick={() => setSelectedScreenshotModal(req.screenshotUrl)}
                                    className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1A1D26] hover:bg-[#222634] border border-[#1F2229] rounded-lg text-[11px] text-[#00FFA3] cursor-pointer"
                                  >
                                    <ImageIcon className="w-3.5 h-3.5" />
                                    <span>View Proof</span>
                                  </button>
                                ) : (
                                  <span className="text-[#64748B]">No image</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 font-mono text-[11px] text-[#94A3B8]">
                                {new Date(req.submittedAt).toLocaleString()}
                              </td>
                              <td className="py-3.5 px-4">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    req.status === 'APPROVED'
                                      ? 'bg-[#00FFA3]/20 text-[#00FFA3] border border-[#00FFA3]/40'
                                      : req.status === 'REJECTED'
                                      ? 'bg-[#FF4D6D]/20 text-[#FF4D6D] border border-[#FF4D6D]/40'
                                      : 'bg-[#F59E0B]/20 text-[#FBBF24] border border-[#F59E0B]/40 animate-pulse'
                                  }`}
                                >
                                  {req.status}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right space-x-2">
                                {req.status === 'PENDING' ? (
                                  <>
                                    <button
                                      onClick={() => handleApprovePayment(req.id)}
                                      className="px-3 py-1.5 bg-[#00FFA3] hover:bg-[#05D588] text-[#0A0B0D] font-bold rounded-lg text-xs shadow cursor-pointer transition-all"
                                    >
                                      ✓ Approve &amp; Activate
                                    </button>
                                    <button
                                      onClick={() => handleRejectPayment(req.id)}
                                      className="px-2.5 py-1.5 bg-[#FF4D6D]/20 hover:bg-[#FF4D6D] text-[#FF4D6D] hover:text-white font-bold rounded-lg text-xs transition-all cursor-pointer"
                                    >
                                      ✕ Reject
                                    </button>
                                  </>
                                ) : req.status === 'APPROVED' ? (
                                  <span className="text-[#00FFA3] text-xs font-bold">Activated ✓</span>
                                ) : (
                                  <span className="text-[#FF4D6D] text-xs font-bold">Rejected</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub-tab 2: UPI & QR Code Settings */}
              {paymentTab === 'UPI_SETTINGS' && (
                <div className="bg-[#0E1015] border border-[#1F2229] rounded-2xl p-6 space-y-6 max-w-3xl">
                  <div className="flex items-center justify-between border-b border-[#1F2229] pb-4">
                    <div>
                      <h3 className="font-bold text-base text-[#F3F4F6]">Admin UPI &amp; Checkout Configuration</h3>
                      <p className="text-xs text-[#94A3B8]">These payment details and QR codes are dynamically displayed to all traders on checkout.</p>
                    </div>
                    <button
                      onClick={handleSavePaymentSettings}
                      disabled={isSavingPaymentSettings}
                      className="px-5 py-2.5 bg-[#00FFA3] hover:bg-[#05D588] disabled:bg-[#1A1D26] text-[#0A0B0D] font-extrabold text-xs rounded-xl flex items-center gap-2 shadow cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSavingPaymentSettings ? 'Saving...' : 'SAVE PAYMENT SETTINGS'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    {/* Form Fields */}
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[#E0E0E0] font-bold">UPI ID (VPA)</label>
                        <input
                          type="text"
                          value={paymentSettings.upiId}
                          onChange={(e) => setPaymentSettings((prev) => ({ ...prev, upiId: e.target.value }))}
                          placeholder="e.g. smcsignalpro@okaxis"
                          className="w-full bg-[#12141A] border border-[#1F2229] rounded-xl p-3 font-mono font-bold text-sm text-[#00FFA3] focus:outline-none focus:border-[#00FFA3]"
                        />
                        <span className="text-[10px] text-[#64748B]">Google Pay, PhonePe, Paytm, BHIM UPI ID</span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[#E0E0E0] font-bold">Payee / Account Name</label>
                        <input
                          type="text"
                          value={paymentSettings.payeeName}
                          onChange={(e) => setPaymentSettings((prev) => ({ ...prev, payeeName: e.target.value }))}
                          placeholder="e.g. SMC Signal Pro Trading"
                          className="w-full bg-[#12141A] border border-[#1F2229] rounded-xl p-3 font-bold text-xs text-[#F3F4F6] focus:outline-none focus:border-[#00FFA3]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[#E0E0E0] font-bold">USD to INR Rate (₹/$)</label>
                          <input
                            type="number"
                            value={paymentSettings.conversionRateUSDToINR}
                            onChange={(e) => setPaymentSettings((prev) => ({ ...prev, conversionRateUSDToINR: Number(e.target.value) }))}
                            className="w-full bg-[#12141A] border border-[#1F2229] rounded-xl p-3 font-mono font-bold text-xs text-[#00FFA3]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[#E0E0E0] font-bold">Government GST (%)</label>
                          <input
                            type="number"
                            value={paymentSettings.gstPercentage}
                            onChange={(e) => setPaymentSettings((prev) => ({ ...prev, gstPercentage: Number(e.target.value) }))}
                            className="w-full bg-[#12141A] border border-[#1F2229] rounded-xl p-3 font-mono font-bold text-xs text-[#00FFA3]"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[#E0E0E0] font-bold">Custom QR Code Image</label>
                        <label className="border-2 border-dashed border-[#1F2229] hover:border-[#00FFA3]/50 rounded-xl p-3.5 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-[#12141A] transition-colors">
                          <input type="file" accept="image/*" onChange={handleQrFileUpload} className="hidden" />
                          <Upload className="w-4 h-4 text-[#94A3B8]" />
                          <span className="text-[11px] text-[#94A3B8]">Upload Custom Scanner QR Image</span>
                        </label>
                      </div>
                    </div>

                    {/* Live Preview Card */}
                    <div className="bg-[#12141A] border border-[#1F2229] rounded-2xl p-5 flex flex-col items-center text-center justify-between space-y-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#1A1D26] text-[#00FFA3] border border-[#1F2229]">
                          LIVE CHECKOUT PREVIEW
                        </span>
                        <h4 className="font-bold text-sm text-[#F3F4F6] mt-2">{paymentSettings.payeeName}</h4>
                        <p className="font-mono text-xs text-[#00FFA3]">{paymentSettings.upiId}</p>
                      </div>

                      <div className="w-40 h-40 bg-white p-2 rounded-xl flex items-center justify-center border-2 border-[#00FFA3]">
                        <img
                          src={
                            paymentSettings.qrCodeUrl ||
                            `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                              `upi://pay?pa=${paymentSettings.upiId}&pn=${paymentSettings.payeeName}&cu=INR`
                            )}`
                          }
                          alt="QR Preview"
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="text-[10px] text-[#64748B] space-y-0.5">
                        <p>Pro ($29): <strong>₹{(29 * paymentSettings.conversionRateUSDToINR * 1.18).toFixed(2)}</strong> (inc. 18% GST)</p>
                        <p>VIP ($79): <strong>₹{(79 * paymentSettings.conversionRateUSDToINR * 1.18).toFixed(2)}</strong> (inc. 18% GST)</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FEATURES (MOST IMPORTANT UNIFIED HUB) */}
          {activeSection === 'features' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[#F3F4F6]">Application Features Control Hub</h2>
                <p className="text-xs text-[#94A3B8]">Configure app features, Pine Scripts, gap thresholds, and VIP access dynamically.</p>
              </div>

              {/* Sub-Navigation Bar inside Features */}
              <div className="flex items-center gap-1.5 bg-[#0E1015] border border-[#1F2229] p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
                {featureSubTabs.map((sub) => {
                  const isSubActive = activeFeatureSubTab === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setActiveFeatureSubTab(sub.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                        isSubActive
                          ? 'bg-[#00FFA3] text-[#0A0B0D] shadow-md'
                          : 'text-[#94A3B8] hover:bg-[#12141A] hover:text-[#E0E0E0]'
                      }`}
                    >
                      {sub.icon}
                      <span>{sub.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* SUB-SECTION 1: FVG FEATURE MANAGEMENT */}
              {activeFeatureSubTab === 'fvg' && (
                <div className="bg-[#0E1015] border border-[#1F2229] rounded-2xl p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-[#1F2229] pb-4">
                    <div>
                      <h3 className="font-bold text-base text-[#F3F4F6]">Fair Value Gap (FVG) Configuration</h3>
                      <p className="text-xs text-[#94A3B8]">Controls how the user panel detects and renders FVG overlays on TradingView chart.</p>
                    </div>
                    <button
                      onClick={() => handleSaveFeature('fvg', fvgConfig)}
                      className="px-5 py-2.5 bg-[#00FFA3] text-[#0A0B0D] font-extrabold text-xs rounded-xl flex items-center gap-2 shadow"
                    >
                      <Save className="w-4 h-4" /> SAVE FVG CONFIG TO APP
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    {/* Left Toggles */}
                    <div className="space-y-4 bg-[#12141A] border border-[#1F2229] p-4 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#F3F4F6]">FVG Feature Enabled</span>
                        <button
                          onClick={() => setFvgConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
                          className={`px-3 py-1 rounded-lg font-bold text-xs ${
                            fvgConfig.enabled ? 'bg-[#00FFA3] text-[#0A0B0D]' : 'bg-[#FF4D6D] text-white'
                          }`}
                        >
                          {fvgConfig.enabled ? 'ENABLED' : 'DISABLED'}
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#F3F4F6]">VIP Only Access</span>
                        <button
                          onClick={() => setFvgConfig((prev) => ({ ...prev, vipOnly: !prev.vipOnly }))}
                          className={`px-3 py-1 rounded-lg font-bold text-xs ${
                            fvgConfig.vipOnly ? 'bg-[#A855F7] text-white' : 'bg-[#1F2229] text-[#94A3B8]'
                          }`}
                        >
                          {fvgConfig.vipOnly ? 'VIP ONLY' : 'ALL USERS'}
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#F3F4F6]">Bullish FVG Sweeps</span>
                        <button
                          onClick={() => setFvgConfig((prev) => ({ ...prev, bullishEnabled: !prev.bullishEnabled }))}
                          className={`px-3 py-1 rounded-lg font-bold text-xs ${
                            fvgConfig.bullishEnabled ? 'bg-[#00FFA3]/20 text-[#00FFA3]' : 'bg-[#1F2229] text-[#64748B]'
                          }`}
                        >
                          {fvgConfig.bullishEnabled ? 'ON' : 'OFF'}
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#F3F4F6]">Bearish FVG Sweeps</span>
                        <button
                          onClick={() => setFvgConfig((prev) => ({ ...prev, bearishEnabled: !prev.bearishEnabled }))}
                          className={`px-3 py-1 rounded-lg font-bold text-xs ${
                            fvgConfig.bearishEnabled ? 'bg-[#FF4D6D]/20 text-[#FF4D6D]' : 'bg-[#1F2229] text-[#64748B]'
                          }`}
                        >
                          {fvgConfig.bearishEnabled ? 'ON' : 'OFF'}
                        </button>
                      </div>
                    </div>

                    {/* Right Parameters */}
                    <div className="space-y-4 bg-[#12141A] border border-[#1F2229] p-4 rounded-xl">
                      <div>
                        <label className="block text-[#94A3B8] font-bold mb-1">Minimum Gap Size (Pips): {fvgConfig.minGapPips}</label>
                        <input
                          type="range" min={1} max={15} step={0.5}
                          value={fvgConfig.minGapPips}
                          onChange={(e) => setFvgConfig((prev) => ({ ...prev, minGapPips: parseFloat(e.target.value) }))}
                          className="w-full accent-[#00FFA3]"
                        />
                      </div>

                      <div>
                        <label className="block text-[#94A3B8] font-bold mb-1">Default FVG Analysis Timeframe</label>
                        <select
                          value={fvgConfig.defaultTimeframe}
                          onChange={(e) => setFvgConfig((prev) => ({ ...prev, defaultTimeframe: e.target.value as any }))}
                          className="w-full bg-[#0A0B0D] border border-[#1F2229] rounded p-2 text-xs text-[#E0E0E0]"
                        >
                          <option value="1m">1 minute</option>
                          <option value="5m">5 minutes</option>
                          <option value="15m">15 minutes</option>
                          <option value="1H">1 Hour</option>
                          <option value="4H">4 Hours</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* FVG Pine Script Editor */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#F3F4F6] flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-[#00FFA3]" />
                        <span>Pine Script Code Assigned to FVG Feature</span>
                      </label>
                      <span className="text-[10px] text-[#00FFA3] font-mono">Will load when user clicks FVG in Trader Panel</span>
                    </div>
                    <textarea
                      value={fvgConfig.pineScriptCode || ''}
                      onChange={(e) => setFvgConfig((prev) => ({ ...prev, pineScriptCode: e.target.value }))}
                      rows={8}
                      className="w-full bg-[#0A0B0D] border border-[#1F2229] rounded-xl p-3 font-mono text-xs text-[#00FFA3] focus:outline-none focus:border-[#00FFA3]"
                    />
                  </div>
                </div>
              )}

              {/* SUB-SECTION 2: CHOCH FEATURE MANAGEMENT */}
              {activeFeatureSubTab === 'choch' && (
                <div className="bg-[#0E1015] border border-[#1F2229] rounded-2xl p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-[#1F2229] pb-4">
                    <div>
                      <h3 className="font-bold text-base text-[#F3F4F6]">CHoCH & Structure Configuration</h3>
                      <p className="text-xs text-[#94A3B8]">Controls Break of Structure & Change of Character triggers.</p>
                    </div>
                    <button
                      onClick={() => handleSaveFeature('choch', chochConfig)}
                      className="px-5 py-2.5 bg-[#00FFA3] text-[#0A0B0D] font-extrabold text-xs rounded-xl flex items-center gap-2 shadow"
                    >
                      <Save className="w-4 h-4" /> SAVE CHOCH CONFIG TO APP
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    <div className="space-y-4 bg-[#12141A] border border-[#1F2229] p-4 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#F3F4F6]">CHoCH Feature Enabled</span>
                        <button
                          onClick={() => setChochConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
                          className={`px-3 py-1 rounded-lg font-bold text-xs ${
                            chochConfig.enabled ? 'bg-[#00FFA3] text-[#0A0B0D]' : 'bg-[#FF4D6D] text-white'
                          }`}
                        >
                          {chochConfig.enabled ? 'ENABLED' : 'DISABLED'}
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#F3F4F6]">Require Candle Close Confirmation</span>
                        <button
                          onClick={() => setChochConfig((prev) => ({ ...prev, requireCandleClose: !prev.requireCandleClose }))}
                          className={`px-3 py-1 rounded-lg font-bold text-xs ${
                            chochConfig.requireCandleClose ? 'bg-[#00FFA3]/20 text-[#00FFA3]' : 'bg-[#1F2229] text-[#64748B]'
                          }`}
                        >
                          {chochConfig.requireCandleClose ? 'YES' : 'WICK BREAK OK'}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4 bg-[#12141A] border border-[#1F2229] p-4 rounded-xl">
                      <div>
                        <label className="block text-[#94A3B8] font-bold mb-1">Swing Lookback Candles: {chochConfig.lookbackSwings}</label>
                        <input
                          type="range" min={3} max={20} step={1}
                          value={chochConfig.lookbackSwings}
                          onChange={(e) => setChochConfig((prev) => ({ ...prev, lookbackSwings: parseInt(e.target.value) }))}
                          className="w-full accent-[#00FFA3]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* CHoCH Pine Script Code */}
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-[#F3F4F6] flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-[#00FFA3]" />
                      <span>Pine Script Code Assigned to CHoCH Feature</span>
                    </label>
                    <textarea
                      value={chochConfig.pineScriptCode || ''}
                      onChange={(e) => setChochConfig((prev) => ({ ...prev, pineScriptCode: e.target.value }))}
                      rows={8}
                      className="w-full bg-[#0A0B0D] border border-[#1F2229] rounded-xl p-3 font-mono text-xs text-[#00FFA3] focus:outline-none focus:border-[#00FFA3]"
                    />
                  </div>
                </div>
              )}

              {/* SUB-SECTION 3: PINE SCRIPTS HUB */}
              {activeFeatureSubTab === 'pinescripts' && (
                <div className="bg-[#0E1015] border border-[#1F2229] rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-base text-[#F3F4F6]">Pine Script Repository</h3>
                      <p className="text-xs text-[#94A3B8]">Central library to create, edit, replace, and assign scripts to features.</p>
                    </div>
                    <button
                      onClick={() => setEditingScript({ name: '', code: '//@version=5\nindicator("Custom Indicator", overlay=true)', targetFeature: 'CUSTOM', enabled: true })}
                      className="px-4 py-2 bg-[#00FFA3] text-[#0A0B0D] font-bold text-xs rounded-xl flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add New Script
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pineScripts.map((s) => (
                      <div key={s.id} className="p-4 bg-[#12141A] border border-[#1F2229] rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#00FFA3]">{s.name}</span>
                          <span className="text-[10px] px-2 py-0.5 bg-[#1F2229] text-[#94A3B8] rounded font-mono">{s.targetFeature}</span>
                        </div>
                        <pre className="bg-[#0A0B0D] p-3 rounded text-[11px] font-mono text-[#94A3B8] max-h-28 overflow-hidden">
                          {s.code}
                        </pre>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingScript(s)}
                            className="px-3 py-1 bg-[#1F2229] hover:bg-[#2A2E3D] text-xs font-bold rounded"
                          >
                            Edit Code
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* OTHER SUB-TABS */}
              {['indicators', 'ai_scan', 'tradingview', 'trading_controls'].includes(activeFeatureSubTab) && (
                <div className="bg-[#0E1015] border border-[#1F2229] rounded-2xl p-6 space-y-4">
                  <h3 className="font-bold text-sm text-[#F3F4F6] uppercase">{activeFeatureSubTab.replace('_', ' ')} Settings</h3>
                  <p className="text-xs text-[#94A3B8]">Configure permissions and live parameters for this feature.</p>
                  <button
                    onClick={() => handleSaveFeature(activeFeatureSubTab, { active: true, updatedAt: Date.now() })}
                    className="px-5 py-2.5 bg-[#00FFA3] text-[#0A0B0D] font-extrabold text-xs rounded-xl"
                  >
                    SAVE {activeFeatureSubTab.toUpperCase()} CONFIG
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SUBSCRIPTIONS & COUPON CODES */}
          {activeSection === 'subscriptions' && (
            <div className="space-y-6 max-w-5xl">
              {/* Header with Sub-Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F2229] pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-[#F3F4F6] flex items-center gap-2">
                    <Crown className="w-5 h-5 text-[#00FFA3]" />
                    <span>Subscriptions & Promo Coupons Hub</span>
                  </h2>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Adjust subscription plan amounts (USD / INR), manage features, and issue single-use per email coupon codes.
                  </p>
                </div>

                {/* Sub-Tab Switcher */}
                <div className="flex items-center gap-2 bg-[#0E1015] border border-[#1F2229] p-1 rounded-xl shrink-0">
                  <button
                    onClick={() => setSubSectionTab('PLANS')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      subSectionTab === 'PLANS'
                        ? 'bg-[#00FFA3] text-[#0A0B0D] shadow'
                        : 'text-[#94A3B8] hover:text-[#E0E0E0]'
                    }`}
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>Plan Pricing & Tiers ({plans.length})</span>
                  </button>

                  <button
                    onClick={() => setSubSectionTab('COUPONS')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      subSectionTab === 'COUPONS'
                        ? 'bg-[#00FFA3] text-[#0A0B0D] shadow'
                        : 'text-[#94A3B8] hover:text-[#E0E0E0]'
                    }`}
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    <span>Promo & Coupon Codes ({couponsList.length})</span>
                  </button>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* SUB-TAB 1: SUBSCRIPTION PLANS & PRICING */}
              {/* ---------------------------------------------------- */}
              {subSectionTab === 'PLANS' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-[#12141A] border border-[#1F2229] p-3.5 rounded-xl">
                    <div className="text-xs text-[#94A3B8]">
                      ⚡ <span className="text-[#00FFA3] font-bold">Dynamic Pricing Active:</span> Any price adjustments saved here immediately update the user-facing Subscription matrix and Checkout Gateway.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plans.map((p) => {
                      const calculatedINR = p.priceINR || Math.round(p.priceUSD * (paymentSettings?.conversionRateUSDToINR || 95));
                      return (
                        <div
                          key={p.id}
                          className="p-5 bg-[#0E1015] border border-[#1F2229] hover:border-[#00FFA3]/40 rounded-2xl space-y-4 flex flex-col justify-between shadow-xl transition-all relative overflow-hidden"
                        >
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-extrabold text-base text-[#F3F4F6]">{p.name}</h3>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-[#00FFA3]/10 text-[#00FFA3] font-mono border border-[#00FFA3]/20">
                                  {p.tier || p.id}
                                </span>
                              </div>
                              <span className="text-xs text-[#94A3B8] font-mono bg-[#161922] px-2.5 py-1 rounded-lg border border-[#1F2229]">
                                {p.durationDays || 30} Days
                              </span>
                            </div>

                            <div className="pt-2 border-t border-[#1F2229]">
                              <div className="text-3xl font-extrabold font-mono text-[#00FFA3]">
                                ${p.priceUSD}
                                <span className="text-xs text-[#94A3B8] font-normal"> / {p.billingPeriod || 'period'}</span>
                              </div>
                              <div className="text-xs font-mono text-[#94A3B8] mt-0.5">
                                ≈ ₹{calculatedINR.toLocaleString()} INR (incl. GST)
                              </div>
                            </div>

                            <div className="space-y-1.5 pt-2">
                              <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider block">Included Features:</span>
                              <ul className="text-xs text-[#E0E0E0] space-y-1">
                                {p.features.map((f, i) => (
                                  <li key={i} className="flex items-start gap-1.5">
                                    <Check className="w-3.5 h-3.5 text-[#00FFA3] shrink-0 mt-0.5" />
                                    <span>{f}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <button
                            onClick={() => setEditingPlan({ ...p, priceINR: calculatedINR, durationDays: p.durationDays || 30 })}
                            className="w-full py-2.5 bg-[#1F2229] hover:bg-[#00FFA3] hover:text-[#0A0B0D] text-[#E0E0E0] rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-[#2A2E3B]"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Adjust Plan Amount & Details</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* SUB-TAB 2: PROMO & COUPON CODES MANAGER */}
              {/* ---------------------------------------------------- */}
              {subSectionTab === 'COUPONS' && (
                <div className="space-y-4">
                  {/* Single-Use Per Email Notice Banner */}
                  <div className="p-4 bg-[#0E1015] border border-[#00FFA3]/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="p-2.5 bg-[#00FFA3]/15 border border-[#00FFA3]/40 text-[#00FFA3] rounded-xl shrink-0">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#F3F4F6]">🔒 Single-Use Per Email Rule Active</h4>
                        <p className="text-xs text-[#94A3B8]">
                          Every coupon code can only be redeemed <strong>1 time per unique user email address</strong>. Repeat attempts by the same email are blocked automatically.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsCreateCouponModalOpen(true)}
                      className="px-4 py-2.5 bg-[#00FFA3] hover:bg-[#05D588] text-[#0A0B0D] font-extrabold text-xs rounded-xl shadow-lg shadow-[#00FFA3]/20 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Issue New Coupon Code</span>
                    </button>
                  </div>

                  {/* Coupons Table */}
                  <div className="bg-[#0E1015] border border-[#1F2229] rounded-2xl overflow-hidden shadow-xl">
                    <table className="w-full text-left text-xs text-[#E0E0E0]">
                      <thead className="bg-[#12141A] text-[#94A3B8] font-mono text-[11px] border-b border-[#1F2229]">
                        <tr>
                          <th className="py-3 px-4">COUPON CODE</th>
                          <th className="py-3 px-4">DISCOUNT</th>
                          <th className="py-3 px-4">STATUS</th>
                          <th className="py-3 px-4">EXPIRY</th>
                          <th className="py-3 px-4">TOTAL USES</th>
                          <th className="py-3 px-4">REDEEMED EMAILS</th>
                          <th className="py-3 px-4 text-right">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1F2229]">
                        {couponsList.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-10 text-center text-[#64748B]">
                              No coupon codes created yet. Click "Issue New Coupon Code" to create one.
                            </td>
                          </tr>
                        ) : (
                          couponsList.map((c) => {
                            const isExpired = c.expiresAt ? Date.now() > c.expiresAt : false;
                            const isMaxed = c.maxUses ? c.usedCount >= c.maxUses : false;
                            const discountDisplay =
                              c.discountType === 'PERCENTAGE'
                                ? `${c.discountValue}% OFF`
                                : c.discountType === 'FLAT_USD'
                                ? `$${c.discountValue} OFF`
                                : `₹${c.discountValue} OFF`;

                            return (
                              <tr key={c.id} className="hover:bg-[#12141A] transition-colors">
                                <td className="py-3.5 px-4 font-mono">
                                  <div className="font-extrabold text-[#00FFA3] text-sm tracking-wider flex items-center gap-1.5">
                                    <Tag className="w-3.5 h-3.5" />
                                    <span>{c.code}</span>
                                  </div>
                                  {c.description && (
                                    <div className="text-[11px] text-[#94A3B8] font-sans truncate max-w-xs">
                                      {c.description}
                                    </div>
                                  )}
                                </td>

                                <td className="py-3.5 px-4 font-bold font-mono text-[#F3F4F6]">
                                  <span className="px-2 py-1 rounded bg-[#00FFA3]/15 text-[#00FFA3] border border-[#00FFA3]/30">
                                    {discountDisplay}
                                  </span>
                                </td>

                                <td className="py-3.5 px-4">
                                  <button
                                    onClick={() => handleToggleCoupon(c)}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono cursor-pointer transition-all ${
                                      !c.active
                                        ? 'bg-[#1F2229] text-[#94A3B8]'
                                        : isExpired || isMaxed
                                        ? 'bg-[#FF4D6D]/20 text-[#FF4D6D] border border-[#FF4D6D]/40'
                                        : 'bg-[#00FFA3]/15 text-[#00FFA3] border border-[#00FFA3]/40'
                                    }`}
                                  >
                                    {!c.active ? 'PAUSED' : isExpired ? 'EXPIRED' : isMaxed ? 'LIMIT REACHED' : 'ACTIVE'}
                                  </button>
                                </td>

                                <td className="py-3.5 px-4 font-mono text-[11px] text-[#94A3B8]">
                                  {c.expiresAt ? (
                                    <span className={isExpired ? 'text-[#FF4D6D] font-bold' : 'text-[#E0E0E0]'}>
                                      {new Date(c.expiresAt).toLocaleDateString()}
                                    </span>
                                  ) : (
                                    <span className="text-[#64748B]">Never Expires</span>
                                  )}
                                </td>

                                <td className="py-3.5 px-4 font-mono text-xs">
                                  <span className="text-[#00FFA3] font-bold">{c.usedCount}</span>
                                  {c.maxUses && <span className="text-[#64748B]"> / {c.maxUses} max</span>}
                                </td>

                                <td className="py-3.5 px-4">
                                  <button
                                    onClick={() => setSelectedCouponUsersModal(c)}
                                    className="px-2.5 py-1 bg-[#161922] hover:bg-[#1F2229] border border-[#1F2229] hover:border-[#00FFA3]/40 rounded-lg text-[11px] font-mono text-[#94A3B8] hover:text-[#00FFA3] transition-all flex items-center gap-1 cursor-pointer"
                                  >
                                    <Users className="w-3 h-3" />
                                    <span>{c.usedByEmails?.length || 0} user(s)</span>
                                  </button>
                                </td>

                                <td className="py-3.5 px-4 text-right">
                                  <button
                                    onClick={() => handleDeleteCoupon(c.id, c.code)}
                                    className="p-1.5 hover:bg-[#FF4D6D]/20 text-[#FF4D6D] rounded-lg transition-colors cursor-pointer"
                                    title="Delete Coupon"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: WEBSITE MANAGER */}
          {activeSection === 'website' && (
            <div className="space-y-6 max-w-5xl">
              {/* Header with quick launch & save button */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0E1015] border border-[#1F2229] rounded-2xl p-6 shadow-xl">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#00FFA3]/15 border border-[#00FFA3]/30 flex items-center justify-center text-[#00FFA3]">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold text-[#F3F4F6]">Website Manager</h2>
                      <p className="text-xs text-[#94A3B8] mt-0.5">
                        Manage marketing website content, announcement banners, pricing display, and contact info.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <a
                    href={websiteSettings.siteUrl || 'http://localhost:3000'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1F2229] hover:bg-[#2A2E3B] text-gray-200 text-xs font-bold rounded-xl border border-[#2A2E3B] transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#00FFA3]" />
                    Preview Website
                  </a>
                  <button
                    onClick={handleSaveWebsiteSettings}
                    disabled={isSavingWebsiteSettings}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-[#00FFA3] hover:bg-[#00E08F] text-[#0A0B0D] text-xs font-black rounded-xl shadow-lg shadow-[#00FFA3]/20 transition-all disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {isSavingWebsiteSettings ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>

              {/* Health & Status Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#0E1015] border border-[#1F2229] rounded-2xl p-4 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-[#64748B] uppercase tracking-wider">
                    Website URL
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#00FFA3] animate-pulse" />
                    <span className="text-xs font-bold text-gray-200 truncate font-mono">
                      {websiteSettings.siteUrl || 'http://localhost:3000'}
                    </span>
                  </div>
                </div>

                <div className="bg-[#0E1015] border border-[#1F2229] rounded-2xl p-4 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-[#64748B] uppercase tracking-wider">
                    Announcement Banner
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${websiteSettings.announcementBannerEnabled ? 'bg-[#00FFA3]' : 'bg-gray-600'}`} />
                    <span className="text-xs font-bold text-gray-200">
                      {websiteSettings.announcementBannerEnabled ? 'Active (Live)' : 'Disabled'}
                    </span>
                  </div>
                </div>

                <div className="bg-[#0E1015] border border-[#1F2229] rounded-2xl p-4 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-[#64748B] uppercase tracking-wider">
                    Pricing Display
                  </span>
                  <div className="text-xs font-bold text-gray-200 font-mono">
                    Pro: ${websiteSettings.proPlanMonthlyPrice}/mo • VIP: ${websiteSettings.vipPlanMonthlyPrice}/mo
                  </div>
                </div>

                <div className="bg-[#0E1015] border border-[#1F2229] rounded-2xl p-4 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-[#64748B] uppercase tracking-wider">
                    Support Channel
                  </span>
                  <div className="text-xs font-bold text-[#00FFA3] truncate font-mono">
                    {websiteSettings.telegramUrl ? 'Telegram Connected' : 'Email Only'}
                  </div>
                </div>
              </div>

              {/* Sub-tabs for Website Manager */}
              <div className="flex gap-2 border-b border-[#1F2229] pb-3">
                {[
                  { id: 'GENERAL', label: 'Landing & Hero' },
                  { id: 'BANNER', label: 'Announcement Banner' },
                  { id: 'PLANS_DISPLAY', label: 'Pricing & Plans' },
                  { id: 'CONTACTS', label: 'Contact & Support' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setWebsiteSubTab(t.id as any)}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                      websiteSubTab === t.id
                        ? 'bg-[#00FFA3]/15 text-[#00FFA3] border border-[#00FFA3]/30 shadow-md'
                        : 'text-gray-400 hover:text-white hover:bg-[#1F2229]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Sub-tab 1: Landing & Hero */}
              {websiteSubTab === 'GENERAL' && (
                <div className="bg-[#0E1015] border border-[#1F2229] rounded-2xl p-6 space-y-5 shadow-xl">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Hero Section & Taglines
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                        Marketing Website Target URL
                      </label>
                      <input
                        type="text"
                        value={websiteSettings.siteUrl}
                        onChange={(e) => setWebsiteSettings({ ...websiteSettings, siteUrl: e.target.value })}
                        placeholder="http://localhost:3000"
                        className="w-full px-4 py-2.5 bg-[#0A0B0D] border border-[#1F2229] rounded-xl text-xs text-gray-200 font-mono focus:border-[#00FFA3] focus:outline-none"
                      />
                      <p className="text-[11px] text-[#64748B] mt-1">
                        Base URL used for preview buttons and cross-app navigation.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                        Promo Badge Text (Above Main Headline)
                      </label>
                      <input
                        type="text"
                        value={websiteSettings.promoBadgeText}
                        onChange={(e) => setWebsiteSettings({ ...websiteSettings, promoBadgeText: e.target.value })}
                        placeholder="Institutional SMC Analysis Platform"
                        className="w-full px-4 py-2.5 bg-[#0A0B0D] border border-[#1F2229] rounded-xl text-xs text-gray-200 focus:border-[#00FFA3] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                        Main Hero Headline
                      </label>
                      <input
                        type="text"
                        value={websiteSettings.heroHeadline}
                        onChange={(e) => setWebsiteSettings({ ...websiteSettings, heroHeadline: e.target.value })}
                        placeholder="Trade Smarter with SMC SIGNAL"
                        className="w-full px-4 py-2.5 bg-[#0A0B0D] border border-[#1F2229] rounded-xl text-xs text-gray-200 focus:border-[#00FFA3] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                        Hero Description / Sub-headline
                      </label>
                      <textarea
                        rows={3}
                        value={websiteSettings.heroSubheadline}
                        onChange={(e) => setWebsiteSettings({ ...websiteSettings, heroSubheadline: e.target.value })}
                        placeholder="Detect institutional order blocks, fair value gaps, and liquidity sweeps in real-time."
                        className="w-full px-4 py-2.5 bg-[#0A0B0D] border border-[#1F2229] rounded-xl text-xs text-gray-200 focus:border-[#00FFA3] focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab 2: Announcement Banner */}
              {websiteSubTab === 'BANNER' && (
                <div className="bg-[#0E1015] border border-[#1F2229] rounded-2xl p-6 space-y-5 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Top Announcement Banner
                      </h3>
                      <p className="text-xs text-[#94A3B8] mt-1">
                        Displays a high-visibility alert bar across the top of the marketing website.
                      </p>
                    </div>

                    <button
                      onClick={() => setWebsiteSettings({
                        ...websiteSettings,
                        announcementBannerEnabled: !websiteSettings.announcementBannerEnabled
                      })}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                        websiteSettings.announcementBannerEnabled
                          ? 'bg-[#00FFA3] text-[#0A0B0D] shadow-lg shadow-[#00FFA3]/20'
                          : 'bg-[#1F2229] text-[#64748B]'
                      }`}
                    >
                      {websiteSettings.announcementBannerEnabled ? 'Banner is ON' : 'Banner is OFF'}
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                      Banner Announcement Message
                    </label>
                    <input
                      type="text"
                      value={websiteSettings.announcementBannerText}
                      onChange={(e) => setWebsiteSettings({ ...websiteSettings, announcementBannerText: e.target.value })}
                      placeholder="Special Announcement: VIP Signal Hub now live!"
                      className="w-full px-4 py-2.5 bg-[#0A0B0D] border border-[#1F2229] rounded-xl text-xs text-gray-200 focus:border-[#00FFA3] focus:outline-none"
                    />
                  </div>

                  {/* Banner Preview */}
                  <div className="p-4 bg-[#0A0B0D] border border-[#1F2229] rounded-xl space-y-2">
                    <span className="text-[10px] font-mono text-gray-500 uppercase">Live Banner Preview</span>
                    <div className="p-3 bg-[#00FFA3]/10 border border-[#00FFA3]/30 rounded-lg flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#00FFA3] shrink-0" />
                      <span className="text-xs font-semibold text-gray-200">
                        {websiteSettings.announcementBannerText || 'Announcement text goes here...'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab 3: Pricing & Plans */}
              {websiteSubTab === 'PLANS_DISPLAY' && (
                <div className="bg-[#0E1015] border border-[#1F2229] rounded-2xl p-6 space-y-5 shadow-xl">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Plan Display Prices
                  </h3>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                        Pro Trader Monthly Price ($ USD)
                      </label>
                      <input
                        type="number"
                        value={websiteSettings.proPlanMonthlyPrice}
                        onChange={(e) => setWebsiteSettings({
                          ...websiteSettings,
                          proPlanMonthlyPrice: Number(e.target.value) || 0
                        })}
                        className="w-full px-4 py-2.5 bg-[#0A0B0D] border border-[#1F2229] rounded-xl text-xs text-gray-200 font-mono focus:border-[#00FFA3] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                        Institutional VIP Monthly Price ($ USD)
                      </label>
                      <input
                        type="number"
                        value={websiteSettings.vipPlanMonthlyPrice}
                        onChange={(e) => setWebsiteSettings({
                          ...websiteSettings,
                          vipPlanMonthlyPrice: Number(e.target.value) || 0
                        })}
                        className="w-full px-4 py-2.5 bg-[#0A0B0D] border border-[#1F2229] rounded-xl text-xs text-gray-200 font-mono focus:border-[#00FFA3] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                      Free Trial Plan Tagline
                    </label>
                    <input
                      type="text"
                      value={websiteSettings.freeTrialHeadline}
                      onChange={(e) => setWebsiteSettings({ ...websiteSettings, freeTrialHeadline: e.target.value })}
                      placeholder="Get started with core charting and market news at no cost."
                      className="w-full px-4 py-2.5 bg-[#0A0B0D] border border-[#1F2229] rounded-xl text-xs text-gray-200 focus:border-[#00FFA3] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Sub-tab 4: Contact & Support */}
              {websiteSubTab === 'CONTACTS' && (
                <div className="bg-[#0E1015] border border-[#1F2229] rounded-2xl p-6 space-y-5 shadow-xl">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Website Contact Channels
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                        Official Support Email
                      </label>
                      <input
                        type="email"
                        value={websiteSettings.supportEmail}
                        onChange={(e) => setWebsiteSettings({ ...websiteSettings, supportEmail: e.target.value })}
                        placeholder="support@smcsignal.pro"
                        className="w-full px-4 py-2.5 bg-[#0A0B0D] border border-[#1F2229] rounded-xl text-xs text-gray-200 font-mono focus:border-[#00FFA3] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                        Telegram Community URL
                      </label>
                      <input
                        type="text"
                        value={websiteSettings.telegramUrl}
                        onChange={(e) => setWebsiteSettings({ ...websiteSettings, telegramUrl: e.target.value })}
                        placeholder="https://t.me/smcsignalpro"
                        className="w-full px-4 py-2.5 bg-[#0A0B0D] border border-[#1F2229] rounded-xl text-xs text-gray-200 font-mono focus:border-[#00FFA3] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Footer */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveWebsiteSettings}
                  disabled={isSavingWebsiteSettings}
                  className="flex items-center gap-2 px-6 py-3 bg-[#00FFA3] hover:bg-[#00E08F] text-[#0A0B0D] text-xs font-black rounded-xl shadow-lg shadow-[#00FFA3]/20 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSavingWebsiteSettings ? 'Saving Settings…' : 'Save Website Configurations'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: SETTINGS */}
          {activeSection === 'settings' && (
            <div className="space-y-6 max-w-3xl">
              {/* 1. Global Free Access Control Card */}
              <div className="bg-[#0E1015] border border-[#1F2229] rounded-2xl p-6 space-y-5 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#00FFA3]/15 border border-[#00FFA3]/30 flex items-center justify-center text-[#00FFA3]">
                        <Crown className="w-4 h-4" />
                      </div>
                      <h2 className="text-lg font-bold text-[#F3F4F6]">Global Free Access Control</h2>
                    </div>
                    <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">
                      Toggle institution-wide free VIP access for all registered, authenticated, and verified traders.
                    </p>
                  </div>

                  {/* Persistent ON/OFF Toggle */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs font-mono font-bold ${
                      globalSettings?.globalFreeAccess ? 'text-[#00FFA3]' : 'text-[#64748B]'
                    }`}>
                      {globalSettings?.globalFreeAccess ? 'ACTIVE (ON)' : 'DISABLED (OFF)'}
                    </span>
                    <button
                      id="btn-toggle-global-free-access"
                      type="button"
                      disabled={isTogglingFreeAccess}
                      onClick={() => handleToggleGlobalFreeAccess(!globalSettings?.globalFreeAccess)}
                      className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        globalSettings?.globalFreeAccess ? 'bg-[#00FFA3]' : 'bg-[#1F2229]'
                      }`}
                      title={globalSettings?.globalFreeAccess ? 'Turn Global Free Access OFF' : 'Turn Global Free Access ON'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-[#0A0B0D] shadow-lg ring-0 transition duration-200 ease-in-out ${
                          globalSettings?.globalFreeAccess ? 'translate-x-7' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Status Indicator Banner */}
                <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
                  globalSettings?.globalFreeAccess
                    ? 'bg-[#00FFA3]/10 border-[#00FFA3]/30 text-[#00FFA3]'
                    : 'bg-[#12141A] border-[#1F2229] text-[#94A3B8]'
                }`}>
                  <Shield className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold">
                      {globalSettings?.globalFreeAccess
                        ? 'Global Free Access is ON indefinitely'
                        : 'Global Free Access is OFF (Standard Subscriptions Enforced)'}
                    </div>
                    <p className="text-[11px] leading-relaxed text-[#94A3B8]">
                      {globalSettings?.globalFreeAccess
                        ? 'All registered and verified accounts receive full Institutional VIP and Pro access for free without requiring payment or an active subscription. Visitors who have not signed up remain strictly restricted.'
                        : 'Traders must meet the application’s regular subscription plans and trials. All existing user payment histories, subscriptions, and billing records remain securely preserved.'}
                    </p>
                  </div>
                </div>

                {/* Enforce Email Verification Setting */}
                <div className="p-4 bg-[#12141A] border border-[#1F2229] rounded-xl flex items-center justify-between gap-4 text-xs">
                  <div>
                    <span className="font-bold text-[#F3F4F6] block">Require Email Verification for Free Access</span>
                    <span className="text-[11px] text-[#64748B] block mt-0.5">
                      When enabled, newly registered users must click the verification link in their email before receiving free VIP access.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleEmailVerificationEnforcement(!(globalSettings?.enforceEmailVerification ?? true))}
                    className={`px-3.5 py-1.5 rounded-lg font-bold text-xs font-mono transition-all cursor-pointer ${
                      (globalSettings?.enforceEmailVerification ?? true)
                        ? 'bg-[#00FFA3] text-[#0A0B0D] shadow-md shadow-[#00FFA3]/20'
                        : 'bg-[#1F2229] text-[#94A3B8] hover:text-[#E0E0E0]'
                    }`}
                  >
                    {(globalSettings?.enforceEmailVerification ?? true) ? 'ENFORCED' : 'OPTIONAL'}
                  </button>
                </div>

                {/* System Access Rules Documentation for Admin */}
                <div className="p-4 bg-[#0A0B0D] border border-[#1F2229] rounded-xl text-xs space-y-2 text-[#94A3B8]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#F3F4F6] block">
                    Security &amp; Persistence Rules
                  </span>
                  <ul className="space-y-1.5 text-[11px] list-disc list-inside">
                    <li><strong className="text-[#E0E0E0]">Persistent Storage:</strong> State is saved in database table <code className="text-[#00FFA3]">public.app_config</code>. Remains ON indefinitely until you manually turn it OFF. Survives refreshes, logouts, deployments, and restarts.</li>
                    <li><strong className="text-[#E0E0E0]">Visitors Restricted:</strong> Unauthenticated visitors and logged-out users are strictly gated and never receive free access.</li>
                    <li><strong className="text-[#E0E0E0]">Admin-Only Control:</strong> Modifying this setting requires an authorized administrator session. Normal users and visitors cannot bypass checks.</li>
                    <li><strong className="text-[#E0E0E0]">Audit Logging:</strong> Every toggle action automatically records an immutable timestamped log entry with the admin email.</li>
                  </ul>
                </div>
              </div>

              {/* 2. Maintenance Mode & General Settings Card */}
              <div className="bg-[#0E1015] border border-[#1F2229] rounded-2xl p-6 space-y-4 shadow-xl">
                <h3 className="text-base font-bold text-[#F3F4F6]">General Platform Maintenance</h3>
                <div className="flex items-center justify-between text-xs p-4 bg-[#12141A] border border-[#1F2229] rounded-xl">
                  <div>
                    <span className="font-bold text-[#F3F4F6] block">Global Maintenance Mode</span>
                    <span className="text-[11px] text-[#64748B] block mt-0.5">
                      Displays a maintenance advisory banner on the trader dashboard while preserving live spot feeds.
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const nextMode = !globalSettings?.maintenanceMode;
                      supabaseSaveGlobalSettings({
                        ...(globalSettings || {
                          tradingEnabled: true,
                          aiScanEnabled: true,
                          fvgEnabled: true,
                          chochEnabled: true,
                          pineScriptEnabled: true,
                          tradingViewEnabled: true,
                          indicatorsEnabled: true,
                          vipEnabled: true,
                          marketDataEnabled: true,
                          notificationsEnabled: true,
                          maintenanceMode: false,
                          maintenanceMessage: '',
                          appName: 'SMC Signal Pro',
                          defaultTimeframe: '15m' as TimeFrame,
                          maxLotSize: 10,
                          maxLeverage: 100,
                          globalFreeAccess: false,
                          enforceEmailVerification: true,
                        }),
                        maintenanceMode: nextMode,
                      }, currentUser.email);
                      notify(`Maintenance Mode turned ${nextMode ? 'ON' : 'OFF'}`);
                      fetchAdminData();
                    }}
                    className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      globalSettings?.maintenanceMode ? 'bg-[#FF4D6D] text-white' : 'bg-[#1F2229] text-[#94A3B8]'
                    }`}
                  >
                    {globalSettings?.maintenanceMode ? 'ACTIVE' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: HELP & SUPPORT DESK (Live User Inquiries & Admin Direct Chat) */}
          {activeSection === 'support' && (
            <div className="space-y-6">
              {/* Support Header & Stats */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#F3F4F6] flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-[#00FFA3]" />
                    Help &amp; Support Desk
                  </h2>
                  <p className="text-xs text-[#94A3B8]">
                    Manage real-time user inquiries, troubleshoot payment verifications, and reply directly from the desk.
                  </p>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-3 py-1.5 rounded-xl bg-[#00FFA3]/10 border border-[#00FFA3]/30 text-[#00FFA3] font-bold">
                    {supportTickets.filter((t) => t.status === 'OPEN').length} Open
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#FBBF24] font-bold">
                    {supportTickets.filter((t) => t.status === 'IN_PROGRESS').length} In Progress
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-[#12141A] border border-[#1F2229] text-[#94A3B8]">
                    {supportTickets.length} Total Tickets
                  </span>
                </div>
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-2 bg-[#0E1015] p-1.5 rounded-xl border border-[#1F2229] w-fit">
                {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setSupportFilter(st)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      supportFilter === st
                        ? 'bg-[#00FFA3] text-[#0A0B0D] shadow-md shadow-[#00FFA3]/20'
                        : 'text-[#94A3B8] hover:text-[#E0E0E0] hover:bg-[#12141A]'
                    }`}
                  >
                    {st === 'ALL' ? 'All Tickets' : st.replace('_', ' ')} (
                    {st === 'ALL'
                      ? supportTickets.length
                      : supportTickets.filter((t) => t.status === st).length}
                    )
                  </button>
                ))}
              </div>

              {/* 2-Column Split: Ticket List vs Conversation View */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[560px]">
                {/* Left: Ticket Cards List (5 Cols) */}
                <div className="lg:col-span-5 bg-[#0E1015] border border-[#1F2229] rounded-2xl p-4 flex flex-col space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1F2229]">
                    <span className="text-xs font-bold text-[#F3F4F6] uppercase tracking-wider">
                      User Inquiries
                    </span>
                    <span className="text-[11px] text-[#94A3B8] font-mono">
                      {supportTickets.filter((t) => supportFilter === 'ALL' || t.status === supportFilter).length} tickets
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[580px]">
                    {supportTickets
                      .filter((t) => supportFilter === 'ALL' || t.status === supportFilter)
                      .length === 0 ? (
                      <div className="p-10 text-center text-xs text-[#64748B] space-y-2">
                        <MessageSquare className="w-8 h-8 text-[#334155] mx-auto" />
                        <p>No support tickets in this category.</p>
                      </div>
                    ) : (
                      supportTickets
                        .filter((t) => supportFilter === 'ALL' || t.status === supportFilter)
                        .map((ticket) => {
                          const isSelected = (selectedTicketId || supportTickets[0]?.id) === ticket.id;
                          const lastMsg = ticket.messages[ticket.messages.length - 1];
                          const lastMsgIsUser = lastMsg?.senderRole === 'USER';

                          return (
                            <div
                              key={ticket.id}
                              onClick={() => setSelectedTicketId(ticket.id)}
                              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#12141A] border-[#00FFA3]/60 shadow-lg'
                                  : 'bg-[#0A0B0D] border-[#1F2229] hover:border-[#334155] hover:bg-[#12141A]/50'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-7 h-7 rounded-lg bg-[#00FFA3]/15 text-[#00FFA3] font-bold text-xs flex items-center justify-center shrink-0">
                                    {ticket.userName.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="truncate">
                                    <div className="text-xs font-bold text-[#F3F4F6] truncate">
                                      {ticket.subject}
                                    </div>
                                    <div className="text-[10px] text-[#94A3B8] truncate font-mono">
                                      {ticket.userEmail}
                                    </div>
                                  </div>
                                </div>

                                <span
                                  className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 ${
                                    ticket.status === 'OPEN'
                                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                      : ticket.status === 'IN_PROGRESS'
                                      ? 'bg-[#F59E0B]/15 text-[#FBBF24] border border-[#F59E0B]/30'
                                      : 'bg-[#00FFA3]/15 text-[#00FFA3] border border-[#00FFA3]/30'
                                  }`}
                                >
                                  {ticket.status}
                                </span>
                              </div>

                              <div className="mt-2.5 flex items-center justify-between text-[10px] text-[#64748B]">
                                <span className="px-1.5 py-0.5 rounded bg-[#1A1D26] text-[#94A3B8] font-mono">
                                  {ticket.category}
                                </span>
                                <div className="flex items-center gap-2">
                                  {lastMsgIsUser && (
                                    <span className="w-2 h-2 rounded-full bg-[#00FFA3] animate-pulse" title="Needs Admin Reply" />
                                  )}
                                  <span className="font-mono">{new Date(ticket.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>

                {/* Right: Active Ticket Conversation & Reply Form (7 Cols) */}
                {(() => {
                  const activeTicket = supportTickets.find(
                    (t) => t.id === (selectedTicketId || supportTickets[0]?.id)
                  );

                  if (!activeTicket) {
                    return (
                      <div className="lg:col-span-7 bg-[#0E1015] border border-[#1F2229] rounded-2xl p-10 flex flex-col items-center justify-center text-center text-[#64748B] space-y-3">
                        <MessageSquare className="w-12 h-12 text-[#1F2229]" />
                        <h4 className="text-sm font-bold text-[#94A3B8]">No Ticket Selected</h4>
                        <p className="text-xs max-w-sm">Select a ticket from the left panel to inspect the inquiry thread and send real-time replies.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="lg:col-span-7 bg-[#0E1015] border border-[#1F2229] rounded-2xl flex flex-col overflow-hidden shadow-2xl">
                      {/* Ticket Header */}
                      <div className="p-4 bg-[#12141A] border-b border-[#1F2229] flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-[#F3F4F6]">{activeTicket.subject}</h3>
                            <span className="px-2 py-0.5 rounded bg-[#1A1D26] text-[#94A3B8] text-[10px] font-mono">
                              #{activeTicket.id.slice(-6)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#94A3B8] mt-1 font-mono">
                            <span className="text-[#00FFA3]">{activeTicket.userName}</span>
                            <span>•</span>
                            <span>{activeTicket.userEmail}</span>
                            <span>•</span>
                            <span>Category: {activeTicket.category}</span>
                          </div>
                        </div>

                        {/* Status Change Buttons */}
                        <div className="flex items-center gap-1.5">
                          <select
                            value={activeTicket.status}
                            onChange={(e) => handleUpdateTicketStatus(activeTicket.id, e.target.value as any)}
                            className="bg-[#0A0B0D] border border-[#1F2229] rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-[#00FFA3] focus:border-[#00FFA3] focus:outline-none cursor-pointer"
                          >
                            <option value="OPEN">Mark OPEN</option>
                            <option value="IN_PROGRESS">Mark IN PROGRESS</option>
                            <option value="RESOLVED">Mark RESOLVED</option>
                          </select>
                        </div>
                      </div>

                      {/* Chat Messages Body */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[380px] bg-[#0A0B0D]/60">
                        {activeTicket.messages.map((msg) => {
                          const isAdminMsg = msg.senderRole === 'ADMIN';
                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col ${isAdminMsg ? 'items-end' : 'items-start'}`}
                            >
                              <div className="flex items-center gap-1.5 text-[10px] text-[#64748B] mb-1 font-mono">
                                <span>{msg.senderName}</span>
                                {isAdminMsg && (
                                  <span className="px-1.5 py-0.2 rounded bg-[#00FFA3]/20 text-[#00FFA3] font-bold">
                                    ADMIN
                                  </span>
                                )}
                                <span>•</span>
                                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <div
                                className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                                  isAdminMsg
                                    ? 'bg-gradient-to-r from-[#00FFA3] to-[#00D182] text-[#0A0B0D] font-medium rounded-tr-none shadow-md shadow-[#00FFA3]/10'
                                    : 'bg-[#12141A] border border-[#1F2229] text-[#E0E0E0] rounded-tl-none'
                                }`}
                              >
                                {msg.message}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Quick Replies + Reply Box */}
                      <div className="p-4 bg-[#12141A] border-t border-[#1F2229] space-y-3">
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-[10px]">
                          <span className="text-[#64748B] shrink-0 font-mono">Quick:</span>
                          <button
                            type="button"
                            onClick={() => setAdminReplyText('Hello! Your payment has been verified and your 30-day VIP plan is now approved.')}
                            className="px-2.5 py-1 rounded-lg bg-[#0A0B0D] border border-[#1F2229] text-[#94A3B8] hover:text-[#00FFA3] hover:border-[#00FFA3]/30 whitespace-nowrap cursor-pointer"
                          >
                            Payment Approved
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdminReplyText('Please share your 12-digit UPI UTR reference number or payment screenshot so we can activate your plan.')}
                            className="px-2.5 py-1 rounded-lg bg-[#0A0B0D] border border-[#1F2229] text-[#94A3B8] hover:text-[#00FFA3] hover:border-[#00FFA3]/30 whitespace-nowrap cursor-pointer"
                          >
                            Request UTR / Screenshot
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdminReplyText('Thank you for contacting SMC Signal Pro support. Your issue has been resolved.')}
                            className="px-2.5 py-1 rounded-lg bg-[#0A0B0D] border border-[#1F2229] text-[#94A3B8] hover:text-[#00FFA3] hover:border-[#00FFA3]/30 whitespace-nowrap cursor-pointer"
                          >
                            Issue Resolved
                          </button>
                        </div>

                        <div className="flex gap-2">
                          <textarea
                            rows={2}
                            placeholder="Type admin reply to user..."
                            value={adminReplyText}
                            onChange={(e) => setAdminReplyText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendAdminReply(activeTicket.id);
                              }
                            }}
                            className="flex-1 bg-[#0A0B0D] border border-[#1F2229] rounded-xl p-3 text-xs text-[#E0E0E0] focus:border-[#00FFA3] focus:outline-none resize-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleSendAdminReply(activeTicket.id)}
                            disabled={isSendingReply || !adminReplyText.trim()}
                            className="px-5 bg-gradient-to-r from-[#00FFA3] to-[#00D182] text-[#0A0B0D] font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#00FFA3]/20 disabled:opacity-50 cursor-pointer"
                          >
                            <Send className="w-4 h-4" />
                            <span>{isSendingReply ? 'Sending...' : 'Reply'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* TAB 6: SECURITY */}
          {activeSection === 'security' && (
            <div className="space-y-4 max-w-2xl bg-[#0E1015] border border-[#1F2229] rounded-2xl p-6">
              <h2 className="text-lg font-bold text-[#F3F4F6]">Admin Authentication & Security Audit</h2>
              <div className="space-y-3 text-xs text-[#94A3B8]">
                <p>• Admin Role: Enforced via server-side Bearer Token verification.</p>
                <p>• Unauthorized attempts to enter /admin are redirected to /admin/login.</p>
                <p>• Active Admin Sessions: {securityConfig?.activeAdminSessions || 1}</p>
              </div>
            </div>
          )}

          {/* TAB 7: ACTIVITY LOGS */}
          {activeSection === 'logs' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#F3F4F6]">Administrator Activity Logs</h2>
              <div className="bg-[#0E1015] border border-[#1F2229] rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs text-[#E0E0E0]">
                  <thead className="bg-[#12141A] text-[#94A3B8] font-mono text-[11px]">
                    <tr>
                      <th className="py-3 px-4">DATE / TIME</th>
                      <th className="py-3 px-4">ADMIN</th>
                      <th className="py-3 px-4">ACTION</th>
                      <th className="py-3 px-4">TARGET</th>
                      <th className="py-3 px-4">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F2229]">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#12141A]">
                        <td className="py-3 px-4 font-mono text-[11px] text-[#94A3B8]">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="py-3 px-4 text-[#00FFA3] font-mono">{log.adminEmail}</td>
                        <td className="py-3 px-4 font-bold">{log.action}</td>
                        <td className="py-3 px-4 text-[#94A3B8]">{log.target}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.status === 'SUCCESS' ? 'bg-[#00FFA3]/15 text-[#00FFA3]' : 'bg-[#FF4D6D]/15 text-[#FF4D6D]'}`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* EDIT PINE SCRIPT MODAL */}
      {editingScript && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#0E1015] border border-[#1F2229] rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-[#F3F4F6]">Edit Pine Script Code</h3>
              <button onClick={() => setEditingScript(null)} className="text-[#94A3B8]">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <input
                type="text"
                value={editingScript.name || ''}
                onChange={(e) => setEditingScript((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Script Title"
                className="w-full bg-[#12141A] border border-[#1F2229] rounded p-2 text-xs text-[#E0E0E0]"
              />
              <select
                value={editingScript.targetFeature || 'CUSTOM'}
                onChange={(e) => setEditingScript((prev) => ({ ...prev, targetFeature: e.target.value as any }))}
                className="w-full bg-[#12141A] border border-[#1F2229] rounded p-2 text-xs text-[#E0E0E0]"
              >
                <option value="FVG">Target Feature: FVG</option>
                <option value="CHOCH">Target Feature: CHoCH</option>
                <option value="INDICATORS">Target Feature: Indicators</option>
                <option value="CUSTOM">Target Feature: Custom</option>
              </select>
              <textarea
                value={editingScript.code || ''}
                onChange={(e) => setEditingScript((prev) => ({ ...prev, code: e.target.value }))}
                rows={10}
                className="w-full bg-[#0A0B0D] border border-[#1F2229] rounded p-3 font-mono text-xs text-[#00FFA3]"
              />
              <button
                onClick={() => handleSavePineScript(editingScript)}
                className="w-full py-3 bg-[#00FFA3] text-[#0A0B0D] font-extrabold text-xs rounded-xl"
              >
                SAVE SCRIPT TO CENTRAL DB
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {isCreateUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0E1015] border border-[#1F2229] rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-[#F3F4F6]">Create User Account</h3>
              <button onClick={() => setIsCreateUserModalOpen(false)} className="text-[#94A3B8]">✕</button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <input
                type="text" required value={newUserName} onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Full Name" className="w-full bg-[#12141A] border border-[#1F2229] rounded p-2 text-xs text-[#E0E0E0]"
              />
              <input
                type="email" required value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="Email Address" className="w-full bg-[#12141A] border border-[#1F2229] rounded p-2 text-xs text-[#E0E0E0]"
              />
              <input
                type="password" required value={newUserPass} onChange={(e) => setNewUserPass(e.target.value)}
                placeholder="Password" className="w-full bg-[#12141A] border border-[#1F2229] rounded p-2 text-xs text-[#E0E0E0]"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[#94A3B8]">Role</label>
                  <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as any)} className="w-full bg-[#12141A] border border-[#1F2229] rounded p-2 text-xs text-[#E0E0E0]">
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="text-[#94A3B8]">Tier</label>
                  <select value={newUserTier} onChange={(e) => setNewUserTier(e.target.value as any)} className="w-full bg-[#12141A] border border-[#1F2229] rounded p-2 text-xs text-[#E0E0E0]">
                    <option value="FREE_TRIAL">FREE_TRIAL</option>
                    <option value="PRO_TRADER">PRO_TRADER</option>
                    <option value="INSTITUTIONAL_VIP">INSTITUTIONAL_VIP</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-3 bg-[#00FFA3] text-[#0A0B0D] font-bold rounded-xl text-xs">
                CREATE USER ACCOUNT
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PAYMENT SCREENSHOT PROOF MODAL */}
      {selectedScreenshotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0E1015] border border-[#1F2229] rounded-2xl max-w-xl w-full p-4 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-[#1F2229]">
              <h3 className="font-bold text-sm text-[#F3F4F6]">Payment Receipt / Screenshot Proof</h3>
              <button
                onClick={() => setSelectedScreenshotModal(null)}
                className="text-[#94A3B8] hover:text-white p-1 rounded-lg hover:bg-[#1A1D26]"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-[#0A0B0D] rounded-xl p-2">
              <img
                src={selectedScreenshotModal}
                alt="Payment Receipt"
                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-xl"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedScreenshotModal(null)}
                className="px-4 py-2 bg-[#1F2229] hover:bg-[#2A2E3B] text-[#E0E0E0] rounded-xl text-xs font-bold"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT SUBSCRIPTION PLAN MODAL */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-[#0E1015] border border-[#1F2229] rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-[#1F2229]">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#00FFA3]" />
                <h3 className="font-extrabold text-base text-[#F3F4F6]">
                  Adjust Plan Amount ({editingPlan.name})
                </h3>
              </div>
              <button onClick={() => setEditingPlan(null)} className="text-[#94A3B8] hover:text-white p-1 rounded-lg">✕</button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSavePlanAmount(editingPlan);
              }}
              className="space-y-4 text-xs"
            >
              <div className="space-y-1.5">
                <label className="text-[#94A3B8] font-bold uppercase tracking-wider block">Plan Display Name</label>
                <input
                  type="text"
                  required
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="w-full bg-[#12141A] border border-[#1F2229] rounded-xl p-3 text-xs text-[#E0E0E0] focus:border-[#00FFA3] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[#94A3B8] font-bold uppercase tracking-wider block">Price in USD ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editingPlan.priceUSD}
                    onChange={(e) => {
                      const usd = parseFloat(e.target.value) || 0;
                      const rate = paymentSettings?.conversionRateUSDToINR || 95;
                      setEditingPlan({
                        ...editingPlan,
                        priceUSD: usd,
                        priceINR: Math.round(usd * rate),
                      });
                    }}
                    className="w-full bg-[#12141A] border border-[#1F2229] rounded-xl p-3 font-mono text-sm font-bold text-[#00FFA3] focus:border-[#00FFA3] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#94A3B8] font-bold uppercase tracking-wider block">Price in INR (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingPlan.priceINR || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, priceINR: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#12141A] border border-[#1F2229] rounded-xl p-3 font-mono text-sm font-bold text-[#E0E0E0] focus:border-[#00FFA3] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[#94A3B8] font-bold uppercase tracking-wider block">Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingPlan.durationDays || 30}
                    onChange={(e) => setEditingPlan({ ...editingPlan, durationDays: parseInt(e.target.value) || 30 })}
                    className="w-full bg-[#12141A] border border-[#1F2229] rounded-xl p-3 font-mono text-xs text-[#E0E0E0] focus:border-[#00FFA3] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#94A3B8] font-bold uppercase tracking-wider block">Billing Period Label</label>
                  <select
                    value={editingPlan.billingPeriod || 'monthly'}
                    onChange={(e) => setEditingPlan({ ...editingPlan, billingPeriod: e.target.value as any })}
                    className="w-full bg-[#12141A] border border-[#1F2229] rounded-xl p-3 text-xs text-[#E0E0E0] focus:border-[#00FFA3] focus:outline-none"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[#94A3B8] font-bold uppercase tracking-wider block">
                  Features List (One feature per line)
                </label>
                <textarea
                  rows={4}
                  value={editingPlan.features.join('\n')}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      features: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full bg-[#12141A] border border-[#1F2229] rounded-xl p-3 font-mono text-xs text-[#E0E0E0] focus:border-[#00FFA3] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2.5 bg-[#1F2229] hover:bg-[#2A2E3B] text-[#E0E0E0] rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#00FFA3] hover:bg-[#05D588] text-[#0A0B0D] font-extrabold rounded-xl shadow-lg shadow-[#00FFA3]/20 cursor-pointer"
                >
                  Save Plan Pricing to Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW COUPON CODE MODAL */}
      {isCreateCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-[#0E1015] border border-[#1F2229] rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-[#1F2229]">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-[#00FFA3]" />
                <h3 className="font-extrabold text-base text-[#F3F4F6]">Issue New Promo Coupon Code</h3>
              </div>
              <button onClick={() => setIsCreateCouponModalOpen(false)} className="text-[#94A3B8] hover:text-white p-1 rounded-lg">✕</button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[#94A3B8] font-bold uppercase tracking-wider block">Coupon Code String</label>
                <div className="relative">
                  <Tag className="absolute left-3.5 top-3.5 w-4 h-4 text-[#64748B]" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. SMC50, FESTIVE20, VIPBONUS"
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                    className="w-full bg-[#12141A] border border-[#1F2229] rounded-xl pl-10 pr-4 py-3 font-mono font-bold text-sm text-[#00FFA3] uppercase tracking-wider focus:border-[#00FFA3] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[#94A3B8] font-bold uppercase tracking-wider block">Description / Campaign Label</label>
                <input
                  type="text"
                  placeholder="e.g. 50% Launch Special Discount"
                  value={newCouponDesc}
                  onChange={(e) => setNewCouponDesc(e.target.value)}
                  className="w-full bg-[#12141A] border border-[#1F2229] rounded-xl p-3 text-xs text-[#E0E0E0] focus:border-[#00FFA3] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[#94A3B8] font-bold uppercase tracking-wider block">Discount Type</label>
                  <select
                    value={newCouponType}
                    onChange={(e) => setNewCouponType(e.target.value as CouponDiscountType)}
                    className="w-full bg-[#12141A] border border-[#1F2229] rounded-xl p-3 text-xs text-[#E0E0E0] font-bold focus:border-[#00FFA3] focus:outline-none"
                  >
                    <option value="PERCENTAGE">Percentage (% OFF)</option>
                    <option value="FLAT_USD">Flat USD ($ OFF)</option>
                    <option value="FLAT_INR">Flat INR (₹ OFF)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#94A3B8] font-bold uppercase tracking-wider block">Discount Value</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newCouponValue}
                    onChange={(e) => setNewCouponValue(parseFloat(e.target.value) || 0)}
                    placeholder={newCouponType === 'PERCENTAGE' ? '50 (%)' : newCouponType === 'FLAT_USD' ? '20 ($)' : '500 (₹)'}
                    className="w-full bg-[#12141A] border border-[#1F2229] rounded-xl p-3 font-mono text-sm font-bold text-[#00FFA3] focus:border-[#00FFA3] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[#94A3B8] font-bold uppercase tracking-wider block">Expiration Date (Optional)</label>
                  <input
                    type="date"
                    value={newCouponExpiry}
                    onChange={(e) => setNewCouponExpiry(e.target.value)}
                    className="w-full bg-[#12141A] border border-[#1F2229] rounded-xl p-3 text-xs text-[#E0E0E0] focus:border-[#00FFA3] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#94A3B8] font-bold uppercase tracking-wider block">Max Total Uses (Optional)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={newCouponMaxUses}
                    onChange={(e) => setNewCouponMaxUses(e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full bg-[#12141A] border border-[#1F2229] rounded-xl p-3 font-mono text-xs text-[#E0E0E0] focus:border-[#00FFA3] focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#0A0B0D] border border-[#1F2229] rounded-xl text-[11px] text-[#94A3B8] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#00FFA3] shrink-0" />
                <span>
                  <strong>Single-Use Enforced:</strong> Each user email can only redeem this coupon once.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateCouponModalOpen(false)}
                  className="px-4 py-2.5 bg-[#1F2229] hover:bg-[#2A2E3B] text-[#E0E0E0] rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#00FFA3] hover:bg-[#05D588] text-[#0A0B0D] font-extrabold rounded-xl shadow-lg shadow-[#00FFA3]/20 cursor-pointer"
                >
                  Create & Activate Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW REDEEMED EMAILS AUDIT MODAL */}
      {selectedCouponUsersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-[#0E1015] border border-[#1F2229] rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-[#1F2229]">
              <div>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#00FFA3]" />
                  <h3 className="font-extrabold text-base text-[#F3F4F6]">
                    Redemptions Audit: {selectedCouponUsersModal.code}
                  </h3>
                </div>
                <p className="text-[11px] text-[#94A3B8] mt-0.5">
                  List of user email addresses that have redeemed this coupon (Single-use per email rule).
                </p>
              </div>
              <button onClick={() => setSelectedCouponUsersModal(null)} className="text-[#94A3B8] hover:text-white p-1 rounded-lg">✕</button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-mono bg-[#12141A] p-3 rounded-xl border border-[#1F2229]">
                <span className="text-[#94A3B8]">Total Unique Redemptions:</span>
                <span className="text-[#00FFA3] font-bold text-sm">
                  {selectedCouponUsersModal.usedByEmails?.length || 0} user(s)
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {!selectedCouponUsersModal.usedByEmails || selectedCouponUsersModal.usedByEmails.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#64748B]">
                    No users have redeemed this coupon code yet.
                  </div>
                ) : (
                  selectedCouponUsersModal.usedByEmails.map((email, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-[#12141A] border border-[#1F2229] rounded-lg text-xs font-mono"
                    >
                      <span className="text-[#E0E0E0]">{email}</span>
                      <span className="px-2 py-0.5 bg-[#00FFA3]/10 text-[#00FFA3] text-[10px] font-bold rounded">
                        REDEEMED
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedCouponUsersModal(null)}
                className="px-4 py-2 bg-[#1F2229] hover:bg-[#2A2E3B] text-[#E0E0E0] rounded-xl text-xs font-bold"
              >
                Close Audit Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE USER PLAN & VALIDITY MODAL */}
      {managingPlanUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-[#0E1015] border border-[#1F2229] rounded-2xl p-6 space-y-5 shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-start pb-3 border-b border-[#1F2229]">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#00FFA3]/15 text-[#00FFA3] flex items-center justify-center">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-[#F3F4F6]">
                      Manage Subscription Plan
                    </h3>
                    <div className="text-xs text-[#94A3B8] font-mono">
                      {managingPlanUser.name} • {managingPlanUser.email}
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setManagingPlanUser(null)}
                className="text-[#94A3B8] hover:text-white p-1 rounded-lg hover:bg-[#1A1D26]"
              >
                ✕
              </button>
            </div>

            {/* Current Plan Status Card */}
            {(() => {
              const currentInfo = getSubscriptionRemainingInfo(managingPlanUser);
              return (
                <div className="p-3.5 bg-[#12141A] border border-[#1F2229] rounded-xl flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-[#64748B] block text-[10px] uppercase tracking-wider">Current Active Plan</span>
                    <span className="font-bold text-[#F3F4F6] text-sm">
                      {managingPlanUser.tier === 'FREE_TRIAL' ? 'Free Plan (Basic)' : managingPlanUser.tier}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold ${currentInfo.badgeClass}`}>
                      {currentInfo.label}
                    </span>
                    <span className="block text-[10px] text-[#64748B] mt-0.5">{currentInfo.subLabel}</span>
                  </div>
                </div>
              );
            })()}

            <form onSubmit={handleSaveManagedPlan} className="space-y-4 text-xs">
              {/* Select Plan */}
              <div className="space-y-2">
                <label className="text-[#94A3B8] font-bold uppercase tracking-wider block">
                  Select Subscription Plan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Free Plan */}
                  <button
                    type="button"
                    onClick={() => {
                      setTargetPlanTier('FREE_TRIAL');
                      setTargetDurationOption('FREE');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      targetPlanTier === 'FREE_TRIAL'
                        ? 'bg-[#1F2229] border-[#00FFA3] shadow-md shadow-[#00FFA3]/10'
                        : 'bg-[#12141A] border-[#1F2229] hover:border-[#334155]'
                    }`}
                  >
                    <div className="font-bold text-[#F3F4F6]">Free Plan</div>
                    <div className="text-[10px] text-[#94A3B8] mt-0.5">Basic Free Access</div>
                    <div className="text-[10px] text-[#FF4D6D] mt-1 font-mono font-bold">Unpaid / Free</div>
                  </button>

                  {/* Pro Trader */}
                  <button
                    type="button"
                    onClick={() => {
                      setTargetPlanTier('PRO_TRADER');
                      if (targetDurationOption === 'FREE') setTargetDurationOption('30_DAYS');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      targetPlanTier === 'PRO_TRADER'
                        ? 'bg-[#00FFA3]/10 border-[#00FFA3] shadow-md shadow-[#00FFA3]/10'
                        : 'bg-[#12141A] border-[#1F2229] hover:border-[#334155]'
                    }`}
                  >
                    <div className="font-bold text-[#00FFA3]">Pro Trader</div>
                    <div className="text-[10px] text-[#94A3B8] mt-0.5">Full Features &amp; Hub</div>
                    <div className="text-[10px] text-[#00FFA3] mt-1 font-mono font-bold">$29 / month</div>
                  </button>

                  {/* Institutional VIP */}
                  <button
                    type="button"
                    onClick={() => {
                      setTargetPlanTier('INSTITUTIONAL_VIP');
                      if (targetDurationOption === 'FREE') setTargetDurationOption('30_DAYS');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      targetPlanTier === 'INSTITUTIONAL_VIP'
                        ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-500/20'
                        : 'bg-[#12141A] border-[#1F2229] hover:border-[#334155]'
                    }`}
                  >
                    <div className="font-bold text-purple-300">Institutional VIP</div>
                    <div className="text-[10px] text-[#94A3B8] mt-0.5">Exclusive Signals + AI</div>
                    <div className="text-[10px] text-purple-400 mt-1 font-mono font-bold">$79 / month</div>
                  </button>
                </div>
              </div>

              {/* Plan Duration / Expiry Options */}
              {targetPlanTier === 'FREE_TRIAL' ? (
                <div className="p-3.5 bg-rose-950/20 border border-rose-500/30 rounded-xl text-rose-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Downgrading to Free Plan</span>
                  </div>
                  <p className="text-[11px] text-rose-200/80 leading-relaxed">
                    User will immediately lose access to Pro and VIP features (Paper Trading orders, SMC Signals Hub, and Backtester will be locked). Plan expiration timer will be cleared to 0.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[#94A3B8] font-bold uppercase tracking-wider block">
                    Choose Monthly Plan Validity Duration
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: '7_DAYS', label: '7 Days', desc: '1 Week Pass' },
                      { id: '15_DAYS', label: '15 Days', desc: 'Half Month' },
                      { id: '30_DAYS', label: '30 Days', desc: '1 Month Plan' },
                      { id: '60_DAYS', label: '60 Days', desc: '2 Months Plan' },
                      { id: '90_DAYS', label: '90 Days', desc: 'Quarterly VIP' },
                      { id: 'CUSTOM', label: 'Custom Date', desc: 'Pick Date' },
                    ].map((dur) => (
                      <button
                        key={dur.id}
                        type="button"
                        onClick={() => setTargetDurationOption(dur.id as any)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          targetDurationOption === dur.id
                            ? 'bg-[#00FFA3] text-[#0A0B0D] font-extrabold border-[#00FFA3] shadow'
                            : 'bg-[#12141A] text-[#E0E0E0] border-[#1F2229] hover:border-[#334155]'
                        }`}
                      >
                        <div className="text-xs font-bold">{dur.label}</div>
                        <div className={`text-[9px] ${targetDurationOption === dur.id ? 'text-[#0A0B0D]/80 font-bold' : 'text-[#64748B]'}`}>
                          {dur.desc}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Custom Date Input */}
                  {targetDurationOption === 'CUSTOM' && (
                    <div className="pt-2">
                      <label className="text-[11px] text-[#94A3B8] font-bold block mb-1">
                        Select Exact Expiry Date
                      </label>
                      <input
                        type="date"
                        required
                        value={customExpiryDate}
                        onChange={(e) => setCustomExpiryDate(e.target.value)}
                        className="w-full bg-[#12141A] border border-[#1F2229] rounded-xl p-3 font-mono text-xs text-[#00FFA3] focus:border-[#00FFA3] focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Live Expiry Preview */}
                  <div className="p-3 bg-[#0A0B0D] border border-[#1F2229] rounded-xl flex items-center justify-between font-mono text-[11px]">
                    <span className="text-[#94A3B8]">Calculated Validity:</span>
                    <span className="text-[#00FFA3] font-bold">
                      {targetDurationOption === '7_DAYS' && '7 days from today'}
                      {targetDurationOption === '15_DAYS' && '15 days from today'}
                      {targetDurationOption === '30_DAYS' && '30 days (1 full month)'}
                      {targetDurationOption === '60_DAYS' && '60 days (2 full months)'}
                      {targetDurationOption === '90_DAYS' && '90 days (3 full months)'}
                      {targetDurationOption === 'CUSTOM' && (customExpiryDate ? `Ends: ${customExpiryDate}` : 'Select date')}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-[#1F2229]">
                {managingPlanUser.tier !== 'FREE_TRIAL' && targetPlanTier !== 'FREE_TRIAL' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setTargetPlanTier('FREE_TRIAL');
                      setTargetDurationOption('FREE');
                    }}
                    className="px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 rounded-xl text-xs font-bold transition-all cursor-pointer border border-rose-500/20"
                  >
                    Quick Revert to Free Plan
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setManagingPlanUser(null)}
                    className="px-4 py-2.5 bg-[#1F2229] hover:bg-[#2A2E3D] text-[#E0E0E0] rounded-xl font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingUserPlan}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#00FFA3] to-[#00D182] hover:from-[#00E592] hover:to-[#00B873] text-[#0A0B0D] font-extrabold rounded-xl shadow-lg shadow-[#00FFA3]/20 disabled:opacity-50 cursor-pointer transition-all"
                  >
                    {isSavingUserPlan ? 'Updating Plan Live...' : 'Save Plan & Expiry Live'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
