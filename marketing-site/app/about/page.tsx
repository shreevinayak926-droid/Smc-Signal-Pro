import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { TrendingUp, Shield, Code2, Target } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about SMC SIGNAL — our philosophy, technology stack, commitment to risk management, and the team behind the platform.',
};

const values = [
  {
    icon: Target,
    title: 'Analytical Edge, Not Promises',
    desc: 'We do not promise returns, signal accuracy rates, or guaranteed profits. We provide tools for understanding institutional price action — the edge comes from the trader applying them with discipline.',
    color: '#00FFA3',
  },
  {
    icon: Shield,
    title: 'Risk Management First',
    desc: 'Every design decision is guided by one principle: protect the trader. Paper trading, stop-loss enforcement, and prominent risk disclaimers are not optional features — they are core to our mission.',
    color: '#A855F7',
  },
  {
    icon: TrendingUp,
    title: 'SMC as a Framework',
    desc: 'Smart Money Concepts is a lens for reading price action — not a magic formula. We build tools that surface institutional patterns and let traders make their own informed decisions.',
    color: '#00FFA3',
  },
  {
    icon: Code2,
    title: 'Open Technology Stack',
    desc: 'Built on React, TypeScript, Vite, Supabase, TailwindCSS, and Capacitor — battle-tested open technologies you can trust. Available as web, Android, iOS, and Windows desktop application.',
    color: '#FFD700',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0A0B0D]">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-[#00FFA3] tracking-widest uppercase mb-3">About Us</p>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-6">
              Built by Traders, for Traders
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
              SMC SIGNAL was created out of frustration with the signal-selling noise polluting retail trading.
              We wanted a platform focused on education, transparency, and genuine analytical tools rooted in
              how institutional traders actually operate.
            </p>
          </div>

          {/* Mission */}
          <div className="glass-card p-8 mb-12">
            <h2 className="text-2xl font-black text-white mb-4">Our Mission</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              To empower retail traders with the same structural analysis frameworks used by institutional
              market participants — presented in an accessible, honest, and risk-conscious platform.
            </p>
            <p className="text-gray-400 leading-relaxed">
              We believe that most retail traders fail not because markets are unfair, but because they are
              looking at price in the wrong way. SMC SIGNAL is designed to change that perspective through
              algorithmic structure mapping, pattern detection, and zero-risk paper trading practice.
            </p>
          </div>

          {/* Values */}
          <div className="grid sm:grid-cols-2 gap-6 mb-14">
            {values.map((v) => (
              <div key={v.title} className="feature-card glass-card p-6">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: `${v.color}12`, border: `1px solid ${v.color}25` }}
                >
                  <v.icon className="w-5 h-5" style={{ color: v.color }} />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{v.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>

          {/* Tech Stack */}
          <div className="glass-card p-8 mb-10">
            <h2 className="text-xl font-black text-white mb-5">Technology Stack</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[
                { name: 'React 19', role: 'UI Framework' },
                { name: 'TypeScript', role: 'Type Safety' },
                { name: 'Vite', role: 'Build Tool' },
                { name: 'Supabase', role: 'Backend & Auth' },
                { name: 'TailwindCSS', role: 'Styling' },
                { name: 'Capacitor', role: 'Mobile Apps' },
                { name: 'Electron', role: 'Desktop App' },
                { name: 'Next.js', role: 'Marketing Site' },
              ].map((t) => (
                <div key={t.name} className="bg-[#0A0B0D] rounded-xl border border-[#1E2433] p-3 text-center">
                  <div className="text-sm font-bold text-white">{t.name}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{t.role}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer repeat */}
          <div className="p-5 bg-amber-900/10 border border-amber-800/30 rounded-xl mb-10">
            <p className="text-sm text-amber-600/80 text-center">
              SMC SIGNAL is not a licensed financial advisor, broker, or investment company.
              All content and tools are for educational and informational purposes only.
              See our <Link href="/disclaimer" className="text-amber-500 hover:underline">Risk Disclaimer</Link> for full details.
            </p>
          </div>

          <div className="text-center">
            <Link href="/contact" className="px-8 py-3.5 text-sm font-bold rounded-xl btn-primary inline-flex items-center gap-2">
              Get in Touch
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
