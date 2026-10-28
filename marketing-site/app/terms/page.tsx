import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'SMC SIGNAL Terms of Service — your rights and responsibilities as a user of our platform.',
};

export default function TermsPage() {
  const updated = 'October 27, 2026';
  return (
    <div className="min-h-screen bg-[#0A0B0D]">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <p className="text-xs font-bold text-[#00FFA3] tracking-widest uppercase mb-3">Legal</p>
            <h1 className="text-4xl font-black text-white mb-2">Terms of Service</h1>
            <p className="text-gray-500 text-sm">Last updated: {updated}</p>
          </div>

          <div className="space-y-5">
            {[
              {
                title: '1. Acceptance of Terms',
                content: `By accessing or using SMC SIGNAL, you agree to be bound by these Terms of Service. If you do not agree, you must not use the platform.`,
              },
              {
                title: '2. Description of Service',
                content: `SMC SIGNAL provides trading analysis tools, paper trading simulation, and educational content based on Smart Money Concepts. All analytical tools are provided for informational and educational purposes only. Nothing on the platform constitutes financial advice, investment recommendations, or a solicitation to trade.`,
              },
              {
                title: '3. Account Registration',
                content: `You must provide accurate information during registration. You are responsible for maintaining the confidentiality of your account credentials. You must notify us immediately at support@smcsignal.pro if you suspect unauthorized access to your account. You must be at least 18 years of age to use this platform.`,
              },
              {
                title: '4. Acceptable Use',
                content: `You agree not to:\n- Use the platform for any unlawful purpose.\n- Attempt to gain unauthorized access to any part of the platform or its backend systems.\n- Scrape, reverse engineer, or reproduce the platform\'s proprietary algorithms.\n- Harass or harm other users via the social features.\n- Use automated bots or scripts to interact with the platform.`,
              },
              {
                title: '5. Intellectual Property',
                content: `All platform content, code, design, algorithms, and branding are the exclusive intellectual property of SMC Signal Pro. You may not copy, modify, distribute, or resell any platform content without express written permission.`,
              },
              {
                title: '6. Subscription & Payments',
                content: `Free Trial access is provided at no cost. Paid plans (Pro Trader, Institutional VIP) are activated manually following verified payment via UPI or cryptocurrency. Payments are non-refundable once a plan is activated. We reserve the right to modify pricing with reasonable notice.`,
              },
              {
                title: '7. Limitation of Liability',
                content: `To the maximum extent permitted by law, SMC Signal Pro shall not be liable for any direct, indirect, incidental, special, or consequential damages arising from your use of or inability to use the platform, including trading losses incurred based on signals or analytical data provided by the platform.`,
              },
              {
                title: '8. No Financial Advice',
                content: `SMC SIGNAL is not a registered broker-dealer, investment advisor, or financial institution. All content is for educational and informational purposes only. You are solely responsible for your trading decisions and any resulting gains or losses.`,
              },
              {
                title: '9. Account Termination',
                content: `We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or are inactive for extended periods. You may request account deletion by contacting support@smcsignal.pro.`,
              },
              {
                title: '10. Changes to Terms',
                content: `We may modify these Terms at any time. Continued use of the platform after changes constitutes acceptance of the updated Terms. We will notify active users of material changes via email.`,
              },
              {
                title: '11. Governing Law',
                content: `These Terms are governed by and construed in accordance with applicable laws. Any disputes shall be resolved through good-faith negotiation, and failing that, through competent courts of jurisdiction.`,
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
