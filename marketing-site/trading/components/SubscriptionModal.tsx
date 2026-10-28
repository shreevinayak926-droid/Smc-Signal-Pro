import React, { useState, useEffect } from 'react';
import { TrialInfo, SubscriptionPlan } from '../types';
import { PaymentGateway } from './PaymentGateway';
import { supabaseGetPlans } from '../services/supabaseDb';
import { ShieldCheck, Check, Sparkles, Zap, Lock, Clock, Smartphone, AlertTriangle, X } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  trialInfo: TrialInfo | null;
  userEmail?: string;
  onUpgradeSuccess: (data: any) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  trialInfo,
  userEmail,
  onUpgradeSuccess,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<'PRO_TRADER' | 'INSTITUTIONAL_VIP' | null>(null);
  const [dbPlans, setDbPlans] = useState<SubscriptionPlan[]>([]);

  useEffect(() => {
    async function loadPlans() {
      try {
        const plans = await supabaseGetPlans();
        if (plans && plans.length > 0) {
          setDbPlans(plans);
        }
      } catch (e) {
        console.warn('Could not fetch plans from DB:', e);
      }
    }
    if (isOpen) {
      loadPlans();
    }
  }, [isOpen]);

  const proPlan = dbPlans.find((p) => p.id === 'PRO_TRADER' || p.id === 'PRO_MONTHLY' || p.name?.toLowerCase().includes('pro')) || {
    id: 'PRO_TRADER',
    name: 'Pro Trader',
    priceUSD: 29,
    priceINR: 3251,
  };

  const vipPlan = dbPlans.find((p) => p.id === 'INSTITUTIONAL_VIP' || p.name?.toLowerCase().includes('vip')) || {
    id: 'INSTITUTIONAL_VIP',
    name: 'Institutional VIP',
    priceUSD: 79,
    priceINR: 8856,
  };

  if (!isOpen) return null;

  const handleCheckout = (planId: 'PRO_TRADER' | 'INSTITUTIONAL_VIP') => {
    setSelectedPlanId(planId);
  };

  const activeCheckoutPlan = selectedPlanId === 'PRO_TRADER' ? proPlan : vipPlan;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#0A0B0D]/85 backdrop-blur-md animate-fadeIn">
        <div className="bg-[#0E1015] border border-[#1F2229] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden text-[#E0E0E0] flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-[#12141A] border-b border-[#1F2229]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#00FFA3]/10 border border-[#00FFA3]/30 text-[#00FFA3] rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#F3F4F6]">Unlock SMC Institutional Trading Edge</h3>
                <p className="text-xs text-[#94A3B8]">
                  Select a subscription tier to access automated multi-timeframe scanners, push alerts, and VIP signals.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[#94A3B8] hover:text-[#E0E0E0] p-2 rounded-lg hover:bg-[#1A1D26]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 1-Day Trial Device Fingerprint Banner */}
          <div className="px-6 py-3 bg-[#161922] border-b border-[#1F2229] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#00FFA3]" />
              <span>
                Single Device 1-Day Trial Policy:{' '}
                <span className="font-bold text-[#00FFA3] font-mono">
                  {trialInfo?.isExpired ? 'Trial Expired' : trialInfo?.formattedRemaining || 'Active'}
                </span>
              </span>
            </div>
            <span className="text-[10px] text-[#64748B] font-mono">
              Device ID: {trialInfo?.deviceFingerprint.slice(0, 18)}...
            </span>
          </div>

          {/* Plans Comparison Matrix */}
          <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tier 1: Free Plan (24-Hour Free Trial on Registration) */}
            <div className="bg-[#12141A] border border-[#1F2229] rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-[#94A3B8] text-sm">Free Trial Plan</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#0A0B0D] text-[#00FFA3] font-mono border border-[#00FFA3]/30">Auto 24h</span>
                </div>
                <div className="text-2xl font-bold font-mono text-[#F3F4F6] mt-2">
                  $0 <span className="text-xs text-[#64748B] font-normal">/ 24 Hours</span>
                </div>
                <p className="text-xs text-[#94A3B8] mt-1">
                  Active for 24 hours immediately upon registration. Home Chart access only.
                </p>

                <ul className="space-y-2 mt-4 text-xs text-[#E0E0E0]">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#00FFA3] shrink-0" />
                    <span>Real-Time Multi-Pair Live Chart (Home)</span>
                  </li>
                  <li className="flex items-center gap-2 text-[#64748B]">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>Paper Trading Desk (Pro Required)</span>
                  </li>
                  <li className="flex items-center gap-2 text-[#64748B]">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>Forex Factory News (Pro Required)</span>
                  </li>
                  <li className="flex items-center gap-2 text-[#64748B]">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>Quantitative Backtester (Pro Required)</span>
                  </li>
                  <li className="flex items-center gap-2 text-[#64748B]">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>Social Copy Trading (Pro Required)</span>
                  </li>
                  <li className="flex items-center gap-2 text-[#64748B]">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>Live SMC Signals Hub (Institutional VIP Only)</span>
                  </li>
                </ul>
              </div>

              <div className="p-2.5 bg-[#0A0B0D] border border-[#1F2229] rounded-xl text-[11px] text-center text-[#94A3B8] font-mono">
                {trialInfo?.isExpired ? '24h Trial Expired' : 'Active 24h Free Trial'}
              </div>
            </div>

            {/* Tier 2: Pro Trader Plan (30 Days on Admin Approval) */}
            <div className="bg-[#161922] border-2 border-[#00FFA3] rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl shadow-[#00FFA3]/10 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00FFA3] text-[#0A0B0D] text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider shadow">
                30 Days Validity
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-[#00FFA3] text-sm">Pro Trader Plan</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#00FFA3]/15 text-[#00FFA3] font-mono border border-[#00FFA3]/30">30 Days</span>
                </div>
                <div className="text-2xl font-bold font-mono text-[#F3F4F6] mt-2">
                  ${proPlan.priceUSD} <span className="text-xs text-[#64748B] font-normal">/ 30 Days</span>
                </div>
                <div className="text-[11px] font-mono font-bold text-[#00FFA3]">
                  ₹{(proPlan.priceINR || Math.round(proPlan.priceUSD * 95)).toLocaleString()} <span className="text-[9px] text-[#94A3B8] font-normal">(incl. 18% GST)</span>
                </div>
                <p className="text-xs text-[#94A3B8] mt-1">
                  Activates for 30 days immediately upon Admin Approval.
                </p>

                <ul className="space-y-2 mt-4 text-xs text-[#E0E0E0]">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#00FFA3] shrink-0" />
                    <span>Real-Time Multi-Pair Live Chart</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#00FFA3] shrink-0" />
                    <span>Paper Trading Execution Desk</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#00FFA3] shrink-0" />
                    <span>Forex Factory Real-Time News</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#00FFA3] shrink-0" />
                    <span>Quantitative Strategy Backtester</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#00FFA3] shrink-0" />
                    <span>Social Copy Trading Dashboard</span>
                  </li>
                  <li className="flex items-center gap-2 text-[#64748B]">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>Live SMC Signals Hub (Institutional VIP Only)</span>
                  </li>
                </ul>
              </div>

              <button
                id="btn-select-pro-plan"
                onClick={() => handleCheckout('PRO_TRADER')}
                className="w-full py-3 bg-[#00FFA3] hover:bg-[#05D588] text-[#0A0B0D] rounded-xl font-bold text-xs shadow-lg shadow-[#00FFA3]/20 transition-all transform active:scale-95 cursor-pointer"
              >
                Buy Pro Plan (₹{(proPlan.priceINR || Math.round(proPlan.priceUSD * 95)).toLocaleString()} / ${proPlan.priceUSD})
              </button>
            </div>

            {/* Tier 3: Institutional VIP Plan (30 Days on Admin Approval) */}
            <div className="bg-[#12141A] border border-[#1F2229] rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-[#A855F7] text-sm">Institutional VIP Plan</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#A855F7]/15 text-[#C084FC] font-mono border border-[#A855F7]/30">All Access • 30 Days</span>
                </div>
                <div className="text-2xl font-bold font-mono text-[#F3F4F6] mt-2">
                  ${vipPlan.priceUSD} <span className="text-xs text-[#64748B] font-normal">/ 30 Days</span>
                </div>
                <div className="text-[11px] font-mono font-bold text-[#C084FC]">
                  ₹{(vipPlan.priceINR || Math.round(vipPlan.priceUSD * 95)).toLocaleString()} <span className="text-[9px] text-[#94A3B8] font-normal">(incl. 18% GST)</span>
                </div>
                <p className="text-xs text-[#94A3B8] mt-1">
                  Full institutional access to all features. Activates for 30 days upon Admin Approval.
                </p>

                <ul className="space-y-2 mt-4 text-xs text-[#E0E0E0]">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#A855F7] shrink-0" />
                    <span className="font-bold text-[#F3F4F6]">Live Admin SMC Signals Hub Unlocked</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#A855F7] shrink-0" />
                    <span>Paper Trading Execution Desk</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#A855F7] shrink-0" />
                    <span>Forex Factory Real-Time News</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#A855F7] shrink-0" />
                    <span>Quantitative Strategy Backtester</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#A855F7] shrink-0" />
                    <span>Social Copy Trading Dashboard</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#A855F7] shrink-0" />
                    <span>Gemini AI Structure Scanner &amp; VIP Alerts</span>
                  </li>
                </ul>
              </div>

              <button
                id="btn-select-vip-plan"
                onClick={() => handleCheckout('INSTITUTIONAL_VIP')}
                className="w-full py-3 bg-[#A855F7] hover:bg-[#9333EA] text-white rounded-xl font-bold text-xs shadow-lg shadow-[#A855F7]/20 transition-all transform active:scale-95 cursor-pointer"
              >
                Buy Institutional Plan (₹{(vipPlan.priceINR || Math.round(vipPlan.priceUSD * 95)).toLocaleString()} / ${vipPlan.priceUSD})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Gateway Modal */}
      {selectedPlanId && (
        <PaymentGateway
          planId={selectedPlanId}
          planTitle={activeCheckoutPlan.name || (selectedPlanId === 'PRO_TRADER' ? 'Pro Trader Plan' : 'Institutional VIP Plan')}
          priceUSD={activeCheckoutPlan.priceUSD || (selectedPlanId === 'PRO_TRADER' ? 29.00 : 79.00)}
          deviceFingerprint={trialInfo?.deviceFingerprint || 'smc-default-device'}
          userEmail={userEmail}
          onSuccess={(data) => {
            setSelectedPlanId(null);
            onUpgradeSuccess(data);
            onClose();
          }}
          onClose={() => setSelectedPlanId(null)}
        />
      )}
    </>
  );
};
