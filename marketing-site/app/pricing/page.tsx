import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CheckCircle, Star, Zap, Crown, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'SMC SIGNAL pricing plans — Free Trial, Pro Trader, and Institutional VIP. Start free and upgrade when you are ready.',
};

const plans = [
  {
    id: 'free',
    name: 'Free Trial',
    tier: 'FREE_TRIAL',
    icon: Zap,
    color: '#9CA3AF',
    price: 'Free',
    period: '',
    description: 'Get started with core charting and market news at no cost.',
    features: [
      'Live Charts (1H, 4H, 1D)',
      'Forex Factory Calendar',
      'Basic Performance Analytics',
      'Social Community Hub',
      'Trader Profile',
    ],
    cta: 'Get Started Free',
    href: '/signup',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro Trader',
    tier: 'PRO_TRADER',
    icon: Star,
    color: '#00FFA3',
    price: 'Contact Us',
    period: 'monthly',
    description: 'Full multi-timeframe analytical suite & paper trading for active traders.',
    features: [
      'Full Paper Trading Desk ($50,000 balance)',
      'All 6 Timeframes (1m–1D)',
      'AI Scan Confluence Engine',
      'Quantitative Backtesting',
      'Advanced Order Block Detection',
      'Full Performance Analytics & Journal',
      'Everything in Free Trial',
    ],
    cta: 'Get Pro Access',
    href: '/contact',
    popular: true,
  },
  {
    id: 'vip',
    name: 'Institutional VIP',
    tier: 'INSTITUTIONAL_VIP',
    icon: Crown,
    color: '#A855F7',
    price: 'Contact Us',
    period: 'monthly',
    description: 'Complete institutional package with exclusive live SMC Signals Hub.',
    features: [
      'Exclusive Institutional SMC Signals Hub',
      'Admin-Published Live Setups (Entry, SL, TP1, TP2)',
      'Real-Time Signal Push Alerts',
      'Everything in Pro Trader (Paper Trading & AI Scan)',
      'VIP Community Access',
      'Priority Customer Support',
      'Dedicated Onboarding',
    ],
    cta: 'Apply for VIP',
    href: '/contact',
    popular: false,
  },
];

const comparison = [
  { feature: 'Live Charts', free: '1H, 4H, 1D', pro: 'All 6 TFs', vip: 'All 6 TFs' },
  { feature: 'Paper Trading Desk', free: false, pro: true, vip: true },
  { feature: 'Institutional SMC Signals Hub', free: false, pro: false, vip: true },
  { feature: 'AI Scan Confluence Engine', free: false, pro: true, vip: true },
  { feature: 'Quantitative Backtester', free: false, pro: true, vip: true },
  { feature: 'Forex Factory Calendar', free: true, pro: true, vip: true },
  { feature: 'Performance Analytics', free: 'Basic', pro: 'Full', vip: 'Full' },
  { feature: 'VIP Community & Alerts', free: false, pro: false, vip: true },
  { feature: 'Priority Support', free: false, pro: false, vip: true },
];

function Cell({ val }: { val: boolean | string }) {
  if (typeof val === 'boolean') {
    return val
      ? <CheckCircle className="w-5 h-5 text-[#00FFA3] mx-auto" />
      : <span className="text-gray-700 mx-auto block text-center">—</span>;
  }
  return <span className="text-sm text-gray-300 text-center block">{val}</span>;
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0A0B0D]">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-[#00FFA3] tracking-widest uppercase mb-3">Plans & Pricing</p>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-5">
              Choose Your Trading Level
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto">
              Start for free. Upgrade when you are ready for the full analytical suite.
              All paid upgrades are processed manually by our team via UPI / Crypto.
            </p>
          </div>

          {/* Plan Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {plans.map((p) => (
              <div
                key={p.id}
                id={`plan-${p.id}`}
                className={`relative glass-card p-7 flex flex-col feature-card ${
                  p.popular ? 'ring-1 ring-[#00FFA3]/40 shadow-lg shadow-[#00FFA3]/5' : ''
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 text-xs font-bold bg-[#00FFA3] text-[#0A0B0D] rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: `${p.color}12`, border: `1px solid ${p.color}25` }}
                >
                  <p.icon className="w-5 h-5" style={{ color: p.color }} />
                </div>
                <div className="mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: p.color }}>
                    {p.name}
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-3xl font-black text-white">{p.price}</span>
                  {p.period && <span className="text-sm text-gray-500">/{p.period}</span>}
                </div>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">{p.description}</p>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: p.color }} />
                      <span className="text-sm text-gray-300">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={p.href}
                  id={`cta-${p.id}`}
                  className={`w-full py-3 text-sm font-bold rounded-xl text-center transition-all ${
                    p.popular
                      ? 'btn-primary'
                      : p.id === 'vip'
                      ? 'border border-purple-500/40 text-purple-400 hover:bg-purple-500/10'
                      : 'btn-outline'
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>

          {/* Feature Comparison */}
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-5 border-b border-[#1E2433]">
              <h2 className="text-lg font-black text-white">Feature Comparison</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1E2433]">
                    <th className="text-left py-3 px-6 text-gray-500 font-semibold">Feature</th>
                    {plans.map(p => (
                      <th key={p.id} className="py-3 px-4 text-center font-bold" style={{ color: p.color }}>
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row, i) => (
                    <tr
                      key={row.feature}
                      className={`border-b border-[#1E2433]/50 ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}
                    >
                      <td className="py-3.5 px-6 text-gray-300 font-medium">{row.feature}</td>
                      <td className="py-3.5 px-4"><Cell val={row.free} /></td>
                      <td className="py-3.5 px-4"><Cell val={row.pro} /></td>
                      <td className="py-3.5 px-4"><Cell val={row.vip} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment note */}
          <div className="mt-10 p-5 bg-amber-900/10 border border-amber-800/30 rounded-xl">
            <p className="text-sm text-amber-600/80 text-center">
              <strong className="text-amber-500">Payment Process:</strong>{' '}
              Pro Trader and Institutional VIP plans are activated manually. After contacting us, you will be guided through a secure UPI/Crypto payment process. Your plan will be activated within 24 hours of verified payment.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
