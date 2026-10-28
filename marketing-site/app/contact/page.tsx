'use client';

import { useState, FormEvent } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Mail, Send, MessageSquare, CheckCircle } from 'lucide-react';
import { SUPPORT_EMAIL, SUPPORT_TELEGRAM } from '@/lib/config';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', category: 'support', message: '' });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.message) {
      setError('Please fill in all required fields.');
      return;
    }
    // In production, send to an API route or email service.
    // For now we simulate a success state.
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-[#0A0B0D]">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-[#00FFA3] tracking-widest uppercase mb-3">Contact</p>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">Get in Touch</h1>
            <p className="text-gray-400">Have a question or want to upgrade your plan? We are here to help.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Contact Channels */}
            <div className="space-y-5">
              <h2 className="text-xl font-black text-white mb-4">Reach Us Directly</h2>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="flex items-center gap-4 glass-card p-5 hover:border-[#00FFA3]/30 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#00FFA3]/10 border border-[#00FFA3]/20 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-[#00FFA3]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Email Support</p>
                  <p className="text-xs text-gray-500">{SUPPORT_EMAIL}</p>
                </div>
              </a>
              <a
                href={SUPPORT_TELEGRAM}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 glass-card p-5 hover:border-[#00FFA3]/30 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#00FFA3]/10 border border-[#00FFA3]/20 flex items-center justify-center flex-shrink-0">
                  <Send className="w-5 h-5 text-[#00FFA3]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Telegram Community</p>
                  <p className="text-xs text-gray-500">Join our active trader group</p>
                </div>
              </a>
              <div className="flex items-center gap-4 glass-card p-5">
                <div className="w-10 h-10 rounded-xl bg-[#A855F7]/10 border border-[#A855F7]/20 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-[#A855F7]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Business Inquiries</p>
                  <p className="text-xs text-gray-500">Partnerships & enterprise access</p>
                </div>
              </div>

              <div className="glass-card p-5 mt-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Response Time</p>
                <p className="text-sm text-gray-400">
                  We typically respond within <strong className="text-white">24–48 hours</strong>. For urgent issues, Telegram is the fastest channel.
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="glass-card p-7">
              {sent ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-10">
                  <CheckCircle className="w-12 h-12 text-[#00FFA3]" />
                  <h3 className="text-xl font-black text-white">Message Received!</h3>
                  <p className="text-gray-400 text-sm">We will get back to you within 24–48 hours at the email you provided.</p>
                  <button
                    onClick={() => { setSent(false); setForm({ name: '', email: '', category: 'support', message: '' }); }}
                    className="mt-2 text-sm text-[#00FFA3] hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h2 className="text-lg font-black text-white mb-5">Send a Message</h2>
                  <div>
                    <label htmlFor="contact-name" className="block text-xs font-semibold text-gray-400 mb-1.5">Full Name *</label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Your name"
                      className="w-full px-4 py-3 input-dark text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-xs font-semibold text-gray-400 mb-1.5">Email Address *</label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 input-dark text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-category" className="block text-xs font-semibold text-gray-400 mb-1.5">Category</label>
                    <select
                      id="contact-category"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-4 py-3 input-dark text-sm"
                    >
                      <option value="support">Technical Support</option>
                      <option value="billing">Billing & Subscription</option>
                      <option value="partnership">Partnership / Business</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="contact-message" className="block text-xs font-semibold text-gray-400 mb-1.5">Message *</label>
                    <textarea
                      id="contact-message"
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Describe your question or request…"
                      className="w-full px-4 py-3 input-dark text-sm resize-none"
                    />
                  </div>
                  {error && <p className="text-red-400 text-xs">{error}</p>}
                  <button type="submit" id="contact-submit-btn" className="w-full py-3 text-sm font-bold rounded-xl btn-primary">
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
