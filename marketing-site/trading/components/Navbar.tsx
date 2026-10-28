import React, { useState, useEffect } from 'react';
import { ForexPair, TimeFrame, TrialInfo, PushAlert, PairTickerInfo, User, GlobalAppSettings } from '../types';
import { PAIR_METADATA } from '../utils/forexData';
import { ConnectionStatus } from '../utils/MarketDataManager';
import { useResponsiveDisplay } from '../utils/useResponsiveDisplay';
import { evaluateUserAccess } from '../utils/accessControl';
import {
  Zap,
  Activity,
  BarChart3,
  Calendar,
  Users,
  Bell,
  Sparkles,
  Crown,
  Layers,
  Lock,
  TrendingUp,
  TrendingDown,
  LogIn,
  LogOut,
  Shield,
  User as UserIcon,
  Menu,
  X,
  ChevronRight,
  Smartphone,
  HelpCircle,
  Gift,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'CHART' | 'PAPER' | 'BACKTEST' | 'NEWS' | 'SOCIAL' | 'SIGNALS' | 'PROFILE';
  onSelectTab: (tab: 'CHART' | 'PAPER' | 'BACKTEST' | 'NEWS' | 'SOCIAL' | 'SIGNALS' | 'PROFILE') => void;
  selectedPair: ForexPair;
  onSelectPair: (pair: ForexPair) => void;
  pairPrices: Record<ForexPair, number>;
  pairTickers?: Record<ForexPair, PairTickerInfo>;
  trialInfo: TrialInfo | null;
  currentUser: User | null;
  globalSettings?: GlobalAppSettings | null;
  onOpenUpgradeModal: () => void;
  onToggleNotificationsDrawer: () => void;
  unreadAlertCount: number;
  onOpenAuthModal: () => void;
  onOpenAdminPanel: () => void;
  onLogout: () => void;
  onOpenHelp?: () => void;
  feedStatus?: ConnectionStatus;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  selectedPair,
  onSelectPair,
  pairPrices,
  pairTickers,
  trialInfo,
  currentUser,
  globalSettings,
  onOpenUpgradeModal,
  onToggleNotificationsDrawer,
  unreadAlertCount,
  onOpenAuthModal,
  onOpenAdminPanel,
  onLogout,
  onOpenHelp,
  feedStatus = 'CONNECTED',
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { isMobile, isSmallMobile, isTablet, isDesktop, width, isNative } = useResponsiveDisplay();

  const pairs: ForexPair[] = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'BTCUSD', 'US30'];
  const access = evaluateUserAccess(currentUser, trialInfo, globalSettings || null);
  const userTier = access.effectiveTier;
  const isPaidUser = access.isPaidUser;
  const isAdmin = currentUser?.role === 'ADMIN';

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  const handleTabClick = (tab: 'CHART' | 'PAPER' | 'BACKTEST' | 'NEWS' | 'SOCIAL' | 'SIGNALS' | 'PROFILE') => {
    onSelectTab(tab);
    setIsDrawerOpen(false);
  };

  const navMenuItems = [
    {
      id: 'CHART',
      label: 'Dashboard / Live Chart',
      shortLabel: 'Chart',
      icon: Activity,
      tab: 'CHART' as const,
      badge: 'LIVE',
    },
    {
      id: 'SIGNALS',
      label: 'Live SMC Signals',
      shortLabel: 'Signals',
      icon: Zap,
      tab: 'SIGNALS' as const,
      badge: 'VIP',
    },
    {
      id: 'PAPER',
      label: 'Paper Trading Desk',
      shortLabel: 'Trade',
      icon: Layers,
      tab: 'PAPER' as const,
      badge: 'PRO',
    },
    {
      id: 'BACKTEST',
      label: 'Quantitative Backtester',
      shortLabel: 'Backtest',
      icon: BarChart3,
      tab: 'BACKTEST' as const,
      badge: 'PRO',
    },
    {
      id: 'NEWS',
      label: 'Forex Factory News',
      shortLabel: 'News',
      icon: Calendar,
      tab: 'NEWS' as const,
      badge: 'FREE',
    },
    {
      id: 'SOCIAL',
      label: 'Social Copy Traders',
      shortLabel: 'Social',
      icon: Users,
      tab: 'SOCIAL' as const,
      badge: 'FREE',
    },
    {
      id: 'PROFILE',
      label: 'Trader Profile & Account',
      shortLabel: 'Profile',
      icon: UserIcon,
      tab: 'PROFILE' as const,
      badge: currentUser ? 'ACTIVE' : undefined,
    },
  ];

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER (Dynamically adapted from detected mobile display)
      ───────────────────────────────────────────────────────────── */}
      <header className="bg-[#0E1015] border-b border-[#1F2229] select-none sticky top-0 z-30 shadow-xl w-full max-w-full overflow-x-hidden pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-[1920px] mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 w-full">
          
          {/* Mobile Display Detected: Hamburger Button */}
          {isMobile && (
            <div className="flex items-center gap-2">
              <button
                id="mobile-drawer-toggle-btn"
                onClick={() => setIsDrawerOpen(true)}
                aria-label="Open Navigation Drawer"
                className="p-2 rounded-xl bg-[#12141A] border border-[#1F2229] text-[#94A3B8] hover:text-[#00FFA3] hover:border-[#00FFA3]/40 active:scale-95 transition-all flex items-center justify-center tap-target"
              >
                <Menu className="w-5 h-5 text-[#E0E0E0]" />
              </button>
            </div>
          )}

          {/* App Logo & Name */}
          <div
            onClick={() => onSelectTab('CHART')}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-[#00FFA3] via-[#05D588] to-[#00C278] flex items-center justify-center text-[#0A0B0D] font-black shadow-lg shadow-[#00FFA3]/10 border border-[#00FFA3]/40 shrink-0">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-[#0A0B0D] text-[#0A0B0D]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base tracking-wider text-[#F3F4F6]">
                  SMC SIGNAL
                </span>
                <span className="text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded bg-[#00FFA3]/15 text-[#00FFA3] border border-[#00FFA3]/30 font-bold uppercase tracking-wider">
                  PRO
                </span>
              </div>
              {isDesktop && (
                <p className="text-[9px] sm:text-[10px] text-[#94A3B8] font-mono leading-none mt-0.5">
                  Smart Money Quantitative Engine
                </p>
              )}
            </div>
          </div>

          {/* Navigation Tabs (Rendered on tablet and desktop display >= 768px) */}
          {(isDesktop || isTablet) && (
            <nav className="flex items-center bg-[#12141A] rounded-xl p-1 border border-[#1F2229] text-xs font-medium shrink-0">
              <button
                id="nav-tab-chart"
                onClick={() => onSelectTab('CHART')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0 transition-all ${
                  activeTab === 'CHART'
                    ? 'bg-[#00FFA3] text-[#0A0B0D] font-bold shadow-md shadow-[#00FFA3]/20'
                    : 'text-[#94A3B8] hover:text-[#E0E0E0]'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Live Chart</span>
              </button>

              <button
                id="nav-tab-paper"
                onClick={() => onSelectTab('PAPER')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0 transition-all ${
                  activeTab === 'PAPER'
                    ? 'bg-[#00FFA3] text-[#0A0B0D] font-bold shadow-md shadow-[#00FFA3]/20'
                    : 'text-[#94A3B8] hover:text-[#E0E0E0]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Paper Trading</span>
              </button>

              <button
                id="nav-tab-signals"
                onClick={() => onSelectTab('SIGNALS')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0 transition-all ${
                  activeTab === 'SIGNALS'
                    ? 'bg-[#00FFA3] text-[#0A0B0D] font-bold shadow-md shadow-[#00FFA3]/20'
                    : 'text-[#94A3B8] hover:text-[#E0E0E0]'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>SMC Signals</span>
              </button>

              <button
                id="nav-tab-backtest"
                onClick={() => onSelectTab('BACKTEST')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0 transition-all ${
                  activeTab === 'BACKTEST'
                    ? 'bg-[#00FFA3] text-[#0A0B0D] font-bold shadow-md shadow-[#00FFA3]/20'
                    : 'text-[#94A3B8] hover:text-[#E0E0E0]'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Backtester</span>
              </button>

              <button
                id="nav-tab-news"
                onClick={() => onSelectTab('NEWS')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0 transition-all ${
                  activeTab === 'NEWS'
                    ? 'bg-[#00FFA3] text-[#0A0B0D] font-bold shadow-md shadow-[#00FFA3]/20'
                    : 'text-[#94A3B8] hover:text-[#E0E0E0]'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Forex Factory</span>
              </button>

              <button
                id="nav-tab-social"
                onClick={() => onSelectTab('SOCIAL')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0 transition-all ${
                  activeTab === 'SOCIAL'
                    ? 'bg-[#00FFA3] text-[#0A0B0D] font-bold shadow-md shadow-[#00FFA3]/20'
                    : 'text-[#94A3B8] hover:text-[#E0E0E0]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Social</span>
              </button>

              <button
                id="nav-tab-profile"
                onClick={() => onSelectTab('PROFILE')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0 transition-all ${
                  activeTab === 'PROFILE'
                    ? 'bg-[#00FFA3] text-[#0A0B0D] font-bold shadow-md shadow-[#00FFA3]/20'
                    : 'text-[#94A3B8] hover:text-[#E0E0E0]'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Profile</span>
              </button>
            </nav>
          )}

          {/* Right Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Upgrade Button or Free Access Badge */}
            {access.isEligibleForGlobalFree ? (
              <div
                className="px-2.5 sm:px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 bg-[#00FFA3]/15 text-[#00FFA3] border border-[#00FFA3]/50 shadow-md shadow-[#00FFA3]/10"
                title="Global Free Access Enabled by Administration"
              >
                <Gift className="w-3.5 h-3.5 text-[#00FFA3]" />
                <span>{isDesktop ? 'Free VIP Active' : 'FREE VIP'}</span>
              </div>
            ) : (
              <button
                onClick={onOpenUpgradeModal}
                className={`px-2.5 sm:px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg ${
                  isPaidUser
                    ? 'bg-[#1A1D26] text-[#00FFA3] border border-[#00FFA3]/40 hover:bg-[#222736]'
                    : 'bg-[#00FFA3] hover:bg-[#05D588] text-[#0A0B0D] shadow-[#00FFA3]/20'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>{isPaidUser ? (isDesktop ? 'Plan Active' : 'VIP') : (isDesktop ? 'Upgrade VIP' : 'PRO')}</span>
              </button>
            )}

            {/* Notifications Bell */}
            <button
              onClick={onToggleNotificationsDrawer}
              aria-label="View Alerts"
              className="relative p-2 bg-[#12141A] hover:bg-[#1A1D26] rounded-xl border border-[#1F2229] text-[#94A3B8] hover:text-[#E0E0E0] transition-all cursor-pointer tap-target flex items-center justify-center"
              title="Real-Time Alerts"
            >
              <Bell className="w-4 h-4 text-[#94A3B8]" />
              {unreadAlertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {unreadAlertCount}
                </span>
              )}
            </button>

            {/* User Profile / Auth Button */}
            {!currentUser ? (
              <button
                id="header-login-btn"
                onClick={onOpenAuthModal}
                className="px-2.5 sm:px-3.5 py-1.5 bg-[#12141A] hover:bg-[#1A1D26] text-[#00FFA3] border border-[#00FFA3]/40 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer tap-target"
              >
                <LogIn className="w-4 h-4 text-[#00FFA3]" />
                {isDesktop && <span>Log In</span>}
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                {isAdmin && (
                  <button
                    id="header-admin-btn"
                    onClick={() => {
                      window.location.hash = '#admin';
                    }}
                    className="px-2.5 sm:px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/40 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-rose-500/10 tap-target"
                    title="Open Administrator Control Portal"
                  >
                    <Shield className="w-3.5 h-3.5 text-rose-400" />
                    <span>Admin</span>
                  </button>
                )}
                <button
                  id="header-profile-btn"
                  onClick={() => onSelectTab('PROFILE')}
                  className="px-2 sm:px-3 py-1.5 bg-[#12141A] hover:bg-[#1A1D26] text-[#F3F4F6] border border-[#1F2229] font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer tap-target"
                  title={currentUser.email}
                >
                  <div className="w-5 h-5 rounded-full bg-[#00FFA3]/20 border border-[#00FFA3]/40 flex items-center justify-center text-[10px] text-[#00FFA3] font-bold shrink-0">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  {isDesktop && (
                    <span className="max-w-[90px] truncate">{currentUser.name || currentUser.email}</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Live Forex Pairs Ticker Ribbon (Touch-Scrollable) */}
        <div className="bg-[#08090C] border-t border-[#1F2229] px-2 sm:px-4 py-1.5 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar w-full touch-pan-x scroll-smooth">
          <div className="flex items-center gap-1 bg-[#12141A] px-2 py-1 rounded-md border border-[#1F2229] shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FFA3] animate-pulse" />
            <span className="text-[10px] font-bold text-[#F59E0B]">Live</span>
          </div>

          {pairs.map((p) => {
            const meta = PAIR_METADATA[p];
            const price = pairPrices[p] || meta.basePrice;
            const ticker = pairTickers?.[p];
            const changePct = ticker ? ticker.changePercent : 0.25;
            const isPositive = changePct >= 0;
            const isSelected = selectedPair === p;

            return (
              <button
                key={p}
                id={`ticker-btn-${p}`}
                onClick={() => onSelectPair(p)}
                className={`px-2.5 py-1 rounded-lg font-mono flex items-center gap-1.5 border shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#00FFA3]/15 border-[#00FFA3]/80 text-[#00FFA3] shadow-sm'
                    : 'bg-[#12141A] border-[#1F2229] text-[#94A3B8] hover:bg-[#1A1D26] hover:text-[#E0E0E0]'
                }`}
              >
                <span className="font-bold text-[#F3F4F6] text-[11px]">{p}</span>
                <span className="font-semibold text-[11px]">${price.toFixed(meta.digits)}</span>
                <span className={`text-[10px] flex items-center font-bold ${isPositive ? 'text-[#00FFA3]' : 'text-[#FF4D6D]'}`}>
                  {isPositive ? `+${changePct.toFixed(2)}%` : `${changePct.toFixed(2)}%`}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. DYNAMIC MOBILE SLIDE-OUT NAVIGATION DRAWER
      ───────────────────────────────────────────────────────────── */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop Overlay */}
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
          />

          {/* Slide-out Drawer Panel */}
          <div className="relative w-[82vw] max-w-[320px] h-full bg-[#0E1015] border-r border-[#1F2229] flex flex-col z-10 shadow-2xl overflow-hidden animate-fadeIn">
            {/* Drawer Header */}
            <div className="p-4 bg-[#12141A] border-b border-[#1F2229] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00FFA3] to-[#00C278] flex items-center justify-center text-[#0A0B0D] font-black shadow-md">
                  <Zap className="w-4 h-4 fill-[#0A0B0D] text-[#0A0B0D]" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-extrabold text-sm text-[#F3F4F6]">SMC SIGNAL</span>
                    <span className="text-[8px] px-1 py-0.2 rounded bg-[#00FFA3]/20 text-[#00FFA3] font-bold">PRO</span>
                  </div>
                  <p className="text-[10px] text-[#94A3B8] font-mono">Institutional Suite</p>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#E0E0E0] hover:bg-[#1A1D26]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile Mini Banner in Drawer */}
            <div className="p-3 bg-[#0A0B0D] border-b border-[#1F2229]">
              {currentUser ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#00FFA3]/20 border border-[#00FFA3]/40 flex items-center justify-center text-sm text-[#00FFA3] font-bold">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-[#F3F4F6] truncate">{currentUser.name || 'Trader'}</h4>
                    <p className="text-[10px] text-[#94A3B8] truncate">{currentUser.email}</p>
                    <span className="inline-block text-[9px] font-mono font-bold text-[#00FFA3] mt-0.5">
                      {userTier}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-[#F3F4F6]">Guest Account</h4>
                    <p className="text-[10px] text-[#64748B]">Log in to unlock Pro signals &amp; tools</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      onOpenAuthModal();
                    }}
                    className="px-3 py-1.5 bg-[#00FFA3] text-[#0A0B0D] font-bold text-xs rounded-lg"
                  >
                    Log In
                  </button>
                </div>
              )}
            </div>

            {/* Drawer Navigation Links */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider px-2 block mb-1">
                Main Trading Features
              </span>

              {navMenuItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.tab;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.tab)}
                    className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-xs font-semibold transition-all tap-target ${
                      isActive
                        ? 'bg-[#00FFA3]/15 text-[#00FFA3] border border-[#00FFA3]/40 font-bold'
                        : 'text-[#94A3B8] hover:text-[#F3F4F6] hover:bg-[#12141A]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className={`w-4 h-4 ${isActive ? 'text-[#00FFA3]' : 'text-[#64748B]'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          item.badge === 'LIVE'
                            ? 'bg-[#00FFA3]/20 text-[#00FFA3]'
                            : item.badge === 'PRO'
                            ? 'bg-[#F59E0B]/20 text-[#FBBF24]'
                            : 'bg-[#1F2229] text-[#94A3B8]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              <div className="pt-3 border-t border-[#1F2229] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider px-2 block mb-1">
                  Plan &amp; Alerts
                </span>

                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onOpenUpgradeModal();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-[#FBBF24] hover:bg-[#12141A] transition-all tap-target"
                >
                  <div className="flex items-center gap-3">
                    <Crown className="w-4 h-4 text-[#FBBF24]" />
                    <span>{isPaidUser ? 'Manage Subscription' : 'Upgrade to VIP ($29/mo)'}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#64748B]" />
                </button>

                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onToggleNotificationsDrawer();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-[#94A3B8] hover:text-[#F3F4F6] hover:bg-[#12141A] transition-all tap-target"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-[#94A3B8]" />
                    <span>Real-Time Notifications</span>
                  </div>
                  {unreadAlertCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-rose-600 text-white rounded-full text-[9px] font-bold">
                      {unreadAlertCount}
                    </span>
                  )}
                </button>

                {onOpenHelp && (
                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      onOpenHelp();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-[#38BDF8] hover:bg-[#12141A] transition-all tap-target"
                  >
                    <div className="flex items-center gap-3">
                      <HelpCircle className="w-4 h-4 text-[#38BDF8]" />
                      <span>Help &amp; Support Desk</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#38BDF8]/50" />
                  </button>
                )}

                {isAdmin && (
                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      window.location.hash = '#admin';
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-all tap-target"
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-rose-400" />
                      <span>Administrator Gateway</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-rose-400/50" />
                  </button>
                )}
              </div>
            </div>

            {/* Drawer Footer (Sign Out or Log In) */}
            <div className="p-3 bg-[#12141A] border-t border-[#1F2229]">
              {currentUser ? (
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onLogout();
                  }}
                  className="w-full py-2.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all tap-target"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onOpenAuthModal();
                  }}
                  className="w-full py-2.5 bg-[#00FFA3] hover:bg-[#05D588] text-[#0A0B0D] font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-[#00FFA3]/15 tap-target"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Log In / Register Free</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. DYNAMIC MOBILE FIXED BOTTOM NAVIGATION (When mobile detected)
      ───────────────────────────────────────────────────────────── */}
      {isMobile && (
        <nav
          aria-label="Mobile Navigation"
          className="fixed bottom-0 left-0 right-0 z-40 bg-[#0E1015]/95 backdrop-blur-xl border-t border-[#1F2229] px-2 py-1 flex items-center justify-around shadow-2xl pb-[max(6px,env(safe-area-inset-bottom))]"
        >
          {/* 1. Live Chart */}
          <button
            id="bottom-nav-chart"
            onClick={() => onSelectTab('CHART')}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all tap-target ${
              activeTab === 'CHART'
                ? 'text-[#00FFA3] font-bold bg-[#00FFA3]/10'
                : 'text-[#64748B] hover:text-[#94A3B8]'
            }`}
          >
            <Activity className={`w-5 h-5 ${activeTab === 'CHART' ? 'text-[#00FFA3]' : 'text-[#64748B]'}`} />
            <span className="text-[10px] mt-0.5 leading-none">Chart</span>
          </button>

          {/* 2. Signals */}
          <button
            id="bottom-nav-signals"
            onClick={() => onSelectTab('SIGNALS')}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all tap-target ${
              activeTab === 'SIGNALS'
                ? 'text-[#00FFA3] font-bold bg-[#00FFA3]/10'
                : 'text-[#64748B] hover:text-[#94A3B8]'
            }`}
          >
            <Zap className={`w-5 h-5 ${activeTab === 'SIGNALS' ? 'text-[#00FFA3]' : 'text-[#64748B]'}`} />
            <span className="text-[10px] mt-0.5 leading-none">Signals</span>
          </button>

          {/* 3. Paper Trading Desk */}
          <button
            id="bottom-nav-trade"
            onClick={() => onSelectTab('PAPER')}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all tap-target ${
              activeTab === 'PAPER'
                ? 'text-[#00FFA3] font-bold bg-[#00FFA3]/10'
                : 'text-[#64748B] hover:text-[#94A3B8]'
            }`}
          >
            <Layers className={`w-5 h-5 ${activeTab === 'PAPER' ? 'text-[#00FFA3]' : 'text-[#64748B]'}`} />
            <span className="text-[10px] mt-0.5 leading-none">Trade</span>
          </button>

          {/* 4. Forex Factory News */}
          <button
            id="bottom-nav-news"
            onClick={() => onSelectTab('NEWS')}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all tap-target ${
              activeTab === 'NEWS'
                ? 'text-[#00FFA3] font-bold bg-[#00FFA3]/10'
                : 'text-[#64748B] hover:text-[#94A3B8]'
            }`}
          >
            <Calendar className={`w-5 h-5 ${activeTab === 'NEWS' ? 'text-[#00FFA3]' : 'text-[#64748B]'}`} />
            <span className="text-[10px] mt-0.5 leading-none">News</span>
          </button>

          {/* 5. Profile */}
          <button
            id="bottom-nav-profile"
            onClick={() => onSelectTab('PROFILE')}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all tap-target ${
              activeTab === 'PROFILE'
                ? 'text-[#00FFA3] font-bold bg-[#00FFA3]/10'
                : 'text-[#64748B] hover:text-[#94A3B8]'
            }`}
          >
            <UserIcon className={`w-5 h-5 ${activeTab === 'PROFILE' ? 'text-[#00FFA3]' : 'text-[#64748B]'}`} />
            <span className="text-[10px] mt-0.5 leading-none">Profile</span>
          </button>
        </nav>
      )}
    </>
  );
};
