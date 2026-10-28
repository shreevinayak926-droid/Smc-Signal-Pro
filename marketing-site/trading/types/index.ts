export type ForexPair = 'XAUUSD' | 'EURUSD' | 'GBPUSD' | 'USDJPY' | 'BTCUSD' | 'US30' | string;

export type TimeFrame = '1m' | '5m' | '15m' | '1H' | '4H' | '1D';

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderBlock {
  id: string;
  type: 'BULLISH' | 'BEARISH';
  top: number;
  bottom: number;
  startIndex: number;
  endIndex?: number;
  mitigated: boolean;
  timeframe: TimeFrame;
  strength: 'STRONG' | 'MODERATE';
}

export interface FairValueGap {
  id: string;
  type: 'BULLISH' | 'BEARISH';
  top: number;
  bottom: number;
  midline: number;
  startIndex: number;
  endIndex?: number;
  candle1Index?: number;
  candle2Index?: number;
  candle3Index?: number;
  isActive?: boolean;
  filled: boolean;
  timeframe: TimeFrame;
}

export type MarketStructure = 'BULLISH' | 'BEARISH';

export interface SwingPoint {
  index: number;
  type: 'HIGH' | 'LOW';
  price: number;
  time: number;
}

export interface StructureBreak {
  id: string;
  type: 'BOS' | 'CHoCH';
  direction: 'BULLISH' | 'BEARISH';
  price: number;
  index: number;
  label: string;
  brokenSwingIndex?: number;
  brokenLevel?: number;
  candle1Index?: number;
  candle2Index?: number;
  candle1Close?: number;
  candle2Close?: number;
  confirmed?: boolean;
}

export interface LiquidityLevel {
  id: string;
  type: 'BUY_SIDE' | 'SELL_SIDE';
  price: number;
  swept: boolean;
  label: string;
}

export interface Position {
  id: string;
  pair: ForexPair;
  type: 'BUY' | 'SELL';
  lotSize: number;
  entryPrice: number;
  sl: number;
  tp: number;
  tp2?: number;
  currentPrice: number;
  pnl: number;
  pnlPips: number;
  openTime: number;
  status: 'OPEN' | 'CLOSED';
  closePrice?: number;
  closeTime?: number;
  closeReason?: 'TP' | 'TP2' | 'SL' | 'MANUAL' | 'TRAILING_SL';
  strategyTag?: string;
}

export interface AccountState {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  leverage: number;
  positions: Position[];
  history: Position[];
}

export interface BacktestConfig {
  pair: ForexPair;
  timeframe: TimeFrame;
  strategy: 'ICT_SILVER_BULLET' | 'FVG_OB_RETEST' | 'LIQUIDITY_SWEEP_CHOCH' | 'LONDON_BREAKOUT' | 'ASIAN_RANGE_SWEEP';
  lookbackCandles: number;
  riskRewardTarget: number;
  riskPerTradePct: number;
  useTrailingStop: boolean;
  filterHighImpactNews: boolean;
}

export interface BacktestTrade {
  id: string;
  entryTime: number;
  exitTime: number;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  sl: number;
  tp: number;
  result: 'WIN' | 'LOSS';
  pnl: number;
  rr: number;
  reason: string;
}

export interface BacktestResult {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  netProfitUSD: number;
  profitFactor: number;
  maxDrawdownPct: number;
  averageRR: number;
  sharpeRatio: number;
  equityCurve: { tradeNum: number; equity: number; time: string }[];
  trades: BacktestTrade[];
}

export interface EconomicEvent {
  id: string;
  title: string;
  country: string;
  currency: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW' | 'NON-ECONOMIC';
  datetime: string;
  timestamp: number;
  forecast: string;
  previous: string;
  actual: string | null;
  marketSentiment: string;
  affectedPairs: string[];
  analysis?: string;
  hasNotified?: boolean;
}

export interface SMCSignal {
  id: string;
  pair: ForexPair;
  type: 'BUY' | 'SELL';
  timeframe: TimeFrame;
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  riskReward: string;
  confluenceScore?: number;
  confidence?: number;
  chartImageUrl?: string;
  strategy: string;
  confluences?: string[];
  marketPhase?: string;
  status: 'ACTIVE' | 'TRIGGERED' | 'EXPIRED' | 'TARGET_HIT' | 'CLOSED' | 'TP1_HIT' | 'TP2_HIT' | 'SL_HIT' | string;
  timestamp: number;
  tierRequired: 'FREE_TRIAL' | 'PRO_TRADER' | 'INSTITUTIONAL_VIP';
  analysis?: string;
}

