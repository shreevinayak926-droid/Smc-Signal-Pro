import React, { useState } from 'react';
import {
  User, ForexPair, TimeFrame, Candle, Position, AccountState, TrialInfo,
  PushAlert, SMCSignal, SocialTrader, EconomicEvent, PairTickerInfo, GlobalAppSettings, UserPermissions
} from '../types';
import { PAIR_METADATA } from '../utils/forexData';
import { evaluateUserAccess } from '../utils/accessControl';
import { Navbar } from './Navbar';
import { TradingViewChart } from './TradingViewChart';
import { PaperTradePanel } from './PaperTradePanel';
import { BacktestEngine } from './BacktestEngine';
import { ForexFactoryFeed } from './ForexFactoryFeed';
import { SocialDashboard } from './SocialDashboard';
import { SignalsHub } from './SignalsHub';
import { SubscriptionModal } from './SubscriptionModal';
import { AIStructureModal } from './AIStructureModal';
import { AuthModal } from './AuthModal';
import { NotificationCenter } from './NotificationCenter';
import { HelpSupportModal } from './HelpSupportModal';
import {
  Lock,
  AlertTriangle,
  ShieldAlert,
  LogIn,
  Crown,
  Zap,
  BarChart2,
  Users,
  Layers,
  User as UserIcon,
  LogOut,
  CheckCircle2,
  ShieldCheck,
  Mail,
  Smartphone,
  ArrowRight,
  Shield,
  Clock,
  Sparkles,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';
import { ConnectionStatus } from '../utils/MarketDataManager';
import { useResponsiveDisplay } from '../utils/useResponsiveDisplay';


interface TraderLayoutProps {
  activeTab: 'CHART' | 'PAPER' | 'BACKTEST' | 'NEWS' | 'SOCIAL' | 'SIGNALS' | 'PROFILE';
  onSelectTab: (tab: 'CHART' | 'PAPER' | 'BACKTEST' | 'NEWS' | 'SOCIAL' | 'SIGNALS' | 'PROFILE') => void;
  selectedPair: ForexPair;
  onSelectPair: (pair: ForexPair) => void;
  selectedTimeframe: TimeFrame;
  onTimeframeChange: (tf: TimeFrame) => void;
  pairPrices: Record<ForexPair, number>;
  pairTickers?: Record<ForexPair, PairTickerInfo>;
  candlesByPair: Record<ForexPair, Candle[]>;
  smcElements: any;
  account: AccountState;
  trialInfo: TrialInfo | null;
  currentUser: User | null;
  globalSettings?: GlobalAppSettings | null;
  featuresConfig?: any | null;
  userPermissions?: UserPermissions | null;
  customSignals: SMCSignal[];
  alerts: PushAlert[];
  activeToast: PushAlert | null;
  unreadAlertsCount: number;
  isAuthModalOpen: boolean;
  initialAuthMode?: 'LOGIN' | 'SIGNUP' | 'FORGOT_REQUEST' | 'UPDATE_PASSWORD';
  targetProtectedTab: string;
  isSubscriptionModalOpen: boolean;
  isAIScanModalOpen: boolean;
  isNotificationsDrawerOpen: boolean;
  isTradePanelOpen: boolean;
  isMobileTradeModalOpen: boolean;
  quickOrderType: 'BUY' | 'SELL';
  
  // Handlers
  onOpenAuthModal: () => void;
  onCloseAuthModal: () => void;
  onLoginSuccess: (user: User, token: string) => void;
  onLogout: () => void;
  onOpenUpgradeModal: () => void;
  onCloseUpgradeModal: () => void;
  onUpgradeSuccess: (data: any) => void;
  onOpenAIScanModal: () => void;
  onCloseAIScanModal: () => void;
  onToggleNotificationsDrawer: () => void;
  onClearAlerts: () => void;
  onMarkAlertRead: (id: string) => void;
  onCloseToast: () => void;
  onToggleTradePanel: () => void;
  onPlaceQuickOrder: (type: 'BUY' | 'SELL', price: number) => void;
  onCloseMobileTradeModal: () => void;
  onSyncLiveFeed: () => void;
  onOpenPosition: (order: any) => void;
  onClosePosition: (id: string) => void;
  onSetBreakeven: (id: string) => void;
  onClosePartial: (id: string, fraction?: number) => void;
  onResetAccount: () => void;
  onLoadSignalToTrade: (signal: SMCSignal) => void;
  onCopyTrader: (trader: SocialTrader) => void;
  onTriggerNewsPush: (evt: EconomicEvent) => void;
  onAddCustomSignal?: (signal: SMCSignal) => void;
  feedStatus?: ConnectionStatus;
}

export const TraderLayout: React.FC<TraderLayoutProps> = ({
  activeTab,
  onSelectTab,
  selectedPair,
  onSelectPair,
  selectedTimeframe,
  onTimeframeChange,
  pairPrices,
  pairTickers,
  candlesByPair,
  smcElements,
  account,
  trialInfo,
  currentUser,
  globalSettings,
  featuresConfig,
  userPermissions,
  customSignals,
  alerts,
  activeToast,
  unreadAlertsCount,
  isAuthModalOpen,
  initialAuthMode = 'LOGIN',
  targetProtectedTab,
  isSubscriptionModalOpen,
  isAIScanModalOpen,
  isNotificationsDrawerOpen,
  isTradePanelOpen,
  isMobileTradeModalOpen,
  quickOrderType,
  onOpenAuthModal,
  onCloseAuthModal,
  onLoginSuccess,
  onLogout,
  onOpenUpgradeModal,
  onCloseUpgradeModal,
  onUpgradeSuccess,
  onOpenAIScanModal,
  onCloseAIScanModal,
  onToggleNotificationsDrawer,
  onClearAlerts,
  onMarkAlertRead,
  onCloseToast,
  onToggleTradePanel,
  onPlaceQuickOrder,
  onCloseMobileTradeModal,
  onSyncLiveFeed,
  onOpenPosition,
  onClosePosition,
  onSetBreakeven,
  onClosePartial,
  onResetAccount,
  onLoadSignalToTrade,
  onCopyTrader,
  onTriggerNewsPush,
  onAddCustomSignal,
  feedStatus = 'CONNECTED',
}) => {
  const currentCandles = candlesByPair[selectedPair] || [];
  const { isMobile, isDesktop, width } = useResponsiveDisplay();

  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // ── Access Authorization Engine (Fail-Closed with Global Free Access Support) ──
  const access = evaluateUserAccess(currentUser, trialInfo, globalSettings || null);
  const tier = access.effectiveTier;
  const isAdmin = currentUser?.role === 'ADMIN';
  const isGuest = access.isGuest;
  const isFree  = !isGuest && tier === 'FREE_TRIAL';
  const isPro   = access.isPro;
  const isVIP   = access.isVIP;
  const isPaidUser = access.isPaidUser;
  const isGlobalFreeActive = access.isEligibleForGlobalFree;

  // Dynamic Feature Toggles Enforcement from Backend
  const isTradingAllowed = (globalSettings?.tradingEnabled ?? true) && (userPermissions?.tradingAccess ?? true);
  const fvgFeature = featuresConfig?.fvg;
  const chochFeature = featuresConfig?.choch;

  // ── GatePage — Reusable tier gate overlay ─────────────────────────────────
  type GateTier = 'LOGIN' | 'PRO' | 'VIP';
  interface GatePageProps {
    tier: GateTier;
    icon: React.ReactNode;
    title: string;
    description: string;
    features?: string[];
  }
  const GatePage: React.FC<GatePageProps> = ({ tier: gateTier, icon, title, description, features }) => {
    const isLoginGate  = gateTier === 'LOGIN';
    const isProGate    = gateTier === 'PRO';
    const isVIPGate    = gateTier === 'VIP';

    const borderColor  = isLoginGate ? 'border-[#64748B]/30' : isProGate ? 'border-[#F59E0B]/30' : 'border-purple-500/30';
    const iconBg       = isLoginGate ? 'bg-[#64748B]/15'     : isProGate ? 'bg-[#F59E0B]/15'     : 'bg-purple-500/15';
    const iconColor    = isLoginGate ? 'text-[#94A3B8]'       : isProGate ? 'text-[#FBBF24]'       : 'text-purple-400';
    const badgeBg      = isLoginGate ? 'bg-[#64748B]/20 text-[#94A3B8] border-[#64748B]/40' : isProGate ? 'bg-[#F59E0B]/20 text-[#FBBF24] border-[#F59E0B]/40' : 'bg-purple-900/40 text-purple-300 border-purple-500/40';
    const btnClass     = isVIPGate
      ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg shadow-purple-500/20'
      : 'bg-[#00FFA3] hover:bg-[#05D588] text-[#0A0B0D] shadow-lg shadow-[#00FFA3]/20';

    const badgeLabel = isLoginGate ? '🔐 LOGIN REQUIRED' : isProGate ? '🔒 PRO PLAN REQUIRED' : '👑 VIP PLAN REQUIRED';
    const btnLabel   = isLoginGate ? 'Log In / Register Free' : isProGate ? 'Upgrade to Pro — $29/mo' : 'Upgrade to Institutional VIP';
    const btnAction  = isLoginGate ? onOpenAuthModal : onOpenUpgradeModal;

    return (
      <div className="h-full flex flex-col items-center justify-center p-6 sm:p-10">
        {/* Blurred mock background hint */}
        <div className="absolute inset-0 opacity-5 pointer-events-none select-none overflow-hidden rounded-2xl">
          <div className="w-full h-full bg-gradient-to-br from-[#00FFA3]/10 to-transparent" />
        </div>

        <div className={`relative bg-[#0E1015] border ${borderColor} rounded-2xl p-8 sm:p-10 max-w-lg w-full text-center shadow-2xl space-y-5`}>
          {/* Tier badge */}
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-3 py-1 rounded-full border ${badgeBg}`}>
            {badgeLabel}
          </span>

          {/* Icon */}
          <div className={`mx-auto w-16 h-16 rounded-2xl ${iconBg} ${iconColor} flex items-center justify-center`}>
            {icon}
          </div>

          {/* Title & Description */}
          <div>
            <h3 className="text-xl font-extrabold text-[#F3F4F6] mb-2">{title}</h3>
            <p className="text-sm text-[#94A3B8] leading-relaxed">{description}</p>
          </div>

          {/* Feature list */}
          {features && features.length > 0 && (
            <ul className="text-left space-y-1.5 bg-[#0A0B0D] rounded-xl p-4 border border-[#1F2229]">
              {features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-[#E0E0E0]">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isVIPGate ? 'bg-purple-400' : 'bg-[#00FFA3]'}`} />
                  {f}
                </li>
              ))}
            </ul>
          )}

          {/* CTA Button */}
          <button
            onClick={btnAction}
            className={`w-full py-3 font-extrabold text-sm rounded-xl transition-all transform active:scale-[0.98] ${btnClass}`}
          >
            {btnLabel}
          </button>

          {/* Secondary hint */}
          {isLoginGate && (
            <p className="text-[11px] text-[#64748B]">Free accounts get access to Forex News &amp; Social Traders</p>
          )}
          {isProGate && (
            <p className="text-[11px] text-[#64748B]">Cancel anytime • 7-day money-back guarantee</p>
          )}
          {isVIPGate && (
            <p className="text-[11px] text-[#64748B]">Priority support • All Pro features included</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col min-h-screen min-h-[100dvh] bg-[#0A0B0D] text-[#E0E0E0] font-sans selection:bg-[#00FFA3] selection:text-[#0A0B0D] w-full max-w-full overflow-x-hidden ${isMobile ? 'pb-24' : 'pb-6'}`}>
      {/* Maintenance Mode Banner if active */}
      {globalSettings?.maintenanceMode && (
        <div className="bg-[#F59E0B] text-[#0A0B0D] px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-md">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{globalSettings.maintenanceMessage || 'System maintenance in progress. Live quotes remain updated.'}</span>
        </div>
      )}

      {/* Global Free Access Announcement Banner */}
      {isGlobalFreeActive && (
        <div className="bg-gradient-to-r from-[#00FFA3]/20 via-[#00FFA3]/10 to-transparent border-b border-[#00FFA3]/30 px-4 py-2 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00FFA3] animate-ping" />
            <span className="font-bold text-[#00FFA3]">Global Free Access Active:</span>
            <span className="text-[#E0E0E0] hidden sm:inline">
              All Institutional VIP &amp; Pro Trader features unlocked without payment.
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00FFA3]/20 text-[#00FFA3] font-bold">
            FREE VIP ACCESS
          </span>
        </div>
      )}

      {/* Unverified Email Warning if Global Free Access is ON */}
      {globalSettings?.globalFreeAccess && access.reason === 'EMAIL_UNVERIFIED' && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              Global Free Access is active! Please <strong>verify your email</strong> to activate free VIP access.
            </span>
          </div>
          <button
            onClick={onOpenAuthModal}
            className="text-[11px] underline font-bold hover:text-white cursor-pointer shrink-0 ml-2"
          >
            Verify Now →
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        selectedPair={selectedPair}
        onSelectPair={onSelectPair}
        pairPrices={pairPrices}
        pairTickers={pairTickers}
        trialInfo={trialInfo}
        currentUser={currentUser}
        globalSettings={globalSettings}
        onOpenUpgradeModal={onOpenUpgradeModal}
        onToggleNotificationsDrawer={onToggleNotificationsDrawer}
        unreadAlertCount={unreadAlertsCount}
        onOpenAuthModal={onOpenAuthModal}
        onOpenAdminPanel={() => {}}
        onLogout={onLogout}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        feedStatus={feedStatus}
      />

      {/* Floating Push Toast Banner */}
      {activeToast && (
        <div className="fixed top-20 right-5 z-50 max-w-sm bg-[#12141A]/95 border border-[#00FFA3]/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-bounce">
          <div className="flex items-start justify-between gap-2 text-xs">
            <div>
              <span className="font-bold text-[#00FFA3] block">{activeToast.title}</span>
              <p className="text-[#94A3B8] text-[11px] mt-1 leading-relaxed">{activeToast.message}</p>
            </div>
            <button onClick={onCloseToast} className="text-[#64748B] hover:text-[#E0E0E0] p-1 transition-colors">✕</button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto p-1.5 sm:p-4 overflow-y-auto overflow-x-hidden">

        {/* ── CHART TAB ── */}
        {activeTab === 'CHART' && (
          <div className="w-full min-h-[calc(100dvh-140px)] sm:min-h-[calc(100dvh-170px)] flex flex-col">
            {isTradePanelOpen ? (
              <div className={`grid grid-cols-1 ${isDesktop ? 'lg:grid-cols-12' : ''} gap-3 flex-1 min-h-0 w-full`}>
                {/* TradingView Chart */}
                <div className={`${isDesktop ? 'lg:col-span-8' : ''} min-h-[300px] sm:min-h-[440px] lg:min-h-[580px] flex flex-col min-h-0 w-full`}>
                  <TradingViewChart
                    pair={selectedPair}
                    timeframe={selectedTimeframe}
                    candles={currentCandles}
                    orderBlocks={smcElements.orderBlocks}
                    fairValueGaps={smcElements.fairValueGaps}
                    structureBreaks={smcElements.structureBreaks}
                    activePositions={account.positions}
                    marketStructure={smcElements.marketStructure}
                    onTimeframeChange={onTimeframeChange}
                    onOpenAIScan={isPaidUser ? onOpenAIScanModal : onOpenUpgradeModal}
                    onPlaceQuickOrder={onPlaceQuickOrder}
                    livePrice={pairPrices[selectedPair]}
                    onSyncLiveFeed={onSyncLiveFeed}
                    onToggleTradePanel={onToggleTradePanel}
                    isTradePanelOpen={isTradePanelOpen}
                    fvgConfig={fvgFeature}
                    chochConfig={chochFeature}
                    isPaidUser={isPaidUser}
                    onOpenUpgradeModal={onOpenUpgradeModal}
                    feedStatus={feedStatus}
                  />
                </div>

                {/* Right Column — Paper Trade Panel (Only rendered on desktop display) */}
                {isDesktop && (
                  <div className="hidden lg:flex lg:col-span-4 min-h-[580px] h-full min-h-0 flex-col">
                  {isGuest ? (
                    /* Guest: compact login gate */
                    <div className="h-full bg-[#0E1015] border border-[#1F2229] rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#64748B]/15 flex items-center justify-center">
                        <LogIn className="w-6 h-6 text-[#94A3B8]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#F3F4F6]">Paper Trading Panel</h4>
                        <p className="text-xs text-[#64748B] mt-1 leading-relaxed">Log in to place simulated trades with real-time prices</p>
                      </div>
                      <button
                        onClick={onOpenAuthModal}
                        className="w-full py-2.5 bg-[#00FFA3] hover:bg-[#05D588] text-[#0A0B0D] font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Log In / Register Free
                      </button>
                    </div>
                  ) : isFree ? (
                    /* Free user: upgrade gate */
                    <div className="h-full bg-[#0E1015] border border-[#F59E0B]/25 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#F59E0B]/15 flex items-center justify-center">
                        <Lock className="w-6 h-6 text-[#FBBF24]" />
                      </div>
                      <div>
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border bg-[#F59E0B]/20 text-[#FBBF24] border-[#F59E0B]/40">🔒 PRO REQUIRED</span>
                        <h4 className="font-bold text-sm text-[#F3F4F6] mt-2">Paper Trading Panel</h4>
                        <p className="text-xs text-[#64748B] mt-1 leading-relaxed">Execute risk-free simulated trades with live institutional prices</p>
                      </div>
                      <ul className="text-left w-full space-y-1.5 bg-[#0A0B0D] rounded-xl p-3 border border-[#1F2229]">
                        {['Real-time order execution', '50,000 virtual balance', 'Live SL/TP tracking', 'Full position history'].map(f => (
                          <li key={f} className="flex items-center gap-2 text-[11px] text-[#E0E0E0]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00FFA3] shrink-0" />{f}
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={onOpenUpgradeModal}
                        className="w-full py-2.5 bg-[#00FFA3] hover:bg-[#05D588] text-[#0A0B0D] font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Upgrade to Pro — $29/mo
                      </button>
                    </div>
                  ) : !isTradingAllowed ? (
                    <div className="h-full bg-[#0E1015] border border-[#1F2229] rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                      <ShieldAlert className="w-10 h-10 text-[#FF4D6D] mb-3" />
                      <h4 className="font-bold text-sm text-[#F3F4F6]">Trading Order Execution Disabled</h4>
                      <p className="text-xs text-[#94A3B8] mt-1 max-w-xs">Order execution has been temporarily restricted by system administrator policy.</p>
                    </div>
                  ) : (
                    <PaperTradePanel
                      pair={selectedPair}
                      currentPrice={pairPrices[selectedPair] || PAIR_METADATA[selectedPair].basePrice}
                      account={account}
                      onOpenPosition={onOpenPosition}
                      onClosePosition={onClosePosition}
                      onSetBreakeven={onSetBreakeven}
                      onClosePartial={onClosePartial}
                      onResetAccount={onResetAccount}
                      onCollapse={onToggleTradePanel}
                      initialOrderType={quickOrderType}
                      feedStatus={feedStatus}
                      onSelectPair={onSelectPair}
                      pairPrices={pairPrices}
                      pairTickers={pairTickers}
                    />
                  )}
                </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full min-h-[320px] sm:min-h-[480px] lg:min-h-[580px] flex flex-col flex-1">
                <TradingViewChart
                  pair={selectedPair}
                  timeframe={selectedTimeframe}
                  candles={currentCandles}
                  orderBlocks={smcElements.orderBlocks}
                  fairValueGaps={smcElements.fairValueGaps}
                  structureBreaks={smcElements.structureBreaks}
                  activePositions={account.positions}
                  marketStructure={smcElements.marketStructure}
                  onTimeframeChange={onTimeframeChange}
                  onOpenAIScan={isPaidUser ? onOpenAIScanModal : onOpenUpgradeModal}
                  onPlaceQuickOrder={onPlaceQuickOrder}
                  livePrice={pairPrices[selectedPair]}
                  onSyncLiveFeed={onSyncLiveFeed}
                  onToggleTradePanel={onToggleTradePanel}
                  isTradePanelOpen={false}
                  fvgConfig={fvgFeature}
                  chochConfig={chochFeature}
                  isPaidUser={isPaidUser}
                  onOpenUpgradeModal={onOpenUpgradeModal}
                  feedStatus={feedStatus}
                />
              </div>
            )}
          </div>
        )}

        {/* Mobile Trade Modal */}
        {isMobileTradeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4">
            <div className="w-full max-w-lg bg-[#0E1015] border border-[#1F2229] rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-4 py-3 bg-[#12141A] border-b border-[#1F2229]">
                <span className="font-bold text-sm text-[#F3F4F6]">Place {quickOrderType} Order • {selectedPair}</span>
                <button onClick={onCloseMobileTradeModal} className="text-[#94A3B8] hover:text-[#E0E0E0] cursor-pointer">✕</button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-2">
                {isPaidUser ? (
                  <PaperTradePanel
                    pair={selectedPair}
                    currentPrice={pairPrices[selectedPair] || PAIR_METADATA[selectedPair].basePrice}
                    account={account}
                    onOpenPosition={onOpenPosition}
                    onClosePosition={onClosePosition}
                    onSetBreakeven={onSetBreakeven}
                    onClosePartial={onClosePartial}
                    onResetAccount={onResetAccount}
                    onCollapse={onCloseMobileTradeModal}
                    initialOrderType={quickOrderType}
                    onOrderPlaced={onCloseMobileTradeModal}
                    feedStatus={feedStatus}
                    onSelectPair={onSelectPair}
                    pairPrices={pairPrices}
                    pairTickers={pairTickers}
                  />
                ) : (
                  <div className="p-6 text-center space-y-4">
                    <Lock className="w-10 h-10 text-[#FBBF24] mx-auto" />
                    <p className="text-sm text-[#94A3B8]">Upgrade to Pro to place paper trades</p>
                    <button onClick={onOpenUpgradeModal} className="w-full py-3 bg-[#00FFA3] text-[#0A0B0D] font-bold text-sm rounded-xl cursor-pointer">
                      Upgrade to Pro — $29/mo
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── PAPER TAB ── */}
        {activeTab === 'PAPER' && (
          <div className="w-full max-w-4xl mx-auto min-h-[480px] lg:min-h-[calc(100dvh-140px)] pb-10 flex flex-col">
            {isGuest ? (
              <GatePage
                tier="LOGIN"
                icon={<LogIn className="w-8 h-8" />}
                title="Paper Trading Desk"
                description="Simulate real trades with live institutional prices — risk-free. Log in to start your virtual trading journey."
                features={['$50,000 virtual balance', 'Real-time BUY/SELL execution', 'Live SL/TP & breakeven tools', 'Full position P&L tracking']}
              />
            ) : !isPaidUser ? (
              <GatePage
                tier="PRO"
                icon={<Layers className="w-8 h-8" />}
                title="Paper Trading Desk"
                description="Execute risk-free paper trades using real-time institutional spot prices with full position management."
                features={['$50,000 virtual balance', 'Real-time BUY/SELL execution', 'Live SL/TP & breakeven tools', 'Full position P&L tracking', 'Trade history export']}
              />
            ) : (
              <PaperTradePanel
                pair={selectedPair}
                currentPrice={pairPrices[selectedPair] || PAIR_METADATA[selectedPair].basePrice}
                account={account}
                onOpenPosition={onOpenPosition}
                onClosePosition={onClosePosition}
                onSetBreakeven={onSetBreakeven}
                onClosePartial={onClosePartial}
                onResetAccount={onResetAccount}
                feedStatus={feedStatus}
                onSelectPair={onSelectPair}
                pairPrices={pairPrices}
                pairTickers={pairTickers}
              />
            )}
          </div>
        )}

        {/* ── SIGNALS TAB (Exclusively Institutional VIP & Admin) ── */}
        {activeTab === 'SIGNALS' && (
          <div className="w-full min-h-[600px] lg:min-h-[calc(100vh-140px)] pb-10 flex flex-col">
            {isGuest ? (
              <GatePage
                tier="LOGIN"
                icon={<Zap className="w-8 h-8" />}
                title="Institutional SMC Signals Hub"
                description="Get exclusive institutional-grade Smart Money Concepts setups published directly by desk administrators. Log in to view live signals."
                features={['Admin-published live signals', 'Institutional Order Block setups', 'Precise Entry, SL, TP1 & TP2 levels', 'Auto-link to chart & paper trade']}
              />
            ) : !isVIP && !isAdmin ? (
              <GatePage
                tier="VIP"
                icon={<Crown className="w-8 h-8" />}
                title="Institutional SMC Signals Hub"
                description="Exclusive institutional-grade Smart Money signals posted directly by desk administrators. Upgrade to the Institutional VIP plan to unlock live admin setups."
                features={[
                  'Direct Admin-Published Live Signals',
                  'Precise Entry, Stop Loss, TP1 & TP2 Targets',
                  'Institutional Order Flow & Liquidity Rationale',
                  'One-Click Load Setup onto Live Chart',
                  'VIP Real-Time Signal Push Alerts',
                ]}
              />
            ) : (
              <SignalsHub
                onLoadSignalToTrade={onLoadSignalToTrade}
                onOpenUpgradeModal={onOpenUpgradeModal}
                userTier={tier}
                livePrices={pairPrices}
                customSignals={customSignals}
                activePair={selectedPair}
              />
            )}
          </div>
        )}

        {/* ── BACKTEST TAB ── */}
        {activeTab === 'BACKTEST' && (
          <div className="w-full min-h-[600px] lg:min-h-[calc(100vh-140px)] pb-10 flex flex-col">
            {isGuest ? (
              <GatePage
                tier="LOGIN"
                icon={<BarChart2 className="w-8 h-8" />}
                title="Quantitative Backtester"
                description="Stress-test SMC strategies across historical candle data. Log in to access the backtesting engine."
                features={['SMC Silver Bullet algorithm', 'FVG + Order Block strategies', 'Multi-timeframe backtest', 'Win rate & drawdown reports']}
              />
            ) : !isPaidUser ? (
              <GatePage
                tier="PRO"
                icon={<BarChart2 className="w-8 h-8" />}
                title="Quantitative Backtester"
                description="Stress-test SMC Silver Bullet and FVG algorithms across multi-timeframe OHLCV candles with statistical reporting."
                features={['SMC Silver Bullet algorithm', 'FVG + Order Block strategies', 'Multi-timeframe backtest', 'Win rate, profit factor & drawdown', 'Equity curve visualization']}
              />
            ) : (
              <BacktestEngine
                currentPair={selectedPair}
                currentTimeframe={selectedTimeframe}
                candles={candlesByPair[selectedPair]}
                fairValueGaps={smcElements.fairValueGaps}
                structureBreaks={smcElements.structureBreaks}
                orderBlocks={smcElements.orderBlocks}
                marketStructure={smcElements.marketStructure}
                livePrice={pairPrices[selectedPair]}
              />
            )}
          </div>
        )}

        {/* ── NEWS TAB ── (Requires Pro or VIP; Free Trial restricted to Home Chart) */}
        {activeTab === 'NEWS' && (
          <div className="w-full min-h-[600px] lg:min-h-[calc(100vh-140px)] pb-10 flex flex-col">
            {isGuest ? (
              <GatePage
                tier="LOGIN"
                icon={<LogIn className="w-8 h-8" />}
                title="Forex Factory Calendar"
                description="View high-impact economic events, central bank decisions, and market-moving news releases. Log in to access live economic calendar."
                features={['Real-time economic calendar', 'Impact level filtering', 'Affected currency pairs', 'Push notifications for high-impact events']}
              />
            ) : !isPaidUser ? (
              <GatePage
                tier="PRO"
                icon={<BarChart2 className="w-8 h-8" />}
                title="Forex Factory Calendar"
                description="Real-time institutional economic catalysts, interest rate decisions, and volatility alerts. Upgrade to Pro Trader."
                features={['Real-time economic calendar', 'Impact level filtering', 'Affected currency pairs', 'Push notifications for high-impact events']}
              />
            ) : (
              <ForexFactoryFeed
                onSelectAffectedPair={(p) => { onSelectPair(p); onSelectTab('CHART'); }}
                onTriggerPushNotification={onTriggerNewsPush}
              />
            )}
          </div>
        )}

        {/* ── SOCIAL TAB ── (Requires Pro or VIP; Free Trial restricted to Home Chart) */}
        {activeTab === 'SOCIAL' && (
          <div className="w-full min-h-[600px] lg:min-h-[calc(100vh-140px)] pb-10 flex flex-col">
            {isGuest ? (
              <GatePage
                tier="LOGIN"
                icon={<Users className="w-8 h-8" />}
                title="Social Copy Trading"
                description="Follow and copy top institutional SMC traders. View leaderboards, performance stats, and strategy breakdowns. Log in to access social hub."
                features={['Top trader leaderboard', 'Copy strategy with 1 click', 'Live performance metrics', 'Strategy feed & updates']}
              />
            ) : !isPaidUser ? (
              <GatePage
                tier="PRO"
                icon={<Users className="w-8 h-8" />}
                title="Social Copy Trading"
                description="Follow verified institutional SMC traders with automated strategy mirroring and risk controls. Upgrade to Pro Trader."
                features={['Top trader leaderboard', 'Copy strategy with 1 click', 'Live performance metrics', 'Strategy feed & updates']}
              />
            ) : (
              <SocialDashboard
                onCopyTrader={onCopyTrader}
                onSelectPair={(p) => { onSelectPair(p); onSelectTab('CHART'); }}
              />
            )}
          </div>
        )}

        {/* ── PROFILE TAB ── (User Login View, Session Details, Help Desk & Sign Out Option) */}
        {activeTab === 'PROFILE' && (
          <div className="min-h-[600px] max-w-4xl mx-auto overflow-y-auto p-4 md:p-6 pb-12 no-scrollbar animate-fadeIn">
            {isGuest ? (
              <div className="max-w-md mx-auto my-12 bg-[#0E1015] border border-[#1F2229] rounded-2xl p-8 text-center space-y-5 shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-[#00FFA3]/10 border border-[#00FFA3]/30 text-[#00FFA3] flex items-center justify-center mx-auto shadow-lg shadow-[#00FFA3]/10">
                  <UserIcon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-[#F3F4F6]">Trader Profile &amp; Account</h3>
                  <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">
                    Log in or register your account to access personalized profile settings, manage subscription tiers, and chat with 24/7 Desk Support.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={onOpenAuthModal}
                    className="w-full py-3 bg-[#00FFA3] hover:bg-[#00E08F] text-[#0A0B0D] font-bold text-sm rounded-xl shadow-lg shadow-[#00FFA3]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Log In / Create Free Account</span>
                  </button>
                  <p className="text-[11px] text-[#64748B]">24-Hour Free Trial included for all new registered traders</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 1. Profile Header Card */}
                <div className="bg-[#0E1015] border border-[#1F2229] rounded-2xl p-6 relative overflow-hidden shadow-2xl">
                  <div className="absolute -right-16 -top-16 w-60 h-60 bg-[#00FFA3]/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                    <div className="flex items-center gap-4">
                      {/* Avatar with dynamic status indicator */}
                      <div className="relative">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg ${
                          isAdmin
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50'
                            : isVIP
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
                            : isPro
                            ? 'bg-[#00FFA3]/20 text-[#00FFA3] border border-[#00FFA3]/50'
                            : 'bg-slate-700/30 text-slate-300 border border-slate-600/50'
                        }`}>
                          {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#00FFA3] border-2 border-[#0E1015]" title="Online Session" />
                      </div>

                      {/* User Info & Email Status */}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-xl font-extrabold text-[#F3F4F6]">
                            {currentUser?.name || 'Trader'}
                          </h2>
                          <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                            isAdmin
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : isVIP
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                              : isPro
                              ? 'bg-[#00FFA3]/20 text-[#00FFA3] border-[#00FFA3]/40'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {isAdmin ? 'ADMINISTRATOR' : isVIP ? 'INSTITUTIONAL VIP' : isPro ? 'PRO TRADER' : 'FREE 24H TRIAL'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[#94A3B8] mt-1.5 flex-wrap">
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-[#64748B]" />
                            {currentUser?.email}
                          </span>
                          <span className="flex items-center gap-1 text-[#00FFA3] font-medium bg-[#00FFA3]/10 px-2 py-0.5 rounded-full border border-[#00FFA3]/30">
                            <CheckCircle2 className="w-3 h-3" />
                            Email Authenticated
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Sign Out Action */}
                    <button
                      onClick={onLogout}
                      className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer self-stretch sm:self-auto justify-center shadow-md shadow-rose-500/5 hover:scale-[1.02]"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>

                {/* 2. Subscription Validity & Session Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card 1: Subscription & Expiry Status */}
                  <div className="bg-[#0E1015] border border-[#1F2229] rounded-2xl p-5 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Crown className="w-5 h-5 text-[#00FFA3]" />
                        <h3 className="font-bold text-sm text-[#F3F4F6]">Subscription &amp; Validity</h3>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#00FFA3]">
                        {isPaidUser ? (isVIP ? 'VIP ACTIVE' : 'PRO ACTIVE') : '24H TRIAL'}
                      </span>
                    </div>

                    <div className="p-3.5 bg-[#12141A] rounded-xl border border-[#1F2229] space-y-2.5 text-xs">
                      <div className="flex justify-between items-center text-[#94A3B8]">
                        <span>Current Tier:</span>
                        <span className="font-bold text-[#F3F4F6]">
                          {isAdmin ? 'Desk Administrator' : isVIP ? 'Institutional VIP (30 Days)' : isPro ? 'Pro Trader (30 Days)' : '24-Hour Free Trial'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[#94A3B8]">
                        <span>Validity Remaining:</span>
                        <span className="font-mono text-[#00FFA3] font-bold">
                          {currentUser?.subscriptionExpiresAt
                            ? (() => {
                                const diff = currentUser.subscriptionExpiresAt - Date.now();
                                if (diff <= 0) return 'Expired';
                                const days = Math.floor(diff / (24 * 3600 * 1000));
                                const hours = Math.floor((diff % (24 * 3600 * 1000)) / 3600000);
                                return days > 0 ? `${days}d ${hours}h Remaining` : `${hours}h Remaining`;
                              })()
                            : trialInfo?.formattedRemaining || '24h Remaining'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[#94A3B8]">
                        <span>Expires On:</span>
                        <span className="font-mono text-[#E0E0E0]">
                          {currentUser?.subscriptionExpiresAt
                            ? new Date(currentUser.subscriptionExpiresAt).toLocaleDateString('en-US', {
                                dateStyle: 'medium',
                              })
                            : '24 hours from registration'}
                        </span>
                      </div>
                    </div>

                    {!isPaidUser ? (
                      <button
                        onClick={onOpenUpgradeModal}
                        className="w-full py-2.5 bg-gradient-to-r from-[#00FFA3] to-[#05D588] text-[#0A0B0D] font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#00FFA3]/15 hover:scale-[1.01] transition-all cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Upgrade Plan (30 Days Validity)</span>
                      </button>
                    ) : (
                      <div className="p-2.5 bg-[#00FFA3]/10 border border-[#00FFA3]/30 rounded-xl text-xs text-[#00FFA3] flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Plan active. 30-day institutional validity verified.</span>
                      </div>
                    )}
                  </div>

                  {/* Card 2: Help & Support Desk Access */}
                  <div className="bg-[#0E1015] border border-[#1F2229] rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="w-5 h-5 text-[#38BDF8]" />
                          <h3 className="font-bold text-sm text-[#F3F4F6]">Help &amp; Support Desk</h3>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 rounded-full font-bold">
                          24/7 ACTIVE
                        </span>
                      </div>
                      <p className="text-xs text-[#94A3B8] mt-2 leading-relaxed">
                        Need assistance with plan activation, UPI payments, signals, or account setup? Chat directly with desk administrators.
                      </p>
                    </div>

                    <button
                      onClick={() => setIsHelpModalOpen(true)}
                      className="w-full py-2.5 bg-[#12141A] hover:bg-[#1A1D26] border border-[#38BDF8]/40 text-[#38BDF8] hover:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Open Help Desk &amp; Chat Support</span>
                    </button>
                  </div>
                </div>

                {/* 3. Administrator Portal Section (if admin) */}
                {isAdmin && (
                  <div className="p-5 bg-rose-500/5 border border-rose-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/40">
                        <Shield className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#F3F4F6]">Administrator Central Gateway</h4>
                        <p className="text-xs text-[#94A3B8] mt-0.5">
                          Manage global users, verify payments, reply to support inquiries, and publish signals.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        window.location.hash = '#admin';
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition-all cursor-pointer shrink-0"
                    >
                      <span>Open Admin Control Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* 4. Prominent Sign Out Banner */}
                <div className="p-6 bg-[#12141A] border border-[#1F2229] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                  <div className="text-center sm:text-left">
                    <h4 className="font-bold text-sm text-[#F3F4F6]">Sign Out of Account</h4>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Terminates your current session for <strong className="text-[#94A3B8]">{currentUser?.email}</strong>.
                    </p>
                  </div>
                  <button
                    onClick={onLogout}
                    className="w-full sm:w-auto px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Quick Support Button */}
      <button
        onClick={() => setIsHelpModalOpen(true)}
        aria-label="Help & Support Desk"
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 p-3 bg-gradient-to-r from-[#00FFA3] to-[#00D182] text-[#0A0B0D] font-extrabold rounded-2xl shadow-2xl shadow-[#00FFA3]/30 flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 transition-all"
        title="24/7 Desk Support"
      >
        <MessageSquare className="w-5 h-5 fill-[#0A0B0D]" />
        <span className="text-xs font-black hidden sm:inline">Help &amp; Support</span>
      </button>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={onCloseAuthModal}
        onLoginSuccess={onLoginSuccess}
        targetTabName={targetProtectedTab}
        initialMode={initialAuthMode}
      />

      <AIStructureModal
        isOpen={isAIScanModalOpen}
        onClose={onCloseAIScanModal}
        pair={selectedPair}
        timeframe={selectedTimeframe}
        currentPrice={pairPrices[selectedPair] || PAIR_METADATA[selectedPair].basePrice}
        candles={currentCandles}
        onApplyTradeSetup={(setup) => {
          onOpenPosition({
            pair: selectedPair,
            type: setup.type,
            lotSize: 1.0,
            sl: setup.sl,
            tp: setup.tp,
          });
        }}
        onAddCustomSignal={onAddCustomSignal}
      />

      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={onCloseUpgradeModal}
        trialInfo={trialInfo}
        userEmail={currentUser?.email}
        onUpgradeSuccess={onUpgradeSuccess}
      />

      <NotificationCenter
        isOpen={isNotificationsDrawerOpen}
        onClose={onToggleNotificationsDrawer}
        alerts={alerts}
        onClearAll={onClearAlerts}
        onMarkRead={onMarkAlertRead}
      />

      <HelpSupportModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
};
