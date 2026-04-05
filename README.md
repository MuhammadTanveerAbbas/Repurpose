<div align="center">

  <img src="public/favicon.svg" alt="Repurpose AI Logo" width="80" height="80" />

# Repurpose AI

**Transform one video transcript into six platform-ready content drafts — automatically.**

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge)](https://repurpose-ai.vercel.app)
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

Repurpose AI solves the blank-page problem for content creators. Paste a YouTube URL or your own transcript and get a LinkedIn post, Twitter thread, email newsletter section, YouTube description, and short-form video scripts — all as editable first drafts in under 90 seconds.

It's built for solo creators, marketers, and educators who publish consistently across platforms but don't have time to manually rewrite the same content six different ways. Unlike generic AI writing tools, every output format has platform-specific prompts baked in — character limits, structure, and conventions are handled for you.

---

## ✨ Features

- 🎬 **YouTube Transcript Extraction** — Paste a YouTube URL and captions are pulled automatically. No manual copy-paste needed.
- 📝 **Six Platform-Specific Output Formats** — LinkedIn long-form, LinkedIn hook, Twitter/X thread, email newsletter, YouTube description, and short-form video scripts.
- 🎨 **Tone Control** — Switch between Professional, Casual, and Punchy tones and regenerate instantly.
- ✏️ **Built-in Content Editor** — Edit any output directly in the app, save changes, and track character counts per platform.
- 📥 **Multi-format Export** — Download all outputs as `.txt` or `.md` files, or copy to clipboard with one click.
- 🔄 **Regeneration** — Not happy with a draft? Regenerate any format individually without touching the others.
- 📋 **Paste Transcript Fallback** — If YouTube captions aren't available, paste the transcript manually and continue.
- 📊 **Usage Dashboard** — Track projects created, total content pieces generated, and free plan usage at a glance.
- 🗂️ **Content Templates** — Pre-built prompt styles for B2B SaaS, Personal Finance, Fitness, Marketing, and Dev Education niches.
- 🔒 **Auth + Protected Routes** — Supabase Auth with email/password, protected dashboard, and per-user data isolation via RLS.
- 💳 **Tiered Pricing** — Free (3 projects/mo), Creator ($49/mo), and Pro ($99/mo) plans with feature gating.
- ⚙️ **User Settings** — Update profile name, change password, and manage account from a dedicated settings page.

---

## 🛠 Tech Stack

| Category       | Technology                                   |
| -------------- | -------------------------------------------- |
| Frontend       | React 18 + TypeScript + Vite                 |
| Styling        | Tailwind CSS v3 + shadcn/ui + Framer Motion  |
| Backend        | Supabase (Auth + PostgreSQL + RLS + Storage) |
| Edge Functions | Supabase Edge Functions (Deno)               |
| AI             | Groq API — Llama 3.3 70B Versatile           |
| Forms          | React Hook Form + Zod                        |
| Data Fetching  | TanStack React Query v5                      |
| Charts         | Recharts                                     |
| Deployment     | Vercel                                       |

---

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
# Fill in your values (see Environment Variables section below)

# 4. Run the development server
pnpm dev

# 5. Open in browser
http://localhost:8080
```

### Supabase Setup

1. Create a new Supabase project
2. Run the migration files in `supabase/migrations/` via the SQL editor
3. Deploy the edge functions:

```bash
supabase functions deploy fetch-transcript
supabase functions deploy generate-content
supabase functions deploy process-project
```

4. Set edge function secrets in the Supabase dashboard under **Edge Functions → Secrets**:
   - `AI_API_KEY` — your Groq API key
   - `SUPABASE_SERVICE_ROLE_KEY` — your Supabase service role key

---

## 🔐 Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

> The AI key (`AI_API_KEY`) and service role key (`SUPABASE_SERVICE_ROLE_KEY`) are **server-side only** — set them as Supabase Edge Function secrets, never in `.env.local`.

Get your keys:

- Supabase: [supabase.com](https://supabase.com) → Project Settings → API
- Groq: [console.groq.com](https://console.groq.com)

---

## 📁 Project Structure

```
Repurpose/
├── public/                  # Static assets
├── src/
│   ├── components/          # Reusable UI components
│   │   └── ui/              # shadcn/ui component library
│   ├── contexts/            # React context (AuthContext)
│   ├── hooks/               # Custom React hooks
│   ├── integrations/        # Supabase client + generated types
│   ├── lib/                 # Utility functions
│   ├── pages/               # Page components / routes
│   └── main.tsx             # App entry point
├── supabase/
│   ├── functions/           # Deno edge functions
│   │   ├── fetch-transcript/
│   │   ├── generate-content/
│   │   └── process-project/
│   └── migrations/          # SQL schema migrations
├── .env.example             # Environment variables template
├── package.json
└── README.md
```

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
| `pnpm test:watch` | Run tests in watch mode               |
| `pnpm type-check` | TypeScript type checking              |

---

## 🌐 Deployment

This project is deployed on **Vercel**.

### Deploy Your Own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/MuhammadTanveerAbbas/Repurpose)

1. Click the button above
2. Connect your GitHub account
3. Add environment variables in the Vercel dashboard (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`)
4. Deploy

---

## 🗺 Roadmap

- [x] YouTube transcript extraction via captions API
- [x] Six platform-specific output formats
- [x] Tone control (Professional, Casual, Punchy)
- [x] Built-in content editor with save + regenerate
- [x] TXT and Markdown export
- [x] Content templates by niche
- [x] Free / Creator / Pro plan structure
- [ ] Audio/video file transcription (MP3/MP4 upload)
- [ ] Custom tone instructions per project
- [ ] Team collaboration (up to 5 members on Pro)
- [ ] Notion and Google Docs export
- [ ] API access

---

## 🤝 Contributing

Contributions are welcome! Feel free to:

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