export interface SocialTrader {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  rank: number;
  badge: 'INSTITUTIONAL' | 'PROP_FUNDED' | 'ALGO_BOT' | 'SMC_MASTER';
  verifiedWinRate: string;
  monthlyROI: string;
  totalProfitUSD: string;
  copiersCount: number;
  favoritePair: ForexPair;
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH';
  strategyDescription: string;
  equityHistory: number[];
  currentOpenTrades: number;
  isCopied?: boolean;
}

export type SubscriptionTier = 'FREE_TRIAL' | 'PRO_TRADER' | 'INSTITUTIONAL_VIP';

export interface TrialInfo {
  deviceFingerprint: string;
  startTime: number;
  durationMs: number;
  isTrialActive: boolean;
  isExpired: boolean;
  remainingMs: number;
  formattedRemaining: string;
  tier: SubscriptionTier;
}

export interface PushAlert {
  id: string;
  title: string;
  message: string;
  type: 'NEWS' | 'SIGNAL' | 'TRADE_FILL' | 'TRIAL_EXPIRY';
  timestamp: number;
  impact?: 'HIGH' | 'MEDIUM' | 'LOW';
  read: boolean;
}

export interface PairTickerInfo {
  price: number;
  change24h: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  lastUpdated: number;
}

export type UserRole = 'USER' | 'ADMIN';

export interface UserPermissions {
  tradingAccess: boolean;
  buyAccess: boolean;
  sellAccess: boolean;
  fvgAccess: boolean;
  chochAccess: boolean;
  aiScanAccess: boolean;
  pineScriptAccess: boolean;
  tradingViewAccess: boolean;
  indicatorAccess: boolean;
  marketDataAccess: boolean;
  vipFeatures: boolean;
  advancedAnalysis: boolean;
  adminAccess: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tier: SubscriptionTier;
  status: 'ACTIVE' | 'BANNED';
  createdAt: number;
  lastLoginAt?: number;
  subscriptionExpiresAt?: number;
  token?: string;
  permissions?: UserPermissions;
  emailVerified?: boolean;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
  requireVerification?: boolean;
  email?: string;
  devOtp?: string;
  needsEmailVerification?: boolean;
}

export interface GlobalAppSettings {
  globalFreeAccess?: boolean;
  enforceEmailVerification?: boolean;
  tradingEnabled: boolean;
  aiScanEnabled: boolean;
  fvgEnabled: boolean;
  chochEnabled: boolean;
  pineScriptEnabled: boolean;
  tradingViewEnabled: boolean;
  indicatorsEnabled: boolean;
  vipEnabled: boolean;
  marketDataEnabled: boolean;
  notificationsEnabled: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  appName: string;
  defaultTimeframe: TimeFrame;
  maxLotSize: number;
  maxLeverage: number;
}

export interface PaymentSettings {
  upiId: string;
  payeeName: string;
  qrCodeUrl: string;
  conversionRateUSDToINR: number;
  gstPercentage: number;
}

export interface PaymentProofRequest {
  id: string;
  userId?: string;
  userEmail: string;
  userName?: string;
  planId: 'PRO_TRADER' | 'INSTITUTIONAL_VIP' | string;
  planName: string;
  priceUSD: number;
  conversionRate: number;
  baseAmountINR: number;
  gstAmountINR: number;
  totalAmountINR: number;
  utrNumber: string;
  screenshotUrl: string;
  submittedAt: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  approvedAt?: number;
  deviceFingerprint?: string;
  appliedCoupon?: string;
  discountAmountUSD?: number;
  discountAmountINR?: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  code?: SubscriptionTier | 'BASIC' | 'FREE' | string;
  tier?: SubscriptionTier;
  priceUSD: number;
  priceINR?: number;
  durationDays?: number;
  billingPeriod?: 'monthly' | 'yearly';
  active?: boolean;
  popular?: boolean;
  features: string[];
  permissions?: Partial<UserPermissions>;
}

export type CouponDiscountType = 'PERCENTAGE' | 'FLAT_USD' | 'FLAT_INR';

export interface CouponCode {
  id: string;
  code: string; // e.g., 'SMC50', 'WELCOME20'
  description?: string;
  discountType: CouponDiscountType;
  discountValue: number; // e.g. 50 (50% or $50 or ₹500)
  active: boolean;
  expiresAt?: number | null;
  maxUses?: number | null; // Optional global cap
  usedCount: number;
  usedByEmails: string[]; // List of user emails that applied this coupon (enforces single use per email)
  createdAt: number;
}

export interface CouponValidationResult {
  valid: boolean;
  message?: string;
  coupon?: CouponCode;
  discountUSD: number;
  discountINR: number;
  finalPriceUSD: number;
  finalPriceINR: number;
}

