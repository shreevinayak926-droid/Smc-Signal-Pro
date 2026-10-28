import Link from 'next/link';
import {
  TrendingUp, BarChart2, Zap, Activity, BookOpen, Calendar,
  LineChart, Users, ArrowRight, ChevronRight, Star, Shield,
  CheckCircle
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SMC SIGNAL — Trade Smarter with Smart Money Concepts',
  description:
    'Institutional-grade trading platform with AI-powered SMC signals, live charts, order block detection, paper trading, and backtesting. Start free today.',
};

const features = [
  {
    icon: LineChart,
    title: 'Live Charts',
    desc: 'Multi-timeframe candlestick charts across Forex, Gold, Indices & Crypto with SMC overlays.',
    color: '#00FFA3',
  },
  {
    icon: Zap,
    title: 'SMC Signals',
    desc: 'Automated detection of Order Blocks, FVGs, CHoCH, BOS, and Liquidity Sweeps.',
    color: '#00FFA3',
  },
  {
    icon: Activity,
    title: 'AI Scan',
    desc: 'Multi-timeframe confluence scanner identifying high-probability institutional setups.',
    color: '#A855F7',
  },
  {
    icon: BookOpen,
    title: 'Backtesting',
    desc: 'Historical strategy testing with win rate, profit factor, and drawdown metrics.',
    color: '#00FFA3',
  },
  {
    icon: BarChart2,
    title: 'Paper Trading',
    desc: 'Simulated $10,000 portfolio with realistic order execution and P&L tracking.',
    color: '#FFD700',
  },
  {
    icon: Calendar,
    title: 'Forex Factory',
    desc: 'Live high-impact economic calendar with NFP, CPI, FOMC and rate decision alerts.',
    color: '#00FFA3',
  },
  {
    icon: TrendingUp,
    title: 'Analytics',
    desc: 'Real-time trade journal, win-loss charts, risk-reward ratios, and growth curves.',
    color: '#00FFA3',
  },
  {
    icon: Users,
    title: 'Social Trading',
    desc: 'Community trade ideas, leaderboards, public performance badges, and trader profiles.',
    color: '#A855F7',
  },
];

const steps = [
  { n: '01', title: 'Create Your Account', desc: 'Register in 30 seconds with just your email. No credit card required to start.' },
  { n: '02', title: 'Configure Your Workspace', desc: 'Choose your preferred currency pairs, risk settings, and timeframe preferences.' },
  { n: '03', title: 'Read SMC Structure', desc: 'The algorithm maps order blocks, FVGs, and liquidity zones across all timeframes automatically.' },
  { n: '04', title: 'Execute & Track', desc: 'Paper trade setups with zero risk, track your performance, and refine your edge over time.' },
];

