import Link from 'next/link';
import { TrendingUp, Mail, Send, Shield, AlertTriangle } from 'lucide-react';
import { SUPPORT_EMAIL, SUPPORT_TELEGRAM } from '@/lib/config';

const footerLinks = {
  Platform: [
    { label: 'Features', href: '/features' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'FAQ', href: '/faq' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Risk Disclaimer', href: '/disclaimer' },
  ],
  Account: [
    { label: 'Sign Up', href: '/signup' },
    { label: 'Log In', href: '/login' },
    { label: 'Forgot Password', href: '/forgot-password' },
  ],
};

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#0E1015] border-t border-[#1E2433]/60 mt-auto">
      {/* Risk Warning Banner */}
      <div className="bg-[#0A0B0D] border-b border-amber-900/30 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-600/80 leading-relaxed">
            <strong className="text-amber-500">Risk Warning:</strong> Trading financial markets involves substantial
            risk of capital loss. SMC SIGNAL provides analytical tools for educational and informational purposes only
            and does not constitute financial advice. Past performance is not indicative of future results. Trade responsibly.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3.5 mb-5 group w-fit">
              <div className="relative w-11 h-11 flex-shrink-0">
                <div className="absolute inset-0 bg-[#00FFA3]/25 rounded-2xl blur-md group-hover:bg-[#00FFA3]/40 transition-all duration-300" />
                <div className="relative w-11 h-11 bg-[#0A0B0D] border-2 border-[#00FFA3]/40 rounded-2xl flex items-center justify-center shadow-lg shadow-[#00FFA3]/15 group-hover:border-[#00FFA3] group-hover:scale-105 transition-all">
                  <TrendingUp className="w-6 h-6 text-[#00FFA3]" strokeWidth={2.75} />
                </div>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-2xl font-black text-white tracking-wider">SMC</span>
                <span className="text-[10px] font-black text-[#00FFA3] tracking-[0.25em] uppercase mt-1">SIGNAL PRO</span>
              </div>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed mb-5 max-w-xs">
              Institutional-grade Smart Money Concept analysis for serious traders. Detect order blocks, FVGs,
              liquidity sweeps, and receive real-time algorithmic signals.
            </p>
            <div className="flex flex-col gap-2">
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-[#00FFA3] transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                {SUPPORT_EMAIL}
              </a>
              <a
                href={SUPPORT_TELEGRAM}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-[#00FFA3] transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                Telegram Community
              </a>
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                {category}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 hover:text-gray-200 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-[#1E2433]/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            © {year} SMC Signal Pro. All rights reserved. Not financial advice.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Shield className="w-3 h-3 text-[#00FFA3]/60" />
            <span>Secured by Supabase</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
