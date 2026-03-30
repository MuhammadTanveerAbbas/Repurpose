# Repurpose AI

> Transform one video into six platform-ready content pieces automatically with AI-powered content repurposing.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

Repurpose AI is a powerful content repurposing platform that helps content creators, marketers, and businesses maximize their content ROI by automatically transforming video transcripts into multiple platform-optimized formats.

---

## Features

### Content Input
- **YouTube Transcript Extraction** - Paste any YouTube URL and automatically extract the full transcript
- **Manual Transcript Input** - Import transcripts from podcasts, interviews, webinars, or any video source

### AI-Powered Content Generation
Transform your transcripts into six platform-optimized formats:
- **LinkedIn Long-Form Post** - Professional articles (1,200–1,500 words)
- **LinkedIn Hook Post** - Attention-grabbing posts (under 700 characters)
- **Twitter/X Thread** - Engaging threads (7 tweets, each under 280 characters)
- **Email Newsletter Section** - Ready-to-send newsletter content
- **YouTube Description** - SEO-optimized descriptions with timestamps and tags
- **Short-Form Video Scripts** - Three 60-second scripts for TikTok/Reels/Shorts

### Platform Features
- **Tone Control** - Choose between professional, casual, or punchy writing styles
- **Project Dashboard** - Manage and revisit all your repurposing projects
- **Usage Tracking** - Monitor your monthly project limits based on your plan
- **Authentication** - Secure login with email/password and Google OAuth
- **Dark Mode UI** - Beautiful dark-mode-first interface for comfortable viewing

---

## Getting Started

### 1. Clone

```bash
git clone https://github.com/MuhammadTanveerAbbas/Repurpose.git
cd Repurpose
```

### 2. Install Dependencies

This project uses `pnpm` as the package manager:

```bash
pnpm install
```

If you don't have pnpm installed:
```bash
npm install -g pnpm
```

### 3. Environment Setup

Copy the example environment file and configure your variables:

```bash
cp .env.example .env.local
```

Fill in the required values in `.env.local` - see the Environment Variables section below for details.

### 4. Run Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:8080`.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon/public key |
| `VITE_SUPABASE_PROJECT_ID` | Yes | Supabase project reference ID |
| `AI_API_KEY` | Edge function | Groq API key (set in Supabase secrets) |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge function | Service role key (set in Supabase secrets, never client-side) |

> Edge function secrets are set in the Supabase Dashboard under **Edge Functions → Manage secrets**, not in `.env`.

---

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **AI**: Groq API for content generation
- **Authentication**: Supabase Auth (Email + Google OAuth)
- **State Management**: React Context + TanStack Query
- **Routing**: React Router v6

## Folder Structure

```
Repurpose/
├── src/
│   ├── components/       # Shared UI components (Navbar, ProtectedRoute, etc.)
│   │   └── ui/          # shadcn/ui component library
│   ├── contexts/         # React context providers (AuthContext)
│   ├── hooks/            # Custom React hooks
│   ├── integrations/     # Supabase client and auth helpers
│   ├── lib/              # Utility functions
│   └── pages/            # Route-level page components
├── supabase/
│   ├── functions/        # Deno edge functions (AI generation, transcript fetching)
│   └── migrations/       # SQL migration files
├── public/               # Static assets
└── .env.example          # Environment variable template
```

## Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm lint         # Run ESLint
pnpm test         # Run tests once
pnpm test:watch   # Run tests in watch mode
```

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## Author

**Muhammad Tanveer Abbas**

- Website: [themvpguy.vercel.app](https://themvpguy.vercel.app/)
- GitHub: [@MuhammadTanveerAbbas](https://github.com/MuhammadTanveerAbbas)

---

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Backend powered by [Supabase](https://supabase.com/)
- AI generation via [Groq](https://groq.com/)