const DashboardPreview = () => (
  <div className="relative w-full rounded-2xl overflow-hidden border border-[#1E2433] bg-[#0E1015] shadow-2xl">
    {/* Header Bar */}
    <div className="flex items-center justify-between px-4 py-3 bg-[#12151D] border-b border-[#1E2433]">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500/70" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
        <div className="w-3 h-3 rounded-full bg-[#00FFA3]/70" />
      </div>
      <div className="flex items-center gap-2 px-3 py-1 bg-[#0A0B0D] rounded-lg border border-[#1E2433]">
        <div className="w-1.5 h-1.5 rounded-full bg-[#00FFA3] pulse-green" />
        <span className="text-xs text-gray-400 font-mono">XAUUSD • H4 • Live</span>
      </div>
      <div className="flex gap-2">
        {['1m','5m','15m','1H','4H','1D'].map(tf => (
          <span key={tf} className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${tf === '4H' ? 'bg-[#00FFA3]/20 text-[#00FFA3] font-bold' : 'text-gray-600'}`}>{tf}</span>
        ))}
      </div>
    </div>
    {/* Chart Area */}
    <div className="relative h-56 bg-[#0A0B0D] overflow-hidden">
      <svg viewBox="0 0 600 200" className="w-full h-full" preserveAspectRatio="none">
        {/* Grid */}
        {[40,80,120,160].map(y => (
          <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="#1E2433" strokeWidth="0.5" strokeDasharray="4,8" />
        ))}
        {/* Order Block */}
        <rect x="80" y="100" width="120" height="30" fill="rgba(0,255,163,0.06)" stroke="rgba(0,255,163,0.3)" strokeWidth="1" rx="2" />
        <text x="84" y="112" fill="rgba(0,255,163,0.7)" fontSize="7" fontFamily="monospace">OB BULLISH</text>
        {/* FVG Zone */}
        <rect x="340" y="60" width="80" height="20" fill="rgba(168,85,247,0.08)" stroke="rgba(168,85,247,0.3)" strokeWidth="1" rx="2" />
        <text x="344" y="72" fill="rgba(168,85,247,0.7)" fontSize="7" fontFamily="monospace">FVG</text>
        {/* Main chart line */}
        <polyline
          points="0,160 60,150 100,140 140,145 180,120 220,110 260,115 300,90 340,85 380,70 420,75 460,55 500,48 560,35 600,30"
          fill="none"
          stroke="#00FFA3"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Area under */}
        <path
          d="M0,160 60,150 100,140 140,145 180,120 220,110 260,115 300,90 340,85 380,70 420,75 460,55 500,48 560,35 600,30 600,200 0,200 Z"
          fill="url(#chartGrad)"
          opacity="0.15"
        />
        <defs>
          <linearGradient id="chartGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#00FFA3" />
            <stop offset="100%" stopColor="#00FFA3" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Signal Dot */}
        <circle cx="220" cy="110" r="5" fill="#00FFA3" />
        <circle cx="220" cy="110" r="9" fill="none" stroke="rgba(0,255,163,0.4)" strokeWidth="1.5" />
        {/* BUY Label */}
        <rect x="195" y="88" width="50" height="16" rx="4" fill="#00FFA3" />
        <text x="220" y="99" fill="#0A0B0D" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">BUY</text>
        {/* Price tag */}
        <rect x="548" y="22" width="50" height="16" rx="3" fill="rgba(0,255,163,0.15)" stroke="rgba(0,255,163,0.3)" strokeWidth="1" />
        <text x="573" y="33" fill="#00FFA3" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">2342.1</text>
      </svg>
    </div>
    {/* Bottom Stats Bar */}
    <div className="flex items-center justify-between px-4 py-2.5 bg-[#12151D] border-t border-[#1E2433]">
      <div className="flex gap-6">
        {[
          { l: 'Balance', v: '$10,000', c: 'text-white' },
          { l: 'P&L', v: '+$342.50', c: 'text-[#00FFA3]' },
          { l: 'Win Rate', v: '68%', c: 'text-[#00FFA3]' },
        ].map(s => (
          <div key={s.l}>
            <div className="text-[10px] text-gray-600 font-mono">{s.l}</div>
            <div className={`text-xs font-bold font-mono ${s.c}`}>{s.v}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <div className="px-3 py-1.5 bg-[#00FFA3]/10 border border-[#00FFA3]/30 rounded-lg text-[11px] font-bold text-[#00FFA3]">BUY</div>
        <div className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-[11px] font-bold text-red-400">SELL</div>
      </div>
    </div>
  </div>
);

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0A0B0D]">
      <Navbar />

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="relative gradient-hero pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#00FFA3 1px, transparent 1px), linear-gradient(90deg, #00FFA3 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left copy */}
            <div className="text-center lg:text-left fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00FFA3]/25 bg-[#00FFA3]/8 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00FFA3] pulse-green" />
                <span className="text-xs font-semibold text-[#00FFA3] tracking-wide">Institutional SMC Analysis Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black text-white leading-tight mb-5">
                Trade Smarter with{' '}
                <span className="text-[#00FFA3] glow-green">SMC SIGNAL</span>
              </h1>

              <p className="text-lg text-gray-400 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
                Detect institutional order blocks, fair value gaps, and liquidity sweeps in real-time.
                Practice risk-free in our paper trading simulator before putting real capital to work.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  href="/signup"
                  id="hero-signup-btn"
                  className="px-8 py-3.5 text-base font-bold rounded-xl btn-primary inline-flex items-center gap-2"
                >
                  Get Started Free <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  id="hero-login-btn"
                  className="px-8 py-3.5 text-base font-semibold rounded-xl btn-outline inline-flex items-center gap-2"
                >
                  Log In
                </Link>
              </div>

              <div className="flex items-center gap-6 mt-8 justify-center lg:justify-start">
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <CheckCircle className="w-4 h-4 text-[#00FFA3]" />
                  Free to start
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <CheckCircle className="w-4 h-4 text-[#00FFA3]" />
                  No credit card
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Shield className="w-4 h-4 text-[#00FFA3]" />
                  Secure auth
                </div>
              </div>
            </div>

            {/* Right: Dashboard preview */}
            <div className="fade-in-up delay-200">
              <DashboardPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ─── LIVE TICKER ──────────────────────────────────────── */}
      <div className="border-y border-[#1E2433]/60 bg-[#0E1015] overflow-hidden py-3">
        <div className="ticker-animation flex gap-12 whitespace-nowrap">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-12">
              {[
                { pair: 'XAUUSD', price: '2,342.10', chg: '+0.58%', up: true },
                { pair: 'EURUSD', price: '1.0892', chg: '-0.12%', up: false },
                { pair: 'GBPUSD', price: '1.2714', chg: '+0.23%', up: true },
                { pair: 'USDJPY', price: '149.82', chg: '+0.31%', up: true },
                { pair: 'BTCUSD', price: '67,420', chg: '+1.84%', up: true },
                { pair: 'US30', price: '38,912', chg: '-0.09%', up: false },
              ].map((t) => (
                <div key={t.pair} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-300 font-mono">{t.pair}</span>
                  <span className="text-xs text-gray-400 font-mono">{t.price}</span>
                  <span className={`text-xs font-semibold font-mono ${t.up ? 'text-[#00FFA3]' : 'text-red-400'}`}>
                    {t.chg}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ─── FEATURES ─────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" id="features">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-[#00FFA3] tracking-widest uppercase mb-3">Platform Features</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              Everything You Need to Trade Like an Institution
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              8 integrated tools built around Smart Money Concepts for analytical edge at every step of your trading workflow.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="feature-card glass-card p-5 group cursor-default"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${f.color}15`, border: `1px solid ${f.color}25` }}
                >
                  <f.icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/features" className="inline-flex items-center gap-2 text-sm font-semibold text-[#00FFA3] hover:gap-3 transition-all">
              Explore all features <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0E1015]/50" id="how-it-works">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-[#00FFA3] tracking-widest uppercase mb-3">Simple Process</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">From Signup to Your First Signal</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div key={s.n} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-full w-full h-px bg-gradient-to-r from-[#00FFA3]/30 to-transparent z-0" />
                )}
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-[#00FFA3]/10 border border-[#00FFA3]/20 flex items-center justify-center mb-4">
                    <span className="text-sm font-black text-[#00FFA3] font-mono">{s.n}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ───────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass-card p-10 glow-border">
            <Star className="w-8 h-8 text-[#FFD700] mx-auto mb-4" />
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              Start Trading Smarter Today
            </h2>
            <p className="text-gray-400 mb-8">
              Join traders who use SMC SIGNAL to identify institutional order flow and build consistent analytical edge.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/signup"
                id="cta-signup-btn"
                className="px-8 py-3.5 text-base font-bold rounded-xl btn-primary inline-flex items-center gap-2"
              >
                Create Free Account <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                id="cta-login-btn"
                className="px-8 py-3.5 text-base font-semibold rounded-xl btn-outline inline-flex items-center gap-2"
              >
                Log In
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
