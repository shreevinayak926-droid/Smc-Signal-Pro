import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  LineChart, Zap, Activity, BookOpen, BarChart2,
  Calendar, TrendingUp, Users, CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Features',
  description:
    'Explore SMC SIGNAL\'s 8 core features: Live Charts, SMC Signals, AI Scan, Backtesting, Paper Trading, Forex Factory Calendar, Analytics, and Social Trading.',
};

const features = [
  {
    icon: LineChart,
    title: 'Live Charts',
    color: '#00FFA3',
    desc: 'Multi-timeframe candlestick charts with institutional SMC overlays for Forex, Gold, Indices & Crypto.',
    details: [
      'Six timeframes: 1m, 5m, 15m, 1H, 4H, 1D',
      'Lightweight, real-time candlestick rendering',
      'Dynamic support & resistance zones',
      'Automatic SMC structure overlays',
      'Price ticker with 24h change data',
    ],
  },
  {
    icon: Zap,
    title: 'SMC Signals',
    color: '#00FFA3',
    desc: 'Automated detection of the most powerful Smart Money Concept patterns used by institutional traders.',
    details: [
      'Order Block (OB) detection — bullish & bearish',
      'Fair Value Gap (FVG) identification',
      'Change of Character (CHoCH) alerts',
      'Break of Structure (BOS) signals',
      'Liquidity Sweep & pool detection',
    ],
  },
  {
    icon: Activity,
    title: 'AI Scan',
    color: '#A855F7',
    desc: 'Confluences scanner that monitors multiple timeframes simultaneously to surface the highest-probability institutional setups.',
    details: [
      'Multi-timeframe confluence analysis',
      'Institutional setup probability scoring',
      'Real-time scanning across multiple pairs',
      'Automated signal alerts',
      'Context-aware trade bias detection',
    ],
  },
  {
    icon: BookOpen,
    title: 'Backtesting Engine',
    color: '#00FFA3',
    desc: 'Test your trading strategies against historical data with quantitative performance metrics.',
    details: [
      'Historical data replay across timeframes',
      'Win rate & loss rate calculation',
      'Profit factor & expectancy metrics',
      'Maximum drawdown analysis',
      'Strategy comparison tools',
    ],
  },
  {
    icon: BarChart2,
    title: 'Paper Trading Desk',
    color: '#FFD700',
    desc: 'Practice executing SMC setups with zero financial risk using a simulated $10,000 trading account.',
    details: [
      '$10,000 simulated starting balance',
      'Market & limit order execution',
      'Stop-loss & take-profit (TP1/TP2) management',
      'Lot-size & leverage configurator',
      'Open P&L and position tracker',
      'Support for custom trading pairs',
    ],
  },
  {
    icon: Calendar,
    title: 'Forex Factory Calendar',
    color: '#00FFA3',
    desc: 'Integrated live economic calendar showing high-impact events that move markets — with live countdowns.',
    details: [
      'NFP, CPI, FOMC, rate decisions',
      'Impact rating: High / Medium / Low',
      'Live countdown to next event',
      'Actual vs Forecast vs Previous data',
      'Currency filter by affected pairs',
    ],
  },
  {
    icon: TrendingUp,
    title: 'Performance Analytics',
    color: '#00FFA3',
    desc: 'Comprehensive trade journal and analytics dashboard to track, review, and improve your trading discipline.',
    details: [
      'Automated trade journal',
      'Win/loss distribution charts',
      'Risk-reward ratio analysis',
      'Account growth curves',
      'Daily & weekly performance summaries',
    ],
  },
  {
    icon: Users,
    title: 'Social & Profiles',
    color: '#A855F7',
    desc: 'Connect with the SMC trading community, share ideas, and build your public trading profile.',
    details: [
      'Public trader profile & leaderboard',
      'Trade idea sharing & discussion',
      'Performance badges & milestones',
      'Community watchlists',
      'Follow top-performing traders',
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#0A0B0D]">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-[#00FFA3] tracking-widest uppercase mb-3">Platform Features</p>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-5">
              Built for Serious Traders
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Eight integrated tools, all grounded in Smart Money Concepts, designed to give you an analytical edge from session open to close.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="space-y-8">
            {features.map((f, idx) => (
              <div
                key={f.title}
                className={`glass-card p-6 sm:p-8 grid md:grid-cols-2 gap-8 items-start feature-card ${
                  idx % 2 === 1 ? 'md:grid-flow-dense' : ''
                }`}
              >
                <div className={idx % 2 === 1 ? 'md:col-start-2' : ''}>
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: `${f.color}12`, border: `1px solid ${f.color}25` }}
                  >
                    <f.icon className="w-6 h-6" style={{ color: f.color }} />
                  </div>
                  <h2 className="text-xl font-black text-white mb-3">{f.title}</h2>
                  <p className="text-gray-400 leading-relaxed mb-4">{f.desc}</p>
                </div>
                <div className={idx % 2 === 1 ? 'md:col-start-1 md:row-start-1' : ''}>
                  <div className="bg-[#0A0B0D] rounded-xl border border-[#1E2433] p-5">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Key Capabilities</p>
                    <ul className="space-y-2.5">
                      {f.details.map((d) => (
                        <li key={d} className="flex items-start gap-2.5">
                          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: f.color }} />
                          <span className="text-sm text-gray-300">{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <Link href="/signup" className="px-8 py-4 text-base font-bold rounded-xl btn-primary inline-flex items-center gap-2">
              Start Using These Features Free
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
