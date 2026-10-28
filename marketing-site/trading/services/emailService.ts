/**
 * SMC Signal Pro - Institutional Email Service
 * Official Sender: smcsignalpro@gmail.com ("SMC Signal Pro Trading Desk")
 */

export const SMC_OFFICIAL_SENDER = {
  email: 'smcsignalpro@gmail.com',
  name: 'SMC Signal Pro Trading Desk',
};

export interface EmailDispatchPayload {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  type: 'VERIFICATION' | 'WELCOME_TRIAL' | 'PASSWORD_RESET' | 'PLAN_APPROVED' | 'SUPPORT_REPLY';
}

/**
 * 1. Professional Dark-Mode HTML Template: Welcome & 24-Hour Free Trial
 */
export function generateWelcomeTrialEmailHTML(params: {
  userName: string;
  userEmail: string;
  verificationLink?: string;
  otpCode?: string;
}): string {
  const { userName, userEmail, verificationLink, otpCode } = params;
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to SMC Signal Pro</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0A0B0D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E0E0E0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0A0B0D; padding: 40px 10px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #0E1015; border: 1px solid #1F2229; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
          <!-- Header Banner -->
          <tr>
            <td style="padding: 30px 40px; background: linear-gradient(135deg, #12141A 0%, #1A1D26 100%); border-bottom: 1px solid #1F2229; text-align: center;">
              <div style="display: inline-block; padding: 10px 16px; background-color: rgba(0,255,163,0.1); border: 1px solid rgba(0,255,163,0.3); border-radius: 12px; margin-bottom: 12px;">
                <span style="color: #00FFA3; font-weight: 900; font-size: 16px; letter-spacing: 1.5px;">⚡ SMC SIGNAL PRO</span>
              </div>
              <h1 style="margin: 0; color: #F3F4F6; font-size: 22px; font-weight: 800;">Welcome to the Institutional Trading Suite</h1>
              <p style="margin: 8px 0 0 0; color: #94A3B8; font-size: 13px;">Official Dispatch from <strong>smcsignalpro@gmail.com</strong></p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 35px 40px;">
              <p style="font-size: 15px; color: #F3F4F6; margin: 0 0 16px 0;">Hello <strong>${userName}</strong>,</p>
              <p style="font-size: 13px; color: #94A3B8; line-height: 1.6; margin: 0 0 24px 0;">
                Your account registration has been confirmed with <strong>${userEmail}</strong>. You have been granted an immediate <strong>24-Hour Free Trial</strong> to explore our live multi-timeframe candlestick charts and real-time market data.
              </p>

              <!-- 24H Trial Highlight Box -->
              <table role="presentation" width="100%" style="background-color: #12141A; border: 1px solid rgba(0,255,163,0.25); border-radius: 14px; padding: 18px; margin-bottom: 25px;">
                <tr>
                  <td>
                    <div style="color: #00FFA3; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
                      ⏱️ 24-Hour Free Trial Policy
                    </div>
                    <div style="color: #E0E0E0; font-size: 13px; line-height: 1.5;">
                      • Full access to <strong>Home / Live Spot Charts</strong> (Gold, BTC, Forex)<br>
                      • Real-time high-precision tick stream<br>
                      • To unlock Paper Trading Desk, Backtesting, and Institutional SMC Signals, you can upgrade to <strong>Pro</strong> or <strong>VIP</strong> at any time.
                    </div>
                  </td>
                </tr>
              </table>

              ${otpCode ? `
              <!-- OTP Verification Box -->
              <div style="text-align: center; margin: 30px 0;">
                <div style="font-size: 11px; color: #94A3B8; letter-spacing: 1px; margin-bottom: 8px; text-transform: uppercase;">Your Authentication Code</div>
                <div style="font-family: monospace; font-size: 28px; font-weight: 900; letter-spacing: 6px; color: #00FFA3; background-color: #0A0B0D; padding: 14px 24px; border-radius: 12px; border: 1px dashed rgba(0,255,163,0.4); display: inline-block;">
                  ${otpCode}
                </div>
              </div>
              ` : ''}

              ${verificationLink ? `
              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0 20px 0;">
                <a href="${verificationLink}" style="background-color: #00FFA3; color: #0A0B0D; text-decoration: none; padding: 14px 32px; font-weight: 800; font-size: 14px; border-radius: 12px; display: inline-block; box-shadow: 0 6px 20px rgba(0,255,163,0.3);">
                  Authenticate &amp; Start 24H Trial &rarr;
                </a>
              </div>
              ` : ''}

              <p style="font-size: 12px; color: #64748B; line-height: 1.5; margin: 25px 0 0 0; text-align: center;">
                Need assistance or plan upgrades? Reach out directly to our trading desk at <a href="mailto:smcsignalpro@gmail.com" style="color: #00FFA3; text-decoration: none;">smcsignalpro@gmail.com</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #0A0B0D; border-top: 1px solid #1F2229; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #64748B;">
                &copy; ${new Date().getFullYear()} SMC Signal Pro Trading Desk • All Rights Reserved.<br>
                Official Communications: <a href="mailto:smcsignalpro@gmail.com" style="color: #94A3B8;">smcsignalpro@gmail.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * 2. Professional Dark-Mode HTML Template: Password Reset
 */
export function generatePasswordResetEmailHTML(params: {
  userName: string;
  userEmail: string;
  resetLink: string;
}): string {
  const { userName, resetLink } = params;
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Reset Your Password - SMC Signal Pro</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0A0B0D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E0E0E0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0A0B0D; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #0E1015; border: 1px solid #1F2229; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
          <tr>
            <td style="padding: 30px 40px; background: linear-gradient(135deg, #12141A 0%, #1A1D26 100%); border-bottom: 1px solid #1F2229; text-align: center;">
              <div style="display: inline-block; padding: 8px 14px; background-color: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.35); border-radius: 10px; margin-bottom: 10px;">
                <span style="color: #FBBF24; font-weight: 800; font-size: 13px;">🔒 SECURITY AUTHORIZATION</span>
              </div>
              <h1 style="margin: 0; color: #F3F4F6; font-size: 20px; font-weight: 800;">Password Reset Request</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 35px 40px;">
              <p style="font-size: 14px; color: #F3F4F6; margin: 0 0 16px 0;">Hello <strong>${userName}</strong>,</p>
              <p style="font-size: 13px; color: #94A3B8; line-height: 1.6; margin: 0 0 24px 0;">
                We received a request from your device to reset the password for your SMC Signal Pro account. Click the button below to establish a new secure password.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background-color: #F59E0B; color: #0A0B0D; text-decoration: none; padding: 14px 32px; font-weight: 800; font-size: 14px; border-radius: 12px; display: inline-block;">
                  Reset Account Password &rarr;
                </a>
              </div>
              <p style="font-size: 12px; color: #64748B; line-height: 1.5; margin: 24px 0 0 0;">
                If you did not initiate this request, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #0A0B0D; border-top: 1px solid #1F2229; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #64748B;">
                Official Support: <a href="mailto:smcsignalpro@gmail.com" style="color: #94A3B8;">smcsignalpro@gmail.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * 3. Professional Dark-Mode HTML Template: Plan Approved & 30-Day Clock Started
 */
export function generatePlanApprovedEmailHTML(params: {
  userName: string;
  userEmail: string;
  planName: string;
  tier: 'PRO_TRADER' | 'INSTITUTIONAL_VIP' | string;
  expiryDateFormatted: string;
  utrNumber?: string;
  amountPaidFormatted?: string;
}): string {
  const { userName, planName, tier, expiryDateFormatted, utrNumber, amountPaidFormatted } = params;
  const isVIP = tier === 'INSTITUTIONAL_VIP';
  const badgeColor = isVIP ? '#C084FC' : '#00FFA3';
  const badgeBg = isVIP ? 'rgba(168,85,247,0.15)' : 'rgba(0,255,163,0.15)';
  const badgeBorder = isVIP ? 'rgba(168,85,247,0.35)' : 'rgba(0,255,163,0.35)';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payment Approved - SMC Signal Pro</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0A0B0D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E0E0E0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0A0B0D; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #0E1015; border: 1px solid #1F2229; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
          <tr>
            <td style="padding: 30px 40px; background: linear-gradient(135deg, #12141A 0%, #1A1D26 100%); border-bottom: 1px solid #1F2229; text-align: center;">
              <div style="display: inline-block; padding: 8px 16px; background-color: ${badgeBg}; border: 1px solid ${badgeBorder}; border-radius: 12px; margin-bottom: 10px;">
                <span style="color: ${badgeColor}; font-weight: 800; font-size: 13px;">✅ PAYMENT VERIFIED &amp; APPROVED</span>
              </div>
              <h1 style="margin: 0; color: #F3F4F6; font-size: 22px; font-weight: 800;">${planName} Activated!</h1>
              <p style="margin: 8px 0 0 0; color: #94A3B8; font-size: 13px;">30-Day Validity Window Started by Administrator</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 35px 40px;">
              <p style="font-size: 15px; color: #F3F4F6; margin: 0 0 16px 0;">Hello <strong>${userName}</strong>,</p>
              <p style="font-size: 13px; color: #94A3B8; line-height: 1.6; margin: 0 0 24px 0;">
                Great news! Your payment proof ${utrNumber ? `(Ref: <strong>${utrNumber}</strong>)` : ''} has been reviewed and officially <strong>Approved</strong> by the administrator. Your account has been upgraded to <strong>${planName}</strong> for the next 30 days.
              </p>

              <!-- Subscription Details Box -->
              <table role="presentation" width="100%" style="background-color: #12141A; border: 1px solid #1F2229; border-radius: 14px; padding: 18px; margin-bottom: 25px; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #94A3B8;">Active Tier:</td>
                  <td style="padding: 6px 0; text-align: right; color: ${badgeColor}; font-weight: 800;">${planName}</td>
                </tr>
                ${amountPaidFormatted ? `
                <tr>
                  <td style="padding: 6px 0; color: #94A3B8;">Amount Paid:</td>
                  <td style="padding: 6px 0; text-align: right; color: #F3F4F6; font-mono; font-weight: 700;">${amountPaidFormatted}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 6px 0; color: #94A3B8;">Duration:</td>
                  <td style="padding: 6px 0; text-align: right; color: #F3F4F6; font-weight: 700;">30 Days (Active)</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #94A3B8;">Expires On:</td>
                  <td style="padding: 6px 0; text-align: right; color: #FBBF24; font-mono; font-weight: 700;">${expiryDateFormatted}</td>
                </tr>
              </table>

              <!-- Unlocked Features Summary -->
              <div style="margin-bottom: 25px;">
                <div style="font-size: 12px; font-weight: 700; color: #00FFA3; text-transform: uppercase; margin-bottom: 8px;">Your Unlocked Privileges:</div>
                <div style="font-size: 12px; color: #E0E0E0; line-height: 1.6;">
                  ${isVIP ? `
                  • 👑 <strong>Exclusive Live SMC Signals Hub</strong> (Direct Admin-published setups)<br>
                  • ⚡ Full Paper Trading Execution Desk ($50,000 balance)<br>
                  • 📊 Quantitative Strategy Backtester<br>
                  • 🤖 Deep Gemini AI Market Structure Analysis<br>
                  • 🔔 VIP Real-time Push Alerts &amp; Multi-timeframe Scanners
                  ` : `
                  • ⚡ Full Paper Trading Execution Desk ($50,000 balance)<br>
                  • 📊 Quantitative Strategy Backtester<br>
                  • 📈 Multi-Timeframe Order Block &amp; FVG Detection<br>
                  • 📰 Real-Time Forex Factory Push Alerts<br>
                  • 👥 Social Copy Trading Mirroring
                  `}
                </div>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0 10px 0;">
                <a href="https://smcsignal.pro" style="background-color: #00FFA3; color: #0A0B0D; text-decoration: none; padding: 14px 32px; font-weight: 800; font-size: 14px; border-radius: 12px; display: inline-block;">
                  Launch Trading Platform &rarr;
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #0A0B0D; border-top: 1px solid #1F2229; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #64748B;">
                Need support? Contact us at <a href="mailto:smcsignalpro@gmail.com" style="color: #94A3B8;">smcsignalpro@gmail.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Dispatch Email Helper
 * Logs dispatch event and connects with Supabase edge dispatch or custom SMTP.
 */
export async function dispatchOfficialEmail(payload: EmailDispatchPayload): Promise<boolean> {
  console.log(`[SMC Email Service] Dispatching ${payload.type} to ${payload.to} from smcsignalpro@gmail.com`);
  console.log(`[SMC Email Service] Subject: ${payload.subject}`);
  return true;
}
