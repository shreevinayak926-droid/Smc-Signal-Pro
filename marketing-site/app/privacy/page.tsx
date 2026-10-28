import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'SMC SIGNAL Privacy Policy — how we collect, use, and protect your personal data.',
};

export default function PrivacyPage() {
  const updated = 'October 27, 2026';
  return (
    <div className="min-h-screen bg-[#0A0B0D]">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <p className="text-xs font-bold text-[#00FFA3] tracking-widest uppercase mb-3">Legal</p>
            <h1 className="text-4xl font-black text-white mb-2">Privacy Policy</h1>
            <p className="text-gray-500 text-sm">Last updated: {updated}</p>
          </div>

          <div className="prose prose-invert max-w-none space-y-8">
            {[
              {
                title: '1. Introduction',
                content: `SMC Signal Pro ("we", "our", "us") operates the SMC SIGNAL trading analysis platform. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our website and trading dashboard.`,
              },
              {
                title: '2. Information We Collect',
                content: `Account Information: When you register, we collect your name and email address.\n\nUsage Data: We collect data about how you use the platform, including feature interactions, page views, and session duration, to improve our service.\n\nTrading Activity: Paper trading positions, orders, and journal entries are stored to provide you with performance analytics.\n\nDevice Information: We may collect browser type, operating system, and general geographic region for security and performance purposes.`,
              },
              {
                title: '3. How We Use Your Information',
                content: `- To create and manage your account.\n- To provide the trading analysis and paper trading features.\n- To send service-related emails including email verification and password reset.\n- To enforce our Terms of Service and security policies.\n- To improve and personalise the platform experience.\n\nWe do not sell your personal information to third parties.`,
              },
              {
                title: '4. Data Storage & Security',
                content: `Your data is stored securely via Supabase, a trusted backend-as-a-service provider. Supabase uses industry-standard encryption at rest and in transit (TLS). Authentication is handled via bcrypt-hashed passwords and JWT session tokens. Row Level Security (RLS) policies ensure users can only access their own data.`,
              },
              {
                title: '5. Local Storage',
                content: `The trading dashboard may store session tokens, user preferences, and cached data in your browser\'s localStorage. This data remains on your device and is never transmitted to third parties.`,
              },
              {
                title: '6. Cookies',
                content: `We use session cookies necessary for authentication. We do not use advertising or tracking cookies. You may disable cookies in your browser settings, but doing so may prevent you from logging in.`,
              },
              {
                title: '7. Your Rights (GDPR/CCPA)',
                content: `Depending on your jurisdiction, you may have the right to: access the personal data we hold about you; request correction of inaccurate data; request deletion of your account and data; object to or restrict certain types of processing.\n\nTo exercise these rights, contact us at support@smcsignal.pro.`,
              },
              {
                title: '8. Data Retention',
                content: `We retain your account data for as long as your account is active. Upon account deletion request, we will remove your personally identifiable information within 30 days, except where retention is required for legal compliance.`,
              },
              {
                title: '9. Third-Party Services',
                content: `We use Supabase (database & authentication). Beyond this, we do not share your data with third-party analytics, advertising networks, or data brokers.`,
              },
              {
                title: '10. Contact',
                content: `For privacy-related questions, contact us at support@smcsignal.pro.`,
              },
            ].map((section) => (
              <div key={section.title} className="glass-card p-6">
                <h2 className="text-lg font-black text-white mb-3">{section.title}</h2>
                {section.content.split('\n').map((p, i) => (
                  <p key={i} className="text-sm text-gray-400 leading-relaxed mb-2 last:mb-0">{p}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
