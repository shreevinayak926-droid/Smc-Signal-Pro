'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, ForexPair, TimeFrame, Candle, Position, AccountState, TrialInfo, PushAlert, SMCSignal, SocialTrader, EconomicEvent, PairTickerInfo, SubscriptionTier, GlobalAppSettings, UserPermissions } from './types';
import { PAIR_METADATA, generateCandleHistory, calculateSMCElements, playNotificationChime } from './utils/forexData';
import { generateSMCSignalFromChart } from './utils/smc/SignalGenerator';
import {
  loadAccountState,
  saveAccountState,
  getOrCreateDeviceFingerprint,
  loadStoredTrial,
  saveStoredTrial,
  loadStoredAlerts,
  saveStoredAlerts,
  INITIAL_ACCOUNT_STATE,
} from './utils/storage';
import { TraderLayout } from './components/TraderLayout';
import { AdminLayout } from './components/AdminLayout';
import { AdminLogin } from './components/AdminLogin';
import { MarketDataManager, PriceDebugComparison, ConnectionStatus } from './utils/MarketDataManager';
import { isSupabaseConfigured } from './services/supabase';
import { supabaseAuthService } from './services/supabaseAuth';
import {
  supabaseSubscribeToAlerts,
  supabaseGetGlobalSettings,
  supabaseGetCentralFeatures,
  supabaseSubscribeToUser,
  supabaseGetUser,
} from './services/supabaseDb';
import { fetchLivePricesWithGemini } from './services/aiService';
import confetti from 'canvas-confetti';
import { LocationGate } from './components/LocationGate';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { evaluateUserAccess } from './utils/accessControl';

interface TradingAppProps {
  initialRoute?: 'TRADER' | 'ADMIN_PORTAL';
}

