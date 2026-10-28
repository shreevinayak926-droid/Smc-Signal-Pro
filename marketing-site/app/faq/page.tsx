'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ChevronDown, Search } from 'lucide-react';

const faqs = [
  {
    q: 'What is Smart Money Concepts (SMC)?',
    a: 'Smart Money Concepts is a price action methodology focused on identifying the footprints of institutional traders (banks, hedge funds). It analyses structures like Order Blocks, Fair Value Gaps, Liquidity Sweeps, Break of Structure (BOS), and Change of Character (CHoCH) to anticipate where institutional orders may be entered or exited.',
  },
  {
    q: 'Does SMC SIGNAL provide financial advice or guaranteed returns?',
    a: 'No. SMC SIGNAL provides analytical and educational tools only. Nothing on this platform constitutes financial advice, investment recommendations, or a guarantee of profits. All trading involves substantial risk of capital loss. Always conduct your own research and consider your financial situation before risking real money.',
  },
  {
    q: 'Which markets and asset classes can I analyze?',
    a: 'You can analyze Forex majors (EURUSD, GBPUSD, USDJPY), Commodities (XAUUSD — Gold/Silver), Indices (US30 — Dow Jones), and Cryptocurrencies (BTCUSD). The platform will be expanded with additional pairs based on user demand.',
  },
  {
    q: 'How does Paper Trading work?',
    a: 'Paper Trading is an advanced simulated trading environment available on Pro Trader and Institutional VIP plans. You start with a virtual $50,000 account and can place buy/sell orders, set stop-losses and take-profits, and track your P&L with zero real financial risk.',
  },
  {
    q: 'What is Global Free Access?',
    a: 'Global Free Access is an admin-controlled feature that, when enabled, grants all registered and email-verified users access to premium platform features at no cost for the duration it is active. It is controlled by the SMC Signal administrator and can be toggled on or off at any time. You must have a verified account to benefit from this feature.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. Authentication, data storage, and Row Level Security (RLS) are handled by Supabase — a secure, open-source backend-as-a-service. Your password is never stored in plain text. Session tokens are managed securely per industry standards.',
  },
  {
    q: 'Can I access SMC SIGNAL on mobile, tablet, and desktop?',
    a: 'Yes. The trading dashboard is built with React and is fully responsive for web browsers. It is also packaged as a native mobile app (Android & iOS via Capacitor) and a desktop application (Windows via Electron). The marketing website supports all devices.',
  },
  {
    q: 'How do I upgrade from Free Trial to Pro or VIP?',
    a: 'Contact us via the Contact page or through our Telegram community. We will guide you through the payment process (UPI or USDT/Crypto). Once payment is verified, your account will be upgraded within 24 hours.',
  },
  {
    q: 'What happens to my account if my subscription expires?',
    a: 'If your subscription expires, your account will revert to Free Trial tier access. Your trade history, profile, and analytics will be preserved. You will retain access to live charts and economic calendar tools, and can reactivate Paper Trading and VIP SMC Signals at any time by renewing.',
  },
  {
    q: 'How accurate is the SMC signal detection?',
    a: 'The algorithm applies rule-based SMC pattern detection across price data. As with all technical analysis tools, signals are probabilistic — not deterministic. Performance varies with market conditions. We strongly recommend backtesting any strategy before live trading and using paper trading to build confidence.',
  },
];

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(0);
  const [search, setSearch] = useState('');

  const filtered = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0A0B0D]">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-[#00FFA3] tracking-widest uppercase mb-3">Support</p>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-5">Frequently Asked Questions</h1>
            <p className="text-gray-400 mb-8">Everything you need to know about SMC SIGNAL.</p>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                id="faq-search"
                placeholder="Search questions…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 input-dark text-sm"
              />
            </div>
          </div>

          {/* FAQ Items */}
          <div className="space-y-2">
            {filtered.length === 0 && (
              <p className="text-center text-gray-500 py-8">No results found for &ldquo;{search}&rdquo;</p>
            )}
            {filtered.map((item, i) => (
              <div key={i} className="glass-card overflow-hidden">
                <button
                  id={`faq-item-${i}`}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
                  onClick={() => setOpen(open === i ? null : i)}
                  aria-expanded={open === i}
                >
                  <span className="text-sm font-semibold text-white pr-4">{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 flex-shrink-0 text-[#00FFA3] transition-transform duration-200 ${
                      open === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {open === i && (
                  <div className="px-5 pb-5 border-t border-[#1E2433]/60">
                    <p className="text-sm text-gray-400 leading-relaxed pt-4">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-500 text-sm mb-3">Still have questions?</p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 text-[#00FFA3] font-semibold text-sm hover:underline"
            >
              Contact our team →
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
