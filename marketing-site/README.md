# SMC SIGNAL — Marketing Website

A high-performance marketing website for **SMC SIGNAL** built with Next.js 15 (App Router), TypeScript, Tailwind CSS, and Supabase Authentication.

---

## 🚀 Overview

- **Design Aesthetic**: Premium institutional fintech dark mode (`#0A0B0D`), emerald green accents (`#00FFA3`), gold (`#FFD700`), and royal purple (`#A855F7`).
- **Target Platform**: Desktop, tablet, and mobile responsive.
- **Backend**: Direct integration with existing Supabase project for user registration, login, and password recovery.
- **Session Bridge**: Seamless cross-application authentication transfer to the trading dashboard (`http://localhost:5173`).

---

## 📁 Pages Included

1. **Home (`/`)**: High-converting hero section with dynamic SVG live chart preview, SMC indicators, live ticker bar, platform feature highlights, how-it-works process, and conversion CTAs.
2. **Features (`/features`)**: Deep-dive into all 8 confirmed features:
   - Live Charts (Multi-timeframe 1m–1D)
   - SMC Signals (Order Blocks, FVGs, CHoCH, BOS, Liquidity Sweeps)
   - AI Scan (Multi-timeframe confluence scanner)
   - Backtesting Engine (Win rate, profit factor, drawdown)
   - Paper Trading ($10,000 simulated account, SL/TP management)
   - Forex Factory (High-impact economic calendar)
   - Analytics (Trade journal, risk-reward ratios, growth curve)
   - Social & Profiles (Public profiles, leaderboards)
3. **How It Works (`/how-it-works`)**: 4-phase step-by-step walkthrough from signup to executing SMC setups.
4. **Pricing (`/pricing`)**: Free Trial, Pro Trader, and Institutional VIP plan cards and comprehensive feature comparison table.
5. **FAQ (`/faq`)**: Interactive searchable accordion addressing SMC concepts, paper trading, risk warnings, and plan upgrades.
6. **About (`/about`)**: Company philosophy, risk-first approach, and complete technology stack.
7. **Contact (`/contact`)**: Support channels, Telegram link, and inquiry form.
8. **Privacy Policy (`/privacy`)**: Full GDPR/CCPA-compliant privacy policy.
9. **Terms of Service (`/terms`)**: Platform user agreements, intellectual property rights, and liability limitations.
10. **Trading Risk Disclaimer (`/disclaimer`)**: Prominent high-risk trading warnings, CFTC-style disclosures, and paper trading differences.
11. **Sign Up (`/signup`)**: Supabase user registration with email verification flow.
12. **Log In (`/login`)**: Supabase authentication with verified email enforcement and direct handover to the trading app.
13. **Forgot Password (`/forgot-password`)**: Password recovery email dispatch.

---

## ⚙️ Environment Variables

Configure `.env.local` inside `marketing-site/`:

```env
# Supabase Backend Configuration
NEXT_PUBLIC_SUPABASE_URL=https://siuzursbntzvegquepaq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_OoYXJUHbuHrrp_qes0HlUg_n9mQOO9O

# Trading Application URL
NEXT_PUBLIC_TRADING_APP_URL=http://localhost:5173
```

> **Security Note**: Never expose the Supabase `service_role` key in this marketing website. Only use the public anonymous key.

---

## 💻 Local Development Commands

### 1. Start the Marketing Website (Port 3000)
```bash
cd "marketing-site"
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Start the Trading Dashboard (Port 5173)
```bash
cd "smc-signal-main"
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔒 Cross-App Authentication Handover

When a verified user logs in via `http://localhost:3000/login`, the website authenticates with Supabase, retrieves the session tokens, and securely redirects to:
```
http://localhost:5173/#access_token=...&refresh_token=...&token_type=bearer&type=recovery
```
The trading dashboard's Supabase client (`detectSessionInUrl: true`) automatically extracts the tokens, persists the session in localStorage, and navigates directly into the trading interface without prompting for credentials again.