export interface ActivityLog {
  id: string;
  timestamp: number;
  adminEmail: string;
  action: string;
  target: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  details?: string;
}

export interface AIScanSettings {
  enabled: boolean;
  provider: 'GEMINI_FLASH_3.7' | 'CLAUDE_SONNET' | 'OPENAI_GPT4O';
  confidenceThreshold: number;
  scanFrequencyMin: number;
  maxDailyRequestsPerUser: number;
  supportedSymbols: ForexPair[];
  timeframes: TimeFrame[];
  vipOnly: boolean;
}

export interface PineScriptItem {
  id: string;
  name: string;
  code: string;
  targetFeature: 'FVG' | 'CHOCH' | 'INDICATORS' | 'CUSTOM';
  enabled: boolean;
  vipOnly: boolean;
  author?: string;
  updatedAt: number;
}

export interface FVGSettings {
  enabled: boolean;
  vipOnly: boolean;
  defaultTimeframe: TimeFrame;
  minGapPips: number;
  bullishEnabled: boolean;
  bearishEnabled: boolean;
  autoMitigationCheck: boolean;
  displayMidline: boolean;
  pineScriptCode?: string;
  pineScriptId?: string;
  userAccess?: Record<string, boolean>;
}

export interface CHoCHSettings {
  enabled: boolean;
  vipOnly: boolean;
  bullishStructure: boolean;
  bearishStructure: boolean;
  requireCandleClose: boolean;
  lookbackSwings: number;
  defaultTimeframe?: TimeFrame;
  pineScriptCode?: string;
  pineScriptId?: string;
  userAccess?: Record<string, boolean>;
}

export interface IndicatorSettings {
  enabled: boolean;
  orderBlockEnabled: boolean;
  fvgEnabled: boolean;
  chochEnabled: boolean;
  liquiditySweepsEnabled: boolean;
  maEnabled: boolean;
  rsiEnabled: boolean;
  vipOnlyIndicators: string[];
}

export interface MarketDataSettings {
  primaryProvider: 'BINANCE_DIRECT' | 'OPEN_EXCHANGE' | 'YAHOO_FINANCE' | 'FOREX_FACTORY';
  refreshIntervalSec: number;
  activeSymbols: ForexPair[];
  apiKeySet: boolean;
  connectionStatus: 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED';
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  maxFailedLoginsBeforeLock: number;
  sessionTimeoutMin: number;
  activeAdminSessions: number;
  failedLoginsToday: number;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  vipUsers: number;
  freeUsers: number;
  suspendedUsers: number;
  onlineUsers: number;
  totalTrades: number;
  todayTrades: number;
  aiScansToday: number;
  apiStatus: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  systemStatus: 'HEALTHY' | 'MAINTENANCE' | 'ALERT';
  totalRevenueUSD: number;
  signalsGeneratedToday: number;
  maintenanceMode: boolean;
  confluenceThreshold: number;
}

export interface CentralFeaturesDB {
  fvg: FVGSettings;
  choch: CHoCHSettings;
  pineScripts: PineScriptItem[];
  aiScan: AIScanSettings;
  indicators: IndicatorSettings;
  marketData: MarketDataSettings;
  security: SecuritySettings;
}

export type AdminTabSection =
  | 'dashboard'
  | 'signals'
  | 'users'
  | 'payments'
  | 'subscriptions'
  | 'website'
  | 'support'
  | 'features'
  | 'settings'
  | 'security'
  | 'logs'
  | 'logout';

export interface WebsiteSettings {
  siteUrl: string;
  supportEmail: string;
  telegramUrl: string;
  announcementBannerEnabled: boolean;
  announcementBannerText: string;
  promoBadgeText: string;
  heroHeadline: string;
  heroSubheadline: string;
  freeTrialHeadline: string;
  proPlanMonthlyPrice: number;
  vipPlanMonthlyPrice: number;
  maintenanceNoticeEnabled: boolean;
  maintenanceNoticeText: string;
  lastUpdated?: number;
}

export type AdminFeatureSubSection =
  | 'fvg'
  | 'choch'
  | 'pinescripts'
  | 'indicators'
  | 'ai_scan'
  | 'tradingview'
  | 'trading_controls';

export interface SupportMessage {
  id: string;
  sender: 'USER' | 'ADMIN';
  senderRole?: 'USER' | 'ADMIN';
  senderEmail: string;
  senderName: string;
  message: string;
  timestamp: number;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  category: 'BILLING' | 'ACCOUNT' | 'SMC_SIGNALS' | 'TECHNICAL' | 'GENERAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: number;
  updatedAt: number;
  lastMessage: string;
  unreadByAdmin?: boolean;
  unreadByUser?: boolean;
  messages: SupportMessage[];
}