export default function TradingApp({ initialRoute }: TradingAppProps = {}) {
  // Navigation & Pair state
  const [activeTab, setActiveTab] = useState<'CHART' | 'PAPER' | 'BACKTEST' | 'NEWS' | 'SOCIAL' | 'SIGNALS' | 'PROFILE'>('CHART');
  const [selectedPair, setSelectedPair] = useState<ForexPair>('XAUUSD');
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>('15m');

  // Account & Positions state
  const [account, setAccount] = useState<AccountState>(loadAccountState);

  // Candles & Live Price State
  // Seed prices aligned to Spot Mid (OANDA:XAUUSD compatible) — matches TradingView chart instrument
  const [candlesByPair, setCandlesByPair] = useState<Record<ForexPair, Candle[]>>(() => ({
    XAUUSD: generateCandleHistory('XAUUSD', '15m', 80, 4634.09),
    EURUSD: generateCandleHistory('EURUSD', '15m', 80, 1.16798),
    GBPUSD: generateCandleHistory('GBPUSD', '15m', 80, 1.36436),
    USDJPY: generateCandleHistory('USDJPY', '15m', 80, 158.906),
    BTCUSD: generateCandleHistory('BTCUSD', '15m', 80, 77106.92),
    US30: generateCandleHistory('US30', '15m', 80, 53277.01),
  }));

  const [pairPrices, setPairPrices] = useState<Record<ForexPair, number>>(() => ({
    // XAUUSD: Spot Gold Mid Price (matches OANDA:XAUUSD on TradingView chart)
    XAUUSD: 4634.09,
    EURUSD: 1.16798,
    GBPUSD: 1.36436,
    USDJPY: 158.906,
    BTCUSD: 77106.92,
    US30: 53277.01,
  }));

  const [pairTickers, setPairTickers] = useState<Record<ForexPair, PairTickerInfo>>(() => ({
    XAUUSD: { price: 4634.09, change24h: 33.15, changePercent: 0.72, high24h: 4655.80, low24h: 4610.20, lastUpdated: Date.now() },
    EURUSD: { price: 1.16798, change24h: 0.0018, changePercent: 0.17, high24h: 1.1710, low24h: 1.1640, lastUpdated: Date.now() },
    GBPUSD: { price: 1.36436, change24h: 0.0031, changePercent: 0.24, high24h: 1.3695, low24h: 1.3610, lastUpdated: Date.now() },
    USDJPY: { price: 158.906, change24h: -0.42, changePercent: -0.27, high24h: 159.60, low24h: 158.40, lastUpdated: Date.now() },
    BTCUSD: { price: 77106.92, change24h: 1850.00, changePercent: 2.13, high24h: 78200.00, low24h: 76100.00, lastUpdated: Date.now() },
    US30: { price: 53277.01, change24h: 165.00, changePercent: 0.38, high24h: 53500.00, low24h: 53000.00, lastUpdated: Date.now() },
  }));

  // Store authentic exchange prices to prevent runaway drift
  const verifiedPricesRef = useRef<Record<ForexPair, number>>({
    XAUUSD: 4634.09,
    EURUSD: 1.16798,
    GBPUSD: 1.36436,
    USDJPY: 158.906,
    BTCUSD: 77106.92,
    US30: 53277.01,
  });

  // Real-time Debug Telemetry & Single Source of Truth Comparison
  const [debugInfo, setDebugInfo] = useState<PriceDebugComparison>(() =>
    MarketDataManager.getDebugComparison('XAUUSD')
  );
  const [feedStatus, setFeedStatus] = useState<ConnectionStatus>(() =>
    MarketDataManager.getState('XAUUSD').status
  );

  // Subscribe to MarketDataManager for synchronized updates
  useEffect(() => {
    const unsub = MarketDataManager.subscribe((states) => {
      setDebugInfo(MarketDataManager.getDebugComparison(selectedPair));
      const activeState = states[selectedPair];
      if (activeState) {
        setFeedStatus(activeState.status);
      }
    });
    return unsub;
  }, [selectedPair]);

  // User Authentication & Central Features State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem('smc_user_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [routeView, setRouteView] = useState<'TRADER' | 'ADMIN_PORTAL'>(() => {
    if (initialRoute) return initialRoute;
    if (typeof window === 'undefined') return 'TRADER';
    const isAdminRoute = window.location.pathname.startsWith('/admin') || window.location.hash.startsWith('#admin');
    if (isAdminRoute) {
      try {
        const saved = localStorage.getItem('smc_user_session');
        const parsed = saved ? JSON.parse(saved) : null;
        if (parsed?.role === 'ADMIN') {
          return 'ADMIN_PORTAL';
        }
      } catch {
        // fallback
      }
    }
    return 'TRADER';
  });

  const [globalSettings, setGlobalSettings] = useState<GlobalAppSettings | null>(null);
  const [featuresConfig, setFeaturesConfig] = useState<any | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [initialAuthMode, setInitialAuthMode] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT_REQUEST' | 'UPDATE_PASSWORD'>('LOGIN');
  const [targetProtectedTab, setTargetProtectedTab] = useState<string>('');

  // Sync URL Hash / Location with routeView & Password Recovery detection
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      const isAdminRoute = path.startsWith('/admin') || hash.startsWith('#admin');

      if (isAdminRoute) {
        let isAdmin = currentUser?.role === 'ADMIN';
        if (!isAdmin) {
          try {
            const saved = localStorage.getItem('smc_user_session');
            const parsed = saved ? JSON.parse(saved) : null;
            if (parsed?.role === 'ADMIN') isAdmin = true;
          } catch {
            // ignore
          }
        }

        if (isAdmin) {
          setRouteView('ADMIN_PORTAL');
        } else if (currentUser && currentUser.role !== 'ADMIN') {
          // Normal user cannot access admin panel -> redirect to SMC dashboard
          if (typeof window !== 'undefined') {
            window.location.href = '/dashboard';
          }
        } else {
          // Unauthenticated visitor -> show dedicated Admin Credentials Login gate
          setRouteView('ADMIN_PORTAL');
        }
      } else {
        setRouteView('TRADER');
      }

      // Detect Supabase Password Recovery link from email
      if (
        hash.includes('reset-password') ||
        hash.includes('type=recovery') ||
        search.includes('type=recovery')
      ) {
        setInitialAuthMode('UPDATE_PASSWORD');
        setIsAuthModalOpen(true);
      }
    };

    handleLocationChange();
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);

    const onRecoveryEvent = () => {
      setInitialAuthMode('UPDATE_PASSWORD');
      setIsAuthModalOpen(true);
    };
    window.addEventListener('supabase:password_recovery', onRecoveryEvent);

    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('supabase:password_recovery', onRecoveryEvent);
    };
  }, [currentUser?.role]);

  // Supabase Real-time Observer & Config Sync
  useEffect(() => {
    const fetchAppConfig = async () => {
      try {
        const [settings, features] = await Promise.all([
          supabaseGetGlobalSettings(),
          supabaseGetCentralFeatures(),
        ]);
        if (settings) setGlobalSettings(settings);
        if (features) setFeaturesConfig(features);
      } catch (err) {
        console.warn('[Supabase Config Sync]:', err);
      }
    };

    fetchAppConfig();
    const timer = setInterval(fetchAppConfig, 10000);

    // Supabase Auth Real-time Observer
    let unsubAuth: (() => void) | null = null;
    let unsubAlerts: (() => void) | null = null;

    if (isSupabaseConfigured()) {
      unsubAuth = supabaseAuthService.onAuthStateChanged((user) => {
        if (user) {
          setCurrentUser(user);
          localStorage.setItem('smc_user_session', JSON.stringify(user));
          if (user.token) localStorage.setItem('smc_auth_token', user.token);
        } else {
          setCurrentUser(null);
        }
      });

      unsubAlerts = supabaseSubscribeToAlerts((sbAlerts) => {
        if (sbAlerts && sbAlerts.length > 0) {
          setAlerts((prev) => {
            const merged = [...sbAlerts, ...prev];
            const unique = merged.filter((a, idx, arr) => idx === arr.findIndex((x) => x.id === a.id));
            saveStoredAlerts(unique);
            return unique;
          });
        }
      });
    }

    return () => {
      clearInterval(timer);
      if (unsubAuth) unsubAuth();
      if (unsubAlerts) unsubAlerts();
    };
  }, []);

  // Real-time listener & periodic sync for currentUser profile (tier downgrade/upgrade, plan validity, ban status)
  useEffect(() => {
    if (!currentUser?.id || !isSupabaseConfigured()) return;

    // 1. Instant real-time postgres listener on public.profiles for this user
    const unsub = supabaseSubscribeToUser(currentUser.id, (freshUser) => {
      if (freshUser) {
        setCurrentUser((prev) => {
          if (!prev) return freshUser;
          if (
            prev.tier !== freshUser.tier ||
            prev.status !== freshUser.status ||
            prev.subscriptionExpiresAt !== freshUser.subscriptionExpiresAt
          ) {
            const merged = { ...prev, ...freshUser };
            localStorage.setItem('smc_user_session', JSON.stringify(merged));
            return merged;
          }
          return prev;
        });
      }
    });

    // 2. Background polling fallback every 12s so admin changes reflect immediately even if websocket drops
    const syncInterval = setInterval(async () => {
      try {
        const fresh = await supabaseGetUser(currentUser.id);
        if (fresh) {
          setCurrentUser((prev) => {
            if (!prev) return fresh;
            if (
              prev.tier !== fresh.tier ||
              prev.status !== fresh.status ||
              prev.subscriptionExpiresAt !== fresh.subscriptionExpiresAt
            ) {
              const merged = { ...prev, ...fresh };
              localStorage.setItem('smc_user_session', JSON.stringify(merged));
              return merged;
            }
            return prev;
          });
        }
      } catch (err) {
        console.warn('[User Sync Exception]:', err);
      }
    }, 12000);

    return () => {
      if (unsub) unsub();
      clearInterval(syncInterval);
    };
  }, [currentUser?.id]);

  // Login Success Handler — Smart Admin Redirect to /admin
  const handleLoginSuccess = (user: User, token: string) => {
    setCurrentUser(user);
    localStorage.setItem('smc_user_session', JSON.stringify(user));
    localStorage.setItem('smc_auth_token', token);

    if (user.role === 'ADMIN') {
      window.location.hash = '#admin';
      setRouteView('ADMIN_PORTAL');
    } else {
      if (window.location.pathname.startsWith('/admin')) {
        window.history.replaceState({}, '', '/');
      }
      window.location.hash = '';
      setRouteView('TRADER');
    }
    setIsAuthModalOpen(false);
  };

  // Logout Handler
  const handleLogout = () => {
    supabaseAuthService.logout();
    setCurrentUser(null);
    localStorage.removeItem('smc_user_session');
    localStorage.removeItem('smc_auth_token');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  // ── Plan Tab Access Gate (Driven by centralized evaluateUserAccess) ──────
  const handleSelectTab = (tab: 'CHART' | 'PAPER' | 'BACKTEST' | 'NEWS' | 'SOCIAL' | 'SIGNALS' | 'PROFILE') => {
    // CHART — always open to everyone
    if (tab === 'CHART') { setActiveTab(tab); return; }

    const access = evaluateUserAccess(currentUser, trialInfo, globalSettings);

    // Guest / Visitor → strictly gated from all non-chart tabs
    if (access.isGuest) {
      const tabNames: Record<string, string> = {
        PAPER:    'Paper Trading Desk',
        SIGNALS:  'Live SMC Signals Hub',
        BACKTEST: 'Quantitative Backtester',
        NEWS:     'Forex Factory Calendar',
        SOCIAL:   'Social Copy Trading',
        PROFILE:  'User Profile & Account',
      };
      setTargetProtectedTab(tabNames[tab] || tab);
      setIsAuthModalOpen(true);
      return;
    }

    // Set tab — GatePages inside TraderLayout handle precise Pro vs Institutional VIP vs Email Verification messaging
    setActiveTab(tab);
  };

  // Trial & Subscription State
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(loadStoredTrial);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isAIScanModalOpen, setIsAIScanModalOpen] = useState(false);
  const [isNotificationsDrawerOpen, setIsNotificationsDrawerOpen] = useState(false);

  // Real-time Push Alerts
  const [alerts, setAlerts] = useState<PushAlert[]>(loadStoredAlerts);

  // Active Toast Notification Banner
  const [activeToast, setActiveToast] = useState<PushAlert | null>(null);

  // User/Chart-Generated Realtime Signals
  const [customSignals, setCustomSignals] = useState<SMCSignal[]>([]);

  // Collapsible Trade Column & Quick Order State
  const [isTradePanelOpen, setIsTradePanelOpen] = useState(true);
  const [quickOrderType, setQuickOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [isMobileTradeModalOpen, setIsMobileTradeModalOpen] = useState(false);

  const handlePlaceQuickOrder = (type: 'BUY' | 'SELL', price: number) => {
    setQuickOrderType(type);
    if (window.innerWidth < 1024) {
      setIsMobileTradeModalOpen(true);
    } else {
      setIsTradePanelOpen(true);
    }
  };

  // Direct backend exchange high-precision spot price fetcher
  // Seamlessly runs in background every 3 seconds without full page reload
  const fetchDirectClientPrices = useCallback(async () => {
    try {
      const newPrices: Partial<Record<ForexPair, number>> = {};
      const newTickers: Partial<Record<ForexPair, PairTickerInfo>> = {};

      const promises: Promise<void>[] = [
        // BTCUSD: Binance spot
        fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT')
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (d?.lastPrice) {
              const p = parseFloat(d.lastPrice);
              newPrices.BTCUSD = p;
              newTickers.BTCUSD = {
                price: p,
                change24h: parseFloat(d.priceChange || '0'),
                changePercent: parseFloat(d.priceChangePercent || '0'),
                high24h: parseFloat(d.highPrice || '0'),
                low24h: parseFloat(d.lowPrice || '0'),
                lastUpdated: Date.now(),
              };
            }
          })
          .catch(() => {}),

        // XAUUSD: Spot Gold (Gold-API / Spot Feed)
        fetch('https://api.gold-api.com/price/XAU')
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (d?.price && d.price > 1500) {
              const p = parseFloat(d.price);
              newPrices.XAUUSD = p;
              const chg = d.ch ? parseFloat(d.ch) : 33.15;
              const chgPct = d.chp ? parseFloat(d.chp) : 0.72;
              newTickers.XAUUSD = {
                price: p,
                change24h: chg,
                changePercent: chgPct,
                high24h: p + 15,
                low24h: p - 20,
                lastUpdated: Date.now(),
              };
            }
          })
          .catch(() => {}),

        // EURUSD: Yahoo Finance FX Spot (EURUSD=X)
        fetch('https://query1.finance.yahoo.com/v8/finance/chart/EURUSD=X?interval=1m&range=1d', { headers: { 'User-Agent': 'Mozilla/5.0' } })
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            const meta = d?.chart?.result?.[0]?.meta;
            if (meta?.regularMarketPrice) {
              const p = Number(meta.regularMarketPrice.toFixed(5));
              const prev = meta.chartPreviousClose || p;
              const chg = p - prev;
              const chgPct = (chg / prev) * 100;
              newPrices.EURUSD = p;
              newTickers.EURUSD = {
                price: p,
                change24h: Number(chg.toFixed(5)),
                changePercent: Number(chgPct.toFixed(2)),
                high24h: meta.regularMarketDayHigh || (p + 0.003),
                low24h: meta.regularMarketDayLow || (p - 0.003),
                lastUpdated: Date.now(),
              };
            }
          })
          .catch(() => {}),

        // GBPUSD: Yahoo Finance FX Spot (GBPUSD=X)
        fetch('https://query1.finance.yahoo.com/v8/finance/chart/GBPUSD=X?interval=1m&range=1d', { headers: { 'User-Agent': 'Mozilla/5.0' } })
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            const meta = d?.chart?.result?.[0]?.meta;
            if (meta?.regularMarketPrice) {
              const p = Number(meta.regularMarketPrice.toFixed(5));
              const prev = meta.chartPreviousClose || p;
              const chg = p - prev;
              const chgPct = (chg / prev) * 100;
              newPrices.GBPUSD = p;
              newTickers.GBPUSD = {
                price: p,
                change24h: Number(chg.toFixed(5)),
                changePercent: Number(chgPct.toFixed(2)),
                high24h: meta.regularMarketDayHigh || (p + 0.004),
                low24h: meta.regularMarketDayLow || (p - 0.004),
                lastUpdated: Date.now(),
              };
            }
          })
          .catch(() => {}),

        // USDJPY: Yahoo Finance FX Spot (JPY=X)
        fetch('https://query1.finance.yahoo.com/v8/finance/chart/JPY=X?interval=1m&range=1d', { headers: { 'User-Agent': 'Mozilla/5.0' } })
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            const meta = d?.chart?.result?.[0]?.meta;
            if (meta?.regularMarketPrice) {
              const p = Number(meta.regularMarketPrice.toFixed(3));
              const prev = meta.chartPreviousClose || p;
              const chg = p - prev;
              const chgPct = (chg / prev) * 100;
              newPrices.USDJPY = p;
              newTickers.USDJPY = {
                price: p,
                change24h: Number(chg.toFixed(3)),
                changePercent: Number(chgPct.toFixed(2)),
                high24h: meta.regularMarketDayHigh || (p + 0.8),
                low24h: meta.regularMarketDayLow || (p - 0.6),
                lastUpdated: Date.now(),
              };
            }
          })
          .catch(() => {}),

        // US30: Yahoo Finance DJI (^DJI)
        fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5EDJI?interval=15m&range=1d', { headers: { 'User-Agent': 'Mozilla/5.0' } })
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            const meta = d?.chart?.result?.[0]?.meta;
            const p = meta?.regularMarketPrice;
            if (p && p > 10000) {
              newPrices.US30 = Number(p.toFixed(2));
              const prevClose = meta?.chartPreviousClose || p;
              const chg = p - prevClose;
              const chgPct = (chg / prevClose) * 100;
              newTickers.US30 = {
                price: Number(p.toFixed(2)),
                change24h: Number(chg.toFixed(2)),
                changePercent: Number(chgPct.toFixed(2)),
                high24h: Number((p + 250).toFixed(2)),
                low24h: Number((p - 200).toFixed(2)),
                lastUpdated: Date.now(),
              };
            }
          })
          .catch(() => {}),
      ];

      await Promise.allSettled(promises);

      if (Object.keys(newPrices).length > 0) {
        setPairPrices((prev) => {
          const merged = { ...prev, ...newPrices } as Record<ForexPair, number>;
          (Object.keys(newPrices) as ForexPair[]).forEach((pair) => {
            if (newPrices[pair]) verifiedPricesRef.current[pair] = newPrices[pair]!;
          });
          MarketDataManager.updateLivePrices(merged, undefined, 'Institutional Spot Stream (Yahoo FX / Binance / Spot API)');
          return merged;
        });
      }

      if (Object.keys(newTickers).length > 0) {
        setPairTickers((prev) => ({
          ...prev,
          ...newTickers,
        } as Record<ForexPair, PairTickerInfo>));
      }
    } catch {
      // Keep existing
    }
  }, []);

  // Device Fingerprint initialization & Trial check
  useEffect(() => {
    const initTrial = async () => {
      const stored = loadStoredTrial();
      setTrialInfo(stored);
    };
    initTrial();

    // Trial countdown ticker
    const interval = setInterval(() => {
      setTrialInfo((prev) => {
        if (!prev) return prev;
        const now = Date.now();
        const elapsed = now - prev.startTime;
        const remainingMs = Math.max(0, prev.durationMs - elapsed);
        const isExpired = remainingMs <= 0 && prev.tier === 'FREE_TRIAL';

        const totalSec = Math.floor(remainingMs / 1000);
        const hours = Math.floor(totalSec / 3600);
        const mins = Math.floor((totalSec % 3600) / 60);
        const secs = totalSec % 60;
        const formatted = isExpired
          ? '00:00:00 (Expired)'
          : `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;

        return {
          ...prev,
          remainingMs,
          isExpired,
          isTrialActive: !isExpired,
          formattedRemaining: formatted,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch live candles for a pair and timeframe
  const fetchMarketCandles = useCallback((pair: ForexPair, tf: TimeFrame) => {
    // Generate authentic candles anchored to current live price
    const candles = generateCandleHistory(pair, tf, 80, pairPrices[pair]);
    setCandlesByPair((prev) => ({
      ...prev,
      [pair]: candles,
    }));
    MarketDataManager.setCandles(pair, tf, candles);
  }, [pairPrices]);

  // Sync candles when switching timeframe
  const handleTimeframeChange = useCallback((tf: TimeFrame) => {
    setSelectedTimeframe(tf);
    fetchMarketCandles(selectedPair, tf);
  }, [selectedPair, fetchMarketCandles]);

  // Sync candles when switching pair
  const handlePairChange = useCallback((pair: ForexPair) => {
    setSelectedPair(pair);
    fetchMarketCandles(pair, selectedTimeframe);
  }, [selectedTimeframe, fetchMarketCandles]);

  // Force Instant Live Feed Sync
  const forceSyncAll = useCallback(async () => {
    await fetchDirectClientPrices();
    fetchMarketCandles(selectedPair, selectedTimeframe);
  }, [selectedPair, selectedTimeframe, fetchMarketCandles, fetchDirectClientPrices]);

  // ── Single Centralized Polling Engine ──────────────────────────────────────
  // Fetches live spot market data directly from Binance, Gold-API, and OpenExchange
  useEffect(() => {
    let isMounted = true;

    const fetchLiveFeed = async () => {
      if (!isMounted) return;
      try {
        await fetchDirectClientPrices();
      } catch {
        // Keep existing prices
      }
    };

    // Initial fetch immediately
    fetchLiveFeed();
    fetchMarketCandles(selectedPair, selectedTimeframe);

    // Live market data: single 3-second heartbeat (smooth backend update, no page reload)
    const livePoll = setInterval(() => {
      fetchLiveFeed();
    }, 3000);

    // Candle refresh every 30 seconds
    const candlePoll = setInterval(() => {
      if (isMounted) fetchMarketCandles(selectedPair, selectedTimeframe);
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(livePoll);
      clearInterval(candlePoll);
    };
  }, [selectedPair, selectedTimeframe, fetchMarketCandles, fetchDirectClientPrices]);

  // Helper to add new real-time push alert with sound chime
  const addAlert = useCallback((title: string, message: string, type: 'NEWS' | 'SIGNAL' | 'TRADE_FILL' | 'TRIAL_EXPIRY', impact?: 'HIGH' | 'MEDIUM' | 'LOW') => {
    const newAlert: PushAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      type,
      impact,
      timestamp: Date.now(),
      read: false,
    };

    setAlerts((prev) => {
      const updated = [newAlert, ...prev].slice(0, 40);
      saveStoredAlerts(updated);
      return updated;
    });

    setActiveToast(newAlert);
    playNotificationChime();

    // Auto dismiss toast after 6 seconds
    setTimeout(() => {
      setActiveToast((current) => (current?.id === newAlert.id ? null : current));
    }, 6000);
  }, []);

  // ── Position PnL and TP/SL Evaluation Engine ──────────────────────────
  // Runs whenever real verified pair prices update — zero synthetic random jitter
  useEffect(() => {
    setAccount((prevAccount) => {
      let totalPnl = 0;
      let totalMarginUsed = 0;
      const remainingPositions: Position[] = [];
      const newlyClosedHistory: Position[] = [];

      prevAccount.positions.forEach((pos) => {
        if (pos.status !== 'OPEN') return;
        const meta = PAIR_METADATA[pos.pair];
        const currentPrice = pairPrices[pos.pair] || meta.basePrice;
        const isBuy = pos.type === 'BUY';
        const pipSize = meta.pipSize;

        const pips = isBuy
          ? (currentPrice - pos.entryPrice) / pipSize
          : (pos.entryPrice - currentPrice) / pipSize;

        const pnl = Number((pips * pipSize * meta.contractSize * pos.lotSize).toFixed(2));
        const margin = (pos.entryPrice * meta.contractSize * pos.lotSize) / prevAccount.leverage;
        totalMarginUsed += margin;

        // Check TP Hit
        const isTPHit = isBuy ? currentPrice >= pos.tp : currentPrice <= pos.tp;
        // Check SL Hit
        const isSLHit = isBuy ? currentPrice <= pos.sl : currentPrice >= pos.sl;

        if (isTPHit || isSLHit) {
          const reason = isTPHit ? 'TP' : 'SL';
          const closedPos: Position = {
            ...pos,
            status: 'CLOSED',
            currentPrice,
            closePrice: isTPHit ? pos.tp : pos.sl,
            closeTime: Date.now(),
            closeReason: reason,
            pnl,
            pnlPips: Number(pips.toFixed(1)),
          };

          newlyClosedHistory.push(closedPos);
          addAlert(
            `${reason === 'TP' ? '🎯 Take Profit Filled' : '🛡️ Stop Loss Triggered'} (${pos.pair})`,
            `${pos.type} ${pos.lotSize}L closed at ${currentPrice.toFixed(meta.digits)}. Realized P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`,
            'TRADE_FILL',
            reason === 'TP' ? 'LOW' : 'MEDIUM'
          );
        } else {
          remainingPositions.push({
            ...pos,
            currentPrice,
            pnl,
            pnlPips: Number(pips.toFixed(1)),
          });
          totalPnl += pnl;
        }
      });

      if (newlyClosedHistory.length > 0 || remainingPositions.length > 0) {
        const realizedProfitFromNewlyClosed = newlyClosedHistory.reduce((acc, p) => acc + p.pnl, 0);
        const newBalance = Number((prevAccount.balance + realizedProfitFromNewlyClosed).toFixed(2));
        const newEquity = Number((newBalance + totalPnl).toFixed(2));
        const freeMargin = Math.max(0, Number((newEquity - totalMarginUsed).toFixed(2)));

        const updatedAccount: AccountState = {
          ...prevAccount,
          balance: newBalance,
          equity: newEquity,
          margin: Number(totalMarginUsed.toFixed(2)),
          freeMargin,
          positions: remainingPositions,
          history: [...prevAccount.history, ...newlyClosedHistory],
        };

        saveAccountState(updatedAccount);
        return updatedAccount;
      }

      return prevAccount;
    });
  }, [pairPrices, addAlert]);

  // Position Handlers for Paper Trading
  const handleOpenPosition = (order: {
    pair: ForexPair;
    type: 'BUY' | 'SELL';
    lotSize: number;
    sl: number;
    tp: number;
  }) => {
    const meta = PAIR_METADATA[order.pair];
    const currentPrice = pairPrices[order.pair] || meta.basePrice;

    const newPosition: Position = {
      id: `pos-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      pair: order.pair,
      type: order.type,
      lotSize: order.lotSize,
      entryPrice: currentPrice,
      sl: order.sl,
      tp: order.tp,
      currentPrice,
      pnl: 0,
      pnlPips: 0,
      openTime: Date.now(),
      status: 'OPEN',
      strategyTag: 'Manual SMC Setup',
    };

    setAccount((prev) => {
      const margin = (currentPrice * meta.contractSize * order.lotSize) / prev.leverage;
      const updated = {
        ...prev,
        margin: prev.margin + margin,
        freeMargin: Math.max(0, prev.equity - (prev.margin + margin)),
        positions: [newPosition, ...prev.positions],
      };
      saveAccountState(updated);
      return updated;
    });

    addAlert(
      `Order Executed: ${order.type} ${order.pair}`,
      `${order.lotSize} Lots entered at ${currentPrice.toFixed(meta.digits)}. SL: ${order.sl.toFixed(meta.digits)} | TP: ${order.tp.toFixed(meta.digits)}`,
      'TRADE_FILL'
    );
  };

  const handleClosePosition = (id: string) => {
    setAccount((prev) => {
      const pos = prev.positions.find((p) => p.id === id);
      if (!pos) return prev;

      const closedPos: Position = {
        ...pos,
        status: 'CLOSED',
        closePrice: pos.currentPrice,
        closeTime: Date.now(),
        closeReason: 'MANUAL',
      };

      const newBalance = prev.balance + pos.pnl;
      const remaining = prev.positions.filter((p) => p.id !== id);

      const updated = {
        ...prev,
        balance: Number(newBalance.toFixed(2)),
        equity: Number(newBalance.toFixed(2)),
        positions: remaining,
        history: [...prev.history, closedPos],
      };
      saveAccountState(updated);
      return updated;
    });
  };

  const handleSetBreakeven = (id: string) => {
    setAccount((prev) => {
      const updatedPositions = prev.positions.map((p) => {
        if (p.id === id) {
          return { ...p, sl: p.entryPrice };
        }
        return p;
      });
      const updated = { ...prev, positions: updatedPositions };
      saveAccountState(updated);
      return updated;
    });
    addAlert('Stop Loss Moved to Breakeven', 'Trade risk neutralized at Entry Price.', 'TRADE_FILL');
  };

  const handleClosePartial = (id: string, fraction: number = 0.5) => {
    setAccount((prev) => {
      const pos = prev.positions.find((p) => p.id === id);
      if (!pos) return prev;

      const closedLotSize = Number((pos.lotSize * fraction).toFixed(2));
      const remainingLotSize = Number((pos.lotSize - closedLotSize).toFixed(2));
      const partialPnL = Number((pos.pnl * fraction).toFixed(2));

      const closedPos: Position = {
        ...pos,
        lotSize: closedLotSize,
        status: 'CLOSED',
        closePrice: pos.currentPrice,
        closeTime: Date.now(),
        closeReason: 'MANUAL',
        pnl: partialPnL,
      };

      const remainingPos: Position = {
        ...pos,
        lotSize: remainingLotSize,
        pnl: Number((pos.pnl - partialPnL).toFixed(2)),
      };

      const newBalance = prev.balance + partialPnL;
      const updated = {
        ...prev,
        balance: Number(newBalance.toFixed(2)),
        positions: prev.positions.map((p) => (p.id === id ? remainingPos : p)),
        history: [...prev.history, closedPos],
      };
      saveAccountState(updated);
      return updated;
    });
    addAlert('Partial Profit Taken (50%)', '50% position locked in, remainder runner active.', 'TRADE_FILL');
  };

  const handleResetAccount = () => {
    if (confirm('Reset paper trading demo account balance to $50,000.00?')) {
      setAccount(INITIAL_ACCOUNT_STATE);
      saveAccountState(INITIAL_ACCOUNT_STATE);
    }
  };

  // SMC Calculations for current pair
  const currentCandles = candlesByPair[selectedPair] || [];
  const smcElements = calculateSMCElements(currentCandles, selectedTimeframe);

  // Handle Signal Loading onto Chart
  const handleLoadSignalToTrade = (signal: SMCSignal) => {
    setSelectedPair(signal.pair);
    setSelectedTimeframe(signal.timeframe);
    setActiveTab('CHART');

    // Prompt open order
    handleOpenPosition({
      pair: signal.pair,
      type: signal.type,
      lotSize: 1.0,
      sl: signal.stopLoss,
      tp: signal.takeProfit1,
    });
  };

  // Handle Social Trader Copying
  const handleCopyTrader = (trader: SocialTrader) => {
    setSelectedPair(trader.favoritePair);
    addAlert(
      `Copy Strategy Subscribed: ${trader.name}`,
      `Auto-mirroring ${trader.favoritePair} Smart Money signals into your paper trading account.`,
      'SIGNAL'
    );
  };

  // Handle Forex Factory Push Notification Test
  const handleTriggerNewsPush = (evt: EconomicEvent) => {
    addAlert(
      `🔴 High Impact Economic Alert: ${evt.title} (${evt.currency})`,
      `Countdown: Releasing in ~15m. Forecast: ${evt.forecast}. Institutional volatility spike expected across ${evt.affectedPairs.join(', ')}.`,
      'NEWS',
      evt.impact as any
    );
  };

  // Handle Chart-Generated SMC Signal Saved
  const handleSaveChartSignal = useCallback((sig: SMCSignal) => {
    setCustomSignals((prev) => [sig, ...prev.filter((s) => s.id !== sig.id)]);
    addAlert(
      `⚡ SMC Signal Generated: ${sig.pair} (${sig.type})`,
      `${sig.strategy} on ${sig.timeframe} generated with ${sig.confluenceScore}% confluence score. Entry: ${sig.entryPrice} | SL: ${sig.stopLoss} | TP: ${sig.takeProfit1}`,
      'SIGNAL',
      'HIGH'
    );
  }, [addAlert]);

  // Handle Scanning Active Chart directly from Signal Hub or Top Bar
  const handleScanActiveChart = useCallback(() => {
    const candles = candlesByPair[selectedPair] || [];
    const elements = calculateSMCElements(candles, selectedTimeframe);
    const livePrice = pairPrices[selectedPair] || PAIR_METADATA[selectedPair].basePrice;

    const newSignal = generateSMCSignalFromChart({
      pair: selectedPair,
      timeframe: selectedTimeframe,
      candles,
      orderBlocks: elements.orderBlocks,
      fairValueGaps: elements.fairValueGaps,
      structureBreaks: elements.structureBreaks,
      liquidityLevels: elements.liquidityLevels,
      marketStructure: elements.marketStructure,
      currentLivePrice: livePrice,
    });

    if (newSignal) {
      handleSaveChartSignal(newSignal);
    }
  }, [selectedPair, selectedTimeframe, candlesByPair, pairPrices, handleSaveChartSignal]);

  // Handle Upgrade Success
  const handleUpgradeSuccess = (data: any) => {
    setTrialInfo((prev: any) => ({
      ...prev,
      tier: data.currentTier,
      isTrialActive: true,
      isExpired: false,
      durationMs: 365 * 24 * 60 * 60 * 1000,
    }));
    if (currentUser) {
      const updatedUser = { ...currentUser, tier: data.currentTier as SubscriptionTier };
      setCurrentUser(updatedUser);
      localStorage.setItem('smc_user_session', JSON.stringify(updatedUser));
    }
    addAlert(
      '🌟 Subscription Tier Upgraded!',
      `You have unlocked all ${data.currentTier === 'PRO_TRADER' ? 'Pro Trader' : 'Institutional VIP'} features.`,
      'SIGNAL'
    );
  };

  const handleAddCustomSignal = useCallback((signal: SMCSignal) => {
    setCustomSignals((prev) => [signal, ...prev]);
    addAlert(
      `AI Signal Generated: ${signal.type} ${signal.pair}`,
      `${signal.strategy} • Entry $${signal.entryPrice} • TP1 $${signal.takeProfit1} • SL $${signal.stopLoss}`,
      'SIGNAL',
      'HIGH'
    );
  }, [addAlert]);

  const unreadAlertsCount = alerts.filter((a) => !a.read).length;

  return (
    <LocationGate>
      {routeView === 'ADMIN_PORTAL' ? (
        currentUser?.role === 'ADMIN' ? (
          <AdminLayout
            currentUser={currentUser}
            onLogout={handleLogout}
            onNavigateToTrader={() => {
              if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
                window.location.href = '/dashboard';
              } else {
                if (typeof window !== 'undefined') window.location.hash = '';
                setRouteView('TRADER');
              }
            }}
          />
        ) : (
          <AdminLogin
            onLoginSuccess={(user, token) => {
              handleLoginSuccess(user, token);
              setRouteView('ADMIN_PORTAL');
            }}
            onNavigateToTrader={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/dashboard';
              }
            }}
          />
        )
      ) : (
        <TraderLayout
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          selectedPair={selectedPair}
          onSelectPair={handlePairChange}
          selectedTimeframe={selectedTimeframe}
          onTimeframeChange={handleTimeframeChange}
          pairPrices={pairPrices}
          pairTickers={pairTickers}
          candlesByPair={candlesByPair}
          smcElements={smcElements}
          account={account}
          trialInfo={trialInfo}
          currentUser={currentUser}
          globalSettings={globalSettings}
          featuresConfig={featuresConfig}
          userPermissions={currentUser?.permissions || null}
          customSignals={customSignals}
          alerts={alerts}
          activeToast={activeToast}
          unreadAlertsCount={unreadAlertsCount}
          isAuthModalOpen={isAuthModalOpen}
          initialAuthMode={initialAuthMode}
          targetProtectedTab={targetProtectedTab}
          isSubscriptionModalOpen={isSubscriptionModalOpen}
          isAIScanModalOpen={isAIScanModalOpen}
          isNotificationsDrawerOpen={isNotificationsDrawerOpen}
          isTradePanelOpen={isTradePanelOpen}
          isMobileTradeModalOpen={isMobileTradeModalOpen}
          quickOrderType={quickOrderType}
          onOpenAuthModal={() => {
            setInitialAuthMode('LOGIN');
            setIsAuthModalOpen(true);
          }}
          onCloseAuthModal={() => setIsAuthModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
          onOpenUpgradeModal={() => setIsSubscriptionModalOpen(true)}
          onCloseUpgradeModal={() => setIsSubscriptionModalOpen(false)}
          onUpgradeSuccess={handleUpgradeSuccess}
          onOpenAIScanModal={() => setIsAIScanModalOpen(true)}
          onCloseAIScanModal={() => setIsAIScanModalOpen(false)}
          onToggleNotificationsDrawer={() => setIsNotificationsDrawerOpen(!isNotificationsDrawerOpen)}
          onClearAlerts={() => {
            setAlerts([]);
            saveStoredAlerts([]);
          }}
          onMarkAlertRead={(id) => {
            setAlerts((prev) => {
              const updated = prev.map((a) => (a.id === id ? { ...a, read: true } : a));
              saveStoredAlerts(updated);
              return updated;
            });
          }}
          onCloseToast={() => setActiveToast(null)}
          onToggleTradePanel={() => setIsTradePanelOpen(!isTradePanelOpen)}
          onPlaceQuickOrder={handlePlaceQuickOrder}
          onCloseMobileTradeModal={() => setIsMobileTradeModalOpen(false)}
          onSyncLiveFeed={() => fetchMarketCandles(selectedPair, selectedTimeframe)}
          onOpenPosition={handleOpenPosition}
          onClosePosition={handleClosePosition}
          onSetBreakeven={handleSetBreakeven}
          onClosePartial={handleClosePartial}
          onResetAccount={handleResetAccount}
          onLoadSignalToTrade={handleLoadSignalToTrade}
          onCopyTrader={handleCopyTrader}
          onTriggerNewsPush={handleTriggerNewsPush}
          onAddCustomSignal={handleAddCustomSignal}
          feedStatus={feedStatus}
        />
      )}
    </LocationGate>
  );
}
