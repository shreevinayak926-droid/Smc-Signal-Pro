import React, { useState, useEffect } from 'react';
import { ShieldCheck, QrCode, Copy, CheckCircle2, AlertCircle, Clock, Upload, ArrowRight, X, Sparkles, FileText, Check, Smartphone, Tag, Ticket, Percent } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PaymentSettings, PaymentProofRequest, CouponValidationResult } from '../types';
import { supabaseSubmitPayment, supabaseGetPaymentSettings, supabaseValidateCoupon, supabaseRedeemCoupon } from '../services/supabaseDb';

interface PaymentGatewayProps {
  planId: 'PRO_TRADER' | 'INSTITUTIONAL_VIP' | string;
  planTitle: string;
  priceUSD: number;
  deviceFingerprint: string;
  userEmail?: string;
  onSuccess: (data: any) => void;
  onClose: () => void;
}

export const PaymentGateway: React.FC<PaymentGatewayProps> = ({
  planId,
  planTitle,
  priceUSD,
  deviceFingerprint,
  userEmail,
  onSuccess,
  onClose,
}) => {
  const [step, setStep] = useState<'PAY_AND_SUBMIT' | 'WAITING_24H'>('PAY_AND_SUBMIT');
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [screenshotFileName, setScreenshotFileName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    upiId: 'smcsignalpro@okaxis',
    payeeName: 'SMC Signal Pro Trading',
    qrCodeUrl: '',
    conversionRateUSDToINR: 95,
    gstPercentage: 18,
  });

  // Coupon Code State
  const [couponInput, setCouponInput] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCouponResult, setAppliedCouponResult] = useState<CouponValidationResult | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  // Calculate pricing breakdown
  const rate = paymentSettings.conversionRateUSDToINR || 95;
  const gstPct = paymentSettings.gstPercentage || 18;
  
  const effectivePriceUSD = appliedCouponResult?.finalPriceUSD !== undefined ? appliedCouponResult.finalPriceUSD : priceUSD;
  const baseINR = Number((effectivePriceUSD * rate).toFixed(2));
  const gstINR = Number(((baseINR * gstPct) / 100).toFixed(2));
  const totalINR = Number((baseINR + gstINR).toFixed(2));

  const originalBaseINR = Number((priceUSD * rate).toFixed(2));
  const originalGstINR = Number(((originalBaseINR * gstPct) / 100).toFixed(2));
  const originalTotalINR = Number((originalBaseINR + originalGstINR).toFixed(2));
  const totalSavingsINR = Number(Math.max(originalTotalINR - totalINR, 0).toFixed(2));

  // 24-Hour Timer State (86400 seconds)
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(86400);

  // Fetch Supabase payment settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await supabaseGetPaymentSettings();
        if (settings) {
          setPaymentSettings(settings);
        }
      } catch (e) {
        console.warn('Failed to fetch payment settings from Supabase:', e);
      }
    }
    loadSettings();
  }, []);

  // 24H countdown timer effect
  useEffect(() => {
    if (step !== 'WAITING_24H') return;
    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const formatCountdown = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(paymentSettings.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload an image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('Image size should be under 8MB.');
      return;
    }

    setErrorMsg('');
    setScreenshotFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    setCouponError(null);
    setCouponSuccess(null);
    setIsValidatingCoupon(true);

    try {
      const res = await supabaseValidateCoupon(
        couponInput.trim(),
        userEmail,
        priceUSD,
        originalTotalINR
      );

      if (!res.valid) {
        setCouponError(res.message || 'Invalid coupon code.');
        setAppliedCouponResult(null);
      } else {
        setAppliedCouponResult(res);
        setCouponSuccess(res.message || 'Coupon applied successfully!');
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      }
    } catch (err: any) {
      setCouponError(err?.message || 'Error verifying coupon code.');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCouponResult(null);
    setCouponInput('');
    setCouponError(null);
    setCouponSuccess(null);
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber.trim()) {
      setErrorMsg('Please enter your 12-digit UPI UTR / Reference ID.');
      return;
    }

    if (!screenshotUrl) {
      setErrorMsg('Please upload your payment screenshot or receipt.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    const proofRequest: PaymentProofRequest = {
      id: `REQ_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      userEmail: userEmail || 'trader@smcsignal.pro',
      planId,
      planName: planTitle,
      priceUSD: effectivePriceUSD,
      conversionRate: rate,
      baseAmountINR: baseINR,
      gstAmountINR: gstINR,
      totalAmountINR: totalINR,
      utrNumber: utrNumber.trim(),
      screenshotUrl,
      submittedAt: Date.now(),
      status: 'PENDING',
      deviceFingerprint,
      appliedCoupon: appliedCouponResult?.coupon?.code,
      discountAmountUSD: appliedCouponResult?.discountUSD,
      discountAmountINR: totalSavingsINR,
    };

    // 1. Redeem Coupon single-use per email in Supabase
    if (appliedCouponResult?.coupon?.code && userEmail) {
      try {
        await supabaseRedeemCoupon(appliedCouponResult.coupon.code, userEmail);
      } catch (couponRedeemErr) {
        console.warn('Coupon redemption logging warning:', couponRedeemErr);
      }
    }

    // 2. Save to local storage cache for instant UI feedback
    try {
      const cached = JSON.parse(localStorage.getItem('smc_payment_requests_cache') || '[]');
      const filtered = cached.filter((c: any) => c.utrNumber !== proofRequest.utrNumber);
      filtered.unshift(proofRequest);
      localStorage.setItem('smc_payment_requests_cache', JSON.stringify(filtered.slice(0, 50)));
    } catch {}

    // 3. Persist to Supabase Database
    try {
      await supabaseSubmitPayment(proofRequest);
    } catch (err) {
      console.warn('Supabase payment submission error:', err);
    }

    setStep('WAITING_24H');
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });
    setIsSubmitting(false);
  };

  // UPI deep link
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(paymentSettings.upiId)}&pn=${encodeURIComponent(paymentSettings.payeeName)}&am=${totalINR.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`${planTitle} Subscription`)}`;

  // Default dynamic QR URL if admin hasn't uploaded custom QR image
  const qrDisplayUrl = paymentSettings.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiDeepLink)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0B0D]/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-[#0E1015] border border-[#1F2229] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden text-[#E0E0E0] flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#12141A] border-b border-[#1F2229]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#00FFA3]/10 border border-[#00FFA3]/30 text-[#00FFA3] rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#F3F4F6]">UPI &amp; QR Payment Checkout</h3>
              <p className="text-[11px] text-[#94A3B8]">Instant Indian UPI &amp; Bank Transfer (18% GST)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#E0E0E0] p-1.5 rounded-lg hover:bg-[#1A1D26] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pricing Breakdown Ribbon */}
        <div className="px-5 py-3 bg-[#161922] border-b border-[#1F2229] space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-[#94A3B8]">Plan Selection:</span>
            <div className="text-right">
              <span className="font-bold text-[#00FFA3]">{planTitle}</span>
              <span className="text-[#94A3B8] ml-1.5 font-mono">
                {appliedCouponResult ? (
                  <>
                    <span className="line-through text-[#64748B] mr-1">${priceUSD}</span>
                    <span className="text-[#00FFA3] font-bold">${effectivePriceUSD} USD</span>
                  </>
                ) : (
                  `$${priceUSD} USD`
                )}
              </span>
            </div>
          </div>

          {/* Coupon Code Input & Applied State */}
          <div className="pt-1.5 pb-1 border-t border-[#1F2229]">
            {appliedCouponResult ? (
              <div className="flex items-center justify-between bg-[#00FFA3]/10 border border-[#00FFA3]/30 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-[#00FFA3]/20 rounded-lg text-[#00FFA3]">
                    <Tag className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs text-[#00FFA3] uppercase tracking-wider">
                        {appliedCouponResult.coupon?.code}
                      </span>
                      <span className="text-[10px] bg-[#00FFA3]/20 text-[#00FFA3] px-1.5 py-0.5 rounded font-semibold">
                        {appliedCouponResult.coupon?.discountType === 'PERCENTAGE'
                          ? `${appliedCouponResult.coupon?.discountValue}% OFF`
                          : appliedCouponResult.coupon?.discountType === 'FLAT_INR'
                          ? `₹${appliedCouponResult.coupon?.discountValue} OFF`
                          : `$${appliedCouponResult.coupon?.discountValue} OFF`}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#94A3B8]">You saved ₹{totalSavingsINR.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-[#94A3B8] hover:text-[#FF4D6D] p-1 rounded-lg hover:bg-[#FF4D6D]/10 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Remove coupon"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Ticket className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase());
                        setCouponError(null);
                        setCouponSuccess(null);
                      }}
                      placeholder="Have a Promo / Coupon Code?"
                      className="w-full pl-8 pr-3 py-1.5 bg-[#0E1015] border border-[#2A2E39] rounded-xl text-xs text-[#F3F4F6] placeholder-[#64748B] focus:border-[#00FFA3] focus:outline-none uppercase font-mono tracking-wider"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={isValidatingCoupon || !couponInput.trim()}
                    className="px-3 py-1.5 bg-[#1F2229] hover:bg-[#00FFA3] hover:text-black text-[#00FFA3] font-bold text-xs rounded-xl border border-[#00FFA3]/30 disabled:opacity-40 disabled:hover:bg-[#1F2229] disabled:hover:text-[#00FFA3] transition-all cursor-pointer shrink-0"
                  >
                    {isValidatingCoupon ? 'Checking...' : 'Apply'}
                  </button>
                </div>
                {couponError && (
                  <p className="text-[10px] text-[#FF4D6D] flex items-center gap-1 px-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{couponError}</span>
                  </p>
                )}
                {couponSuccess && (
                  <p className="text-[10px] text-[#00FFA3] flex items-center gap-1 px-1">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span>{couponSuccess}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center text-[11px] text-[#64748B] font-mono">
            <span>Exchange Conversion ($1 = ₹{rate}):</span>
            <span>₹{baseINR.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between items-center text-[11px] text-[#64748B] font-mono">
            <span>Government GST ({gstPct}%):</span>
            <span>+₹{gstINR.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between items-center pt-1 border-t border-[#1F2229] text-sm">
            <div>
              <span className="font-bold text-[#E0E0E0]">Total Payable Amount:</span>
              {appliedCouponResult && (
                <span className="text-[10px] text-[#00FFA3] block font-normal">Single-use discount applied</span>
              )}
            </div>
            <div className="text-right">
              {appliedCouponResult && (
                <div className="text-[11px] text-[#64748B] line-through font-mono">
                  ₹{originalTotalINR.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              )}
              <span className="font-mono font-black text-base text-[#00FFA3]">
                ₹{totalINR.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5">
          {step === 'PAY_AND_SUBMIT' && (
            <form onSubmit={handleSubmitProof} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-[#FF4D6D]/15 border border-[#FF4D6D]/40 rounded-xl text-[#FF4D6D] text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Step 1: Scan QR or Pay via UPI */}
              <div className="bg-[#12141A] border border-[#1F2229] rounded-2xl p-4 space-y-3.5 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#F3F4F6]">
                  <QrCode className="w-4 h-4 text-[#00FFA3]" />
                  <span>Step 1: Scan UPI QR Code or Copy UPI ID</span>
                </div>

                {/* QR Code Container */}
                <div className="w-48 h-48 mx-auto bg-white p-2.5 rounded-2xl shadow-lg flex items-center justify-center border-2 border-[#00FFA3]/40">
                  <img
                    src={qrDisplayUrl}
                    alt="UPI Payment QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="text-[11px] text-[#94A3B8]">
                  Payee: <strong className="text-[#E0E0E0]">{paymentSettings.payeeName}</strong>
                </div>

                {/* UPI ID copy pill */}
                <div className="flex items-center justify-between bg-[#0A0B0D] border border-[#1F2229] rounded-xl px-3 py-2 text-xs">
                  <div className="font-mono font-bold text-[#00FFA3] truncate max-w-[240px]">
                    {paymentSettings.upiId}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="px-2.5 py-1 bg-[#1A1D26] hover:bg-[#222634] text-[#E0E0E0] rounded-lg border border-[#1F2229] flex items-center gap-1 text-[11px] cursor-pointer transition-colors"
                  >
                    {copiedUpi ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#00FFA3]" />
                        <span className="text-[#00FFA3]">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy UPI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Step 2: Upload Proof & UTR */}
              <div className="bg-[#12141A] border border-[#1F2229] rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#F3F4F6]">
                  <FileText className="w-4 h-4 text-[#00FFA3]" />
                  <span>Step 2: Enter UTR Reference &amp; Upload Screenshot</span>
                </div>

                {/* UTR Input */}
                <div className="space-y-1 text-xs">
                  <label className="text-[#E0E0E0] font-medium block">
                    12-Digit UPI Reference / UTR Number <span className="text-[#FF4D6D]">*</span>
                  </label>
                  <input
                    id="input-utr-number"
                    type="text"
                    required
                    placeholder="e.g. 423984719283"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9a-zA-Z]/g, ''))}
                    className="w-full bg-[#0A0B0D] border border-[#1F2229] rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-[#F3F4F6] focus:outline-none focus:border-[#00FFA3]"
                  />
                  <span className="text-[10px] text-[#64748B]">Found in your Google Pay, PhonePe, Paytm, or Bank payment receipt</span>
                </div>

                {/* Screenshot Upload Dropzone */}
                <div className="space-y-1 text-xs">
                  <label className="text-[#E0E0E0] font-medium block">
                    Payment Screenshot / Receipt <span className="text-[#FF4D6D]">*</span>
                  </label>

                  <label className="border-2 border-dashed border-[#1F2229] hover:border-[#00FFA3]/50 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-[#0A0B0D] transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {screenshotUrl ? (
                      <div className="flex items-center gap-2 text-xs text-[#00FFA3]">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="truncate max-w-xs">{screenshotFileName || 'Screenshot Uploaded'}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-[#94A3B8]" />
                        <span className="text-xs text-[#94A3B8]">Click to upload payment screenshot (JPG/PNG)</span>
                      </>
                    )}
                  </label>

                  {screenshotUrl && (
                    <div className="mt-2 w-full h-24 bg-[#0A0B0D] rounded-lg overflow-hidden border border-[#1F2229]">
                      <img src={screenshotUrl} alt="Receipt preview" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>
              </div>

              {/* Submit CTA */}
              <button
                id="btn-submit-payment-proof"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-[#00FFA3] hover:bg-[#05D588] disabled:bg-[#1A1D26] text-[#0A0B0D] disabled:text-[#64748B] font-bold text-sm rounded-xl shadow-lg shadow-[#00FFA3]/20 flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Submitting Verification...</span>
                ) : (
                  <>
                    <span>Submit Payment Proof for Activation</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {step === 'WAITING_24H' && (
            <div className="text-center py-6 space-y-6 animate-fadeIn">
              <div className="w-16 h-16 rounded-2xl bg-[#00FFA3]/10 border border-[#00FFA3]/30 text-[#00FFA3] flex items-center justify-center mx-auto shadow-lg shadow-[#00FFA3]/10 animate-bounce">
                <CheckCircle2 className="w-8 h-8 text-[#00FFA3]" />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#F59E0B]/20 text-[#FBBF24] border border-[#F59E0B]/40">
                  ⏳ 24-HOUR VERIFICATION UNDERWAY
                </span>
                <h3 className="text-lg font-bold text-[#F3F4F6]">Payment Submitted Successfully!</h3>
                <p className="text-xs text-[#94A3B8] max-w-sm mx-auto leading-relaxed">
                  Your payment reference has been recorded. Our verification team is validating the UTR with banking records.
                </p>
              </div>

              {/* 24H Live Countdown Box */}
              <div className="bg-[#12141A] border border-[#1F2229] rounded-2xl p-4 max-w-sm mx-auto space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-xs text-[#64748B]">
                  <Clock className="w-4 h-4 text-[#FBBF24]" />
                  <span>Estimated Account Activation Window</span>
                </div>
                <div className="font-mono font-black text-2xl text-[#00FFA3] tracking-wider">
                  {formatCountdown(timeLeftSeconds)}
                </div>
                <p className="text-[10px] text-[#64748B]">
                  Your Pro/VIP features will be unlocked immediately upon admin confirmation within 24 hours.
                </p>
              </div>

              {/* Transaction Summary Card */}
              <div className="bg-[#0A0B0D] border border-[#1F2229] rounded-xl p-3.5 text-left text-xs font-mono max-w-sm mx-auto space-y-1.5">
                <div className="flex justify-between text-[#94A3B8]">
                  <span>Plan:</span>
                  <span className="text-[#F3F4F6] font-bold">{planTitle}</span>
                </div>
                <div className="flex justify-between text-[#94A3B8]">
                  <span>Amount Paid:</span>
                  <span className="text-[#00FFA3] font-bold">₹{totalINR.toFixed(2)} (inc. 18% GST)</span>
                </div>
                <div className="flex justify-between text-[#94A3B8]">
                  <span>Submitted UTR:</span>
                  <span className="text-[#F3F4F6] font-bold">{utrNumber}</span>
                </div>
                <div className="flex justify-between text-[#94A3B8]">
                  <span>Status:</span>
                  <span className="text-[#FBBF24] font-bold">PENDING APPROVAL</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-[#1A1D26] hover:bg-[#222634] text-[#E0E0E0] font-bold text-xs rounded-xl border border-[#1F2229] transition-all cursor-pointer"
              >
                Done / Return to Trading Desk
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
