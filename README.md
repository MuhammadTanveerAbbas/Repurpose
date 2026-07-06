<div align="center">
  <img src="./public/Repurpose%20AI.png" alt="Repurpose AI" width="120" />
  <h1 align="center">Repurpose AI</h1>
  <p align="center">Give it anything. Get content worth posting.</p>

  <p align="center">
    <img src="https://img.shields.io/badge/React-18.3-61DAFB?logo=react" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss" alt="Tailwind" />
    <img src="https://img.shields.io/badge/Supabase-2.98-3FCF8E?logo=supabase" alt="Supabase" />
    <img src="https://img.shields.io/badge/Stripe-22.1-008CDD?logo=stripe" alt="Stripe" />
    <img src="https://img.shields.io/badge/Groq_Llama_3.3-70B-F55036?logo=groq" alt="Groq" />
    <img src="https://img.shields.io/badge/Vercel-000000?logo=vercel" alt="Vercel" />
  </p>
</div>

---

## Overview

Repurpose AI is a content repurposing platform for solo founders and creators. Drop in a rough idea, a transcript, a YouTube URL, or a pain point — the AI analyzes your input, builds a content strategy, and generates platform-ready outputs across 9 formats (LinkedIn Post, Twitter/X Thread, Short-form Video Script, Cold Email Draft, and more).

Each format has platform-specific prompts baked in — character limits, structure rules, tone conventions. Editable inline. Copy or export as Markdown.

## Features

- **4 input modes** — Idea, Transcript, YouTube URL, Pain Point
- **AI content strategy analysis** — core message, audience, tone, hook ideas, emotional triggers, content pillars
- **9 output formats** — LinkedIn Post/Hook, Twitter/X Thread, Short-form Video Script, Cold Email Draft, Newsletter Section, YouTube Description, Instagram Caption, Personal Brand Bio
- **Inline editing** — every output is a live textarea, rewrite directly
- **Regenerate individual formats** — without losing the others
- **Copy All + Export Markdown**
- **4 toolkit tools** — Repurposer (convert between formats), Hook Generator (10 hooks), Bio Builder (5 bios from 5 answers), Angle Finder (8 content angles)
- **Usage-based plans** — Free (5/month), Creator (unlimited), Pro (unlimited + history)
- **Project history** — Pro-only, view/reopen/delete past sessions
- **Stats dashboard** — usage ring, weekly activity, top formats, input modes
- **Supabase Auth** — email/password + Google OAuth
- **Stripe payments** — wired for Creator/Pro plans (coming soon)
- **RLS-protected database** — each user sees only their own data
- **Serverless API** — Vercel Functions for Groq proxy, Stripe webhooks, transcript fetching
- **Dark/light mode** — warm amber-orange design system with CSS variable tokens

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | React 18.3 (SPA) + TypeScript 5.8 |
| Build | Vite 5.4 + SWC |
| Styling | Tailwind CSS 3.4 + shadcn/ui (Radix primitives) |
| Animation | Framer Motion 12 |
| Routing | React Router v6 |
| State | TanStack React Query 5 + React Context |
| Auth | Supabase Auth 2.98 (PKCE, email/password + Google OAuth) |
| Database | Supabase PostgreSQL (RLS-enabled, 3 tables + functions) |
| Payments | Stripe 22.1 (Checkout, Billing Portal, Webhooks) |
| AI | Groq API — Llama 3.3 70B (via serverless proxy) |
| Forms | react-hook-form 7 + Zod 3 (validated client + server) |
| Charts | Recharts |
| Export | Markdown (native) |
| Sandboxing | DOMPurify 3.4 (AI output sanitization) |
| Server | Vercel Serverless Functions |
| Package manager | pnpm |

## Quick Start

```bash
# Clone the repo
git clone https://github.com/MuhammadTanveerAbbas/Repurpose.git
cd Repurpose

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
# Fill in your Supabase project URL, anon key, Groq API key, etc.

# Start development (Vite on port 8080 + API server on port 3000)
pnpm dev

# Type check
pnpm type-check

# Lint
pnpm lint

# Test
pnpm test

# Build for production
pnpm build
```

## Environment Variables

