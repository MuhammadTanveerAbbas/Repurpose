<div align="center">

  <img src="public/favicon.svg" alt="Repurpose AI Logo" width="80" height="80" />

# Repurpose AI

**Smart Content Engine for solo founders and creators.**  
Give it anything: a rough idea, a transcript, a YouTube URL, or a pain point.  
It figures out the strategy, picks the right formats, and generates content worth posting.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge)](https://the-repurpose-ai.vercel.app/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)

</div>

---

<div align="center">
  <img src="public/Repurpose AI.png" alt="Repurpose AI" width="100%" />
</div>

---

## Overview

Repurpose AI is a **Smart Content Engine** built for freelancers, solo creators, and solo founders who need to produce great content fast, without thinking too hard about format, platform, or strategy.

The old approach: paste transcript → get 6 outputs. That's a template machine.

This is different: give it anything (a URL, a raw idea, a rough transcript, a topic, a pain point) and it **figures out** the best content strategy, picks the right formats, and generates outputs that are actually good enough to post.

No edge functions. All AI calls go directly from the browser using the Groq API (`llama-3.3-70b-versatile`).

---

## ✨ Features

- **4 Input Modes** : Idea, Transcript (paste), YouTube URL (auto-fetches transcript), Pain Point
- **AI Strategy Analysis** : Before generating, the AI returns a Content Strategy Card: core message, audience, tone, and recommended formats. You review and edit before hitting generate.
- **9 Output Formats** : LinkedIn Post, LinkedIn Hook, Twitter/X Thread, Short-form Video Script, Cold Email Draft, Newsletter Section, YouTube Description, Instagram Caption, Personal Brand Bio
- **Smart Format Recommendations** : AI picks the best 3 to 5 formats for your specific input. You can add or remove any.
- **Inline Editing** : Every output is an editable textarea with live character count (color-coded per platform limits)
- **Per-card Controls** : Copy, Regenerate (without touching others), Mark as Done
- **Bulk Actions** : Copy All, Export as Markdown (.md), Start New
- **Project History** : Past sessions saved to Supabase (Pro plan)
- **Plan Gating** : Free (5/mo), Creator ($49/mo), Pro ($99/mo) with soft upgrade prompts
- **Auth** : Supabase email/password + Google OAuth, protected routes, per-user RLS

---

## 🛠 Tech Stack

| Category      | Technology                                       |
| ------------- | ------------------------------------------------ |
| Frontend      | React 18 + TypeScript + Vite                     |
| Styling       | Tailwind CSS v3 + shadcn/ui + Framer Motion      |
| Backend       | Supabase (Auth + PostgreSQL + RLS)               |
| AI            | Groq API — Llama 3.3 70B Versatile (client-side) |
| Forms         | React Hook Form + Zod                            |
| Data Fetching | TanStack React Query v5                          |
| Deployment    | Vercel                                           |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+ (`npm install -g pnpm`)
- Supabase account — [supabase.com](https://supabase.com)
- Groq API key — [console.groq.com](https://console.groq.com)

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/MuhammadTanveerAbbas/Repurpose.git
cd Repurpose

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in your values (see Environment Variables below)

# 4. Run the development server
pnpm dev

# 5. Open in browser
http://localhost:8080
```

### Supabase Setup

1. Create a new Supabase project
2. Run `supabase/schema.sql` in the Supabase SQL Editor
3. That's it — no edge functions needed

---

## 🔐 Environment Variables

Create a `.env.local` file in the root:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id

# Groq AI (client-side — safe to expose via VITE_ prefix)
VITE_GROQ_API_KEY=your-groq-api-key
```

Get your keys:

- Supabase: [supabase.com](https://supabase.com) → Project Settings → API
- Groq: [console.groq.com](https://console.groq.com)

---

## 📁 Project Structure

```
Repurpose/
├── public/                      # Static assets
├── src/
│   ├── components/
│   │   ├── dashboard/           # Dashboard tab components
│   │   │   ├── GenerateTab.tsx  # Main 3-step generation flow
│   │   │   ├── InputStep.tsx    # Input mode selector
│   │   │   ├── StrategyCard.tsx # AI strategy review + format picker
│   │   │   ├── OutputsSection.tsx
│   │   │   ├── OutputCard.tsx   # Per-format card with edit/copy/regen
│   │   │   ├── HistoryTab.tsx   # Past projects (Pro)
│   │   │   └── SettingsTab.tsx  # Profile + plan + password
│   │   └── ui/                  # shadcn/ui component library
│   ├── contexts/                # AuthContext
│   ├── hooks/                   # use-auth, use-mobile, use-toast
│   ├── integrations/            # Supabase client + types
│   ├── lib/
│   │   ├── groq.ts              # Groq API client + all format prompts
│   │   └── utils.ts
│   ├── pages/
│   │   ├── Index.tsx            # Landing page
│   │   ├── Dashboard.tsx        # 3-tab dashboard shell
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   ├── Pricing.tsx
│   │   └── NotFound.tsx
│   └── main.tsx
├── supabase/
│   └── schema.sql               # Full DB schema with RLS
├── .env.example
├── package.json
└── README.md
```

---

## 🔄 How the Tool Works

### Step 1 : Input

User picks a mode (Idea / Transcript / YouTube URL / Pain Point) and submits.

### Step 2 : Strategy Analysis

Groq analyzes the input and returns a JSON strategy:

```json
{
  "core_message": "...",
  "audience": "...",
  "recommended_formats": [
    "LinkedIn Post",
    "Twitter/X Thread",
    "Short-form Video Script"
  ],
  "tone": "Provocative",
  "strategy_note": "..."
}
```

This is shown as a **Content Strategy Card**. User can edit format selection before proceeding.

### Step 3 : Generation

Each selected format is generated sequentially with a platform-specific system prompt. Outputs appear as cards as they complete. User can edit, copy, regenerate, or mark done.

---

## 📦 Available Scripts

| Command           | Description                           |
| ----------------- | ------------------------------------- |
| `pnpm dev`        | Start development server on port 8080 |
| `pnpm build`      | Build for production                  |
| `pnpm preview`    | Preview production build              |
| `pnpm lint`       | Run ESLint                            |
| `pnpm lint:fix`   | Run ESLint with auto-fix              |
| `pnpm test`       | Run tests (single run)                |
| `pnpm type-check` | TypeScript type checking              |

---

## 🌐 Deployment

Deployed on **Vercel**. Add these environment variables in the Vercel dashboard:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_GROQ_API_KEY`

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/MuhammadTanveerAbbas/Repurpose)

---

## 🗺 Roadmap

- [x] 4 input modes (Idea, Transcript, YouTube URL, Pain Point)
- [x] AI content strategy analysis before generation
- [x] 9 platform-specific output formats
- [x] Inline editing + per-format regeneration
- [x] Copy All + Export as Markdown
- [x] Project history (Pro)
- [x] Free / Creator / Pro plan gating
- [ ] Streaming generation (real-time output)
- [ ] Custom tone instructions per session
- [ ] Notion and Google Docs export
- [ ] API access

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👨‍💻 Built by The MVP Guy

<div align="center">

**Muhammad Tanveer Abbas**  
SaaS Developer | Building production-ready MVPs in 14–21 days

[![Portfolio](https://img.shields.io/badge/Portfolio-themvpguy.vercel.app-black?style=for-the-badge)](https://themvpguy.vercel.app)
[![Twitter](https://img.shields.io/badge/Twitter-@themvpguy-1DA1F2?style=for-the-badge&logo=twitter)](https://x.com/themvpguy)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=for-the-badge&logo=linkedin)](https://linkedin.com/in/muhammadtanveerabbas)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=for-the-badge&logo=github)](https://github.com/MuhammadTanveerAbbas)

_If this project helped you, please consider giving it a ⭐_

</div>
