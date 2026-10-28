import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AlertTriangle } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trading Risk Disclaimer',
  description: 'Important trading risk disclaimer for SMC SIGNAL — please read before using our platform.',
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-[#0A0B0D]">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Warning Header */}
          <div className="bg-amber-900/15 border border-amber-700/30 rounded-2xl p-7 mb-10 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <p className="text-xs font-bold text-amber-500 tracking-widest uppercase mb-2">Important Disclosure</p>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">Trading Risk Disclaimer</h1>
            <p className="text-amber-600/80 text-sm leading-relaxed">
              Please read this disclaimer carefully before using any features of the SMC SIGNAL platform.
            </p>
          </div>

          <div className="space-y-5">
            {[
              {
                title: 'High Risk Warning',
                content: `Trading financial instruments — including foreign exchange (Forex), commodities (Gold, Silver), stock indices, and cryptocurrencies — involves a substantial risk of financial loss. The leverage available in these markets amplifies both potential gains and potential losses. You could lose some or all of your invested capital.\n\nYou should not trade with money you cannot afford to lose. Before trading, you should carefully consider your financial situation, investment objectives, level of experience, and risk appetite.`,
                accent: true,
              },
              {
                title: 'No Financial Advice',
                content: `SMC SIGNAL does not provide financial advice, investment recommendations, or trading signals intended as a basis for making specific investment decisions. All content on this platform — including signal detections, order block annotations, AI scan results, and analytical tools — is provided for informational and educational purposes only.\n\nNothing on this platform constitutes a recommendation to buy or sell any financial instrument. Always conduct your own analysis and consult a qualified financial advisor before making investment decisions.`,
              },
              {
                title: 'Past Performance is Not Indicative of Future Results',
                content: `Any historical data, backtesting results, or performance metrics shown on this platform should not be relied upon as an indication of future performance. Financial markets are inherently unpredictable. Trading strategies that have worked historically may not work in the future under different market conditions.`,
              },
              {
                title: 'Paper Trading vs Live Trading',
                content: `The paper trading feature within SMC SIGNAL uses a simulated environment with virtual funds. Paper trading results may differ substantially from live trading results due to factors including:\n- Slippage and execution delays in live markets\n- Emotional factors affecting live trading decisions\n- Liquidity constraints not present in simulated environments\n\nProfit in paper trading does not guarantee profitability in live markets.`,
              },
              {
                title: 'SMC Methodology Disclaimer',
                content: `Smart Money Concepts is a framework for interpreting price action based on the hypothesis of institutional order flow. It is one of many analytical approaches and is not scientifically proven to predict market movements. The accuracy of SMC signal detections will vary with market conditions, and no algorithm can consistently identify all profitable trading opportunities.`,
              },
              {
                title: 'Regulatory Notice',
                content: `SMC Signal Pro is not a registered financial institution, broker-dealer, or investment advisor in any jurisdiction. The platform does not operate under any financial regulatory license. Use of the platform does not create any client-advisor relationship between you and SMC Signal Pro.`,
              },
              {
                title: 'Limitation of Liability',
                content: `In no event shall SMC Signal Pro, its developers, administrators, or affiliates be liable for any trading losses, lost profits, or consequential damages arising from the use of or reliance upon any content, signals, or tools provided on this platform.`,
              },
              {
                title: 'Your Responsibility',
                content: `By using SMC SIGNAL, you acknowledge that:\n- You understand the risks involved in trading financial instruments.\n- You are using all analytical tools at your own risk and discretion.\n- You will not hold SMC Signal Pro responsible for any trading losses.\n- You have read and agreed to our Terms of Service and Privacy Policy.`,
              },
            ].map((section) => (
              <div
                key={section.title}
                className={`glass-card p-6 ${section.accent ? 'border-amber-800/30 bg-amber-900/5' : ''}`}
              >
                <h2 className={`text-lg font-black mb-3 ${section.accent ? 'text-amber-400' : 'text-white'}`}>
                  {section.title}
                </h2>
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
