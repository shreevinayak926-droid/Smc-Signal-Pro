'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, TrendingUp } from 'lucide-react';

const navLinks = [
  { label: 'Features', href: '/features' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'FAQ', href: '/faq' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0A0B0D]/95 backdrop-blur-xl border-b border-[#1E2433]/80 shadow-2xl py-2'
          : 'bg-transparent py-3 sm:py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo & Brand Name (Bold, High Visual Impact) */}
          <Link href="/" className="flex items-center gap-3.5 group select-none" aria-label="SMC Signal Home">
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 flex-shrink-0">
              <div className="absolute inset-0 bg-[#00FFA3]/30 rounded-2xl blur-md group-hover:bg-[#00FFA3]/50 transition-all duration-300" />
              <div className="relative w-11 h-11 sm:w-12 sm:h-12 bg-[#0E1015] border-2 border-[#00FFA3]/40 rounded-2xl flex items-center justify-center shadow-lg shadow-[#00FFA3]/20 group-hover:border-[#00FFA3] group-hover:scale-105 transition-all duration-200">
                <TrendingUp className="w-6 h-6 sm:w-6.5 sm:h-6.5 text-[#00FFA3]" strokeWidth={2.75} />
              </div>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-wider">
                SMC
              </span>
              <span className="text-[10px] sm:text-[11px] font-black text-[#00FFA3] tracking-[0.26em] uppercase mt-1">
                SIGNAL PRO
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3.5 py-2 text-sm font-semibold text-gray-300 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA: Dedicated Log In and Get Started Free */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2.5 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 text-sm font-bold rounded-xl btn-primary flex items-center gap-1.5 shadow-lg shadow-[#00FFA3]/20 hover:scale-[1.02] transition-all"
            >
              Get Started Free
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isOpen && (
        <div className="md:hidden mobile-backdrop border-t border-[#1E2433]/70">
          <div className="max-w-7xl mx-auto px-4 py-5 space-y-1.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 text-base font-semibold text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-[#1E2433]/70 space-y-2">
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all text-center"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3.5 text-sm font-bold rounded-xl btn-primary text-center shadow-lg shadow-[#00FFA3]/20"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
