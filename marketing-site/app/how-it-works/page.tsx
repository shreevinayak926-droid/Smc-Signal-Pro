import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { UserPlus, Settings2, ScanSearch, BarChart2, ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How It Works',
  description: 'Learn how SMC SIGNAL works — from account setup to detecting institutional setups and paper trading your first SMC entry.',
};

const phases = [
  {
    n: '01',
    icon: UserPlus,
    title: 'Create Account & Verify Email',
    color: '#00FFA3',
    desc: 'Register with your email address. After verification, your account is activated and you gain access to the full platform.',
    bullets: [
      'Quick registration — name, email, password',
      'Verification email sent automatically',
      'One-click email confirmation',
      'Instant access after verification',
    ],
  },
  {
    n: '02',
    icon: Settings2,
    title: 'Configure Your Workspace',
    color: '#A855F7',
    desc: 'Personalise the trading environment to match your strategy: choose pairs, set risk parameters, and select your primary timeframes.',
    bullets: [
      'Choose from Forex, Gold, Indices, Crypto pairs',
      'Set preferred risk per trade in %',
      'Configure paper trading account balance',
      'Select default chart timeframe',
    ],
  },
  {
    n: '03',
    icon: ScanSearch,
    title: 'SMC Structure Mapping',
    color: '#00FFA3',
    desc: 'The algorithm continuously analyzes price action and automatically maps institutional structures onto your charts.',
    bullets: [
      'Order blocks marked at swing highs & lows',
      'FVG zones highlighted across timeframes',
      'CHoCH & BOS annotations drawn automatically',
      'Liquidity pools identified and labelled',
      'AI Scan surfaces highest-confluence setups',
    ],
  },
  {
    n: '04',
    icon: BarChart2,
    title: 'Trade, Review & Refine',
    color: '#FFD700',
    desc: 'Execute in the paper trading simulator with zero real capital risk, review your performance analytics, and continuously improve your decision-making.',
    bullets: [
      'Place buy/sell orders with SL and TP',
      'Track open positions and floating P&L',
      'Review closed trade statistics in the journal',
      'Analyse win rate, drawdown, and R:R ratio',
      'Iterate your strategy based on real data',
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#0A0B0D]">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-[#00FFA3] tracking-widest uppercase mb-3">Simple Process</p>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-5">
              From Signup to Your First Signal
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto">
              Four straightforward phases take you from a blank chart to executing high-probability SMC setups — all risk-free.
            </p>
          </div>

          {/* Phases */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-[#00FFA3]/30 via-[#A855F7]/20 to-transparent hidden md:block" />

            <div className="space-y-10">
              {phases.map((p, i) => (
                <div key={p.n} className="relative md:pl-20">
                  {/* Step number */}
                  <div
                    className="absolute left-0 top-0 w-12 h-12 rounded-2xl flex items-center justify-center hidden md:flex z-10"
                    style={{ background: `${p.color}12`, border: `1px solid ${p.color}30` }}
                  >
                    <p.icon className="w-5 h-5" style={{ color: p.color }} />
                  </div>

                  <div className="glass-card p-6 sm:p-8">
                    <div className="flex items-start gap-4 mb-5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 md:hidden"
                        style={{ background: `${p.color}12`, border: `1px solid ${p.color}30` }}
                      >
                        <p.icon className="w-5 h-5" style={{ color: p.color }} />
                      </div>
                      <div>
                        <span className="text-xs font-bold font-mono" style={{ color: p.color }}>Phase {p.n}</span>
                        <h2 className="text-xl font-black text-white mt-0.5">{p.title}</h2>
                      </div>
                    </div>
                    <p className="text-gray-400 mb-5 leading-relaxed">{p.desc}</p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {p.bullets.map((b) => (
                        <div key={b} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: p.color }} />
                          <span className="text-sm text-gray-300">{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <Link href="/signup" className="px-8 py-4 text-base font-bold rounded-xl btn-primary inline-flex items-center gap-2">
              Start Your Journey <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