| Variable | Required | Where to get it |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Supabase Dashboard → Project Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase Dashboard → Project Settings → API (anon key) |
| `VITE_SUPABASE_PROJECT_ID` | Yes | Supabase Dashboard → Project Settings → General (reference ID) |
| `GROQ_API_KEY` | Yes | [console.groq.com](https://console.groq.com) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | No (until payments live) | Stripe Dashboard → Developers → API keys |
| `STRIPE_SECRET_KEY` | No (until payments live) | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | No (until payments live) | Stripe Dashboard → Developers → Webhooks |
| `STRIPE_PRICE_CREATOR` | No (until payments live) | Stripe Dashboard → Products → Creator price ID |
| `STRIPE_PRICE_PRO` | No (until payments live) | Stripe Dashboard → Products → Pro price ID |
| `SUPABASE_SERVICE_ROLE_KEY` | No (until payments live) | Supabase Dashboard → Project Settings → API (service_role key) |
| `VITE_APP_URL` | No | Your app URL (defaults to `http://localhost:8080` in dev) |
| `CRON_SECRET` | No | Any strong random string for cron endpoint auth |

All `VITE_` prefixed variables are client-safe (exposed to the browser). Server-only keys (`GROQ_API_KEY`, `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) must never have the `VITE_` prefix.

## Project Structure

```
repurpose-ai/
├── api/                        # Vercel Serverless Functions
│   ├── _lib/
│   │   ├── stripe.ts           # Stripe singleton
│   │   ├── supabase-admin.ts   # Supabase admin client (service role)
│   │   └── verify-auth.ts      # JWT verification helper
│   ├── groq.ts                 # POST — proxies to Groq AI
│   ├── health.ts               # GET — database connectivity check
│   ├── keep-alive.ts           # GET — cron (prevents cold starts)
│   ├── transcript.ts           # GET — YouTube transcript fetch
│   └── stripe/
│       ├── create-checkout.ts  # POST — Stripe Checkout session
│       ├── customer-portal.ts  # POST — Stripe Billing Portal
│       └── webhook.ts          # POST — Stripe event handling
├── public/                     # Static assets
├── src/
│   ├── components/
│   │   ├── dashboard/          # Generate, Stats, History, Settings, Toolkit tabs
│   │   │   └── toolkit/        # Repurposer, HookGenerator, BioBuilder, AngleFinder
│   │   └── ui/                 # 49 shadcn/ui primitives
│   ├── config/
│   │   └── plans.ts            # Free/Creator/Pro plan definitions
│   ├── contexts/
│   │   └── AuthContext.tsx     # Auth state (session, user, profile)
│   ├── hooks/
│   │   ├── use-auth.ts         # Auth hook (useContext)
│   │   ├── use-mobile.tsx      # Responsive detection
│   │   └── use-toast.ts        # Toast notifications
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts       # Supabase client singleton
│   │       └── types.ts        # Database type definitions
│   ├── lib/
│   │   ├── env.ts              # Environment variable validation
│   │   ├── groq.ts             # AI prompts, types, API calls
│   │   ├── sanitize.ts         # DOMPurify + prompt injection guard
│   │   ├── utils.ts            # cn() utility
│   │   └── stripe/
│   │       └── client.ts       # Stripe.js loader
│   ├── pages/
│   │   ├── Dashboard.tsx       # Main dashboard with tab navigation
│   │   ├── Index.tsx           # Landing page
│   │   ├── Login.tsx           # Sign in (react-hook-form + Zod)
│   │   ├── Signup.tsx          # Sign up (react-hook-form + Zod)
│   │   ├── Pricing.tsx         # Pricing with charts
│   │   ├── Settings.tsx        # Redirect to /dashboard
│   │   ├── ForgotPassword.tsx  # Password reset
│   │   └── NotFound.tsx        # 404
│   └── test/
├── supabase/
│   ├── config.toml             # Supabase project config
│   └── schema.sql              # Full database schema (safe to re-run)
├── .env.example                # Environment variable template
├── vercel.json                 # Vercel config + security headers
├── tailwind.config.ts          # Tailwind CSS configuration
├── vite.config.ts              # Vite configuration
└── vitest.config.ts            # Vitest configuration
```

## Available Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start Vite dev server on port 8080 |
| `pnpm build` | Build for production (outputs to `dist/`) |
| `pnpm preview` | Preview production build |
| `pnpm lint` | Run ESLint on all files |
| `pnpm lint:fix` | Run ESLint with auto-fix |
| `pnpm test` | Run Vitest tests |
| `pnpm test:watch` | Run Vitest in watch mode |
| `pnpm type-check` | Run TypeScript compiler check (`tsc --noEmit`) |

## Deployment

Deploy to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FMuhammadTanveerAbbas%2FRepurpose)

1. Push to a GitHub repository
2. Import into Vercel
3. Set environment variables in Vercel Dashboard
4. Deploy

**Note:** Free tier works. If you enable cron (`/api/keep-alive`), a Vercel Pro plan is required.

## Roadmap

- [x] Content strategy AI analysis
- [x] 9 output format generation
- [x] 4 toolkit tools (Repurposer, Hooks, Bio, Angles)
- [x] Supabase auth (email + Google OAuth)
- [x] Usage tracking + plan limits
- [x] Stats dashboard
- [x] AI output sanitization (DOMPurify)
- [x] Prompt injection protection
- [ ] Activate Stripe payments
- [ ] Notion & Google Docs export
- [ ] API access for Pro users
- [ ] Custom tone instructions
- [ ] White-label exports

## License

MIT — see [LICENSE](LICENSE)

---

## 👨‍💻 Built by The MVP Guy

Muhammad Tanveer Abbas — SaaS Developer | Production-ready MVPs in 14–21 days
Portfolio: [themvpguy.vercel.app](https://themvpguy.vercel.app)
