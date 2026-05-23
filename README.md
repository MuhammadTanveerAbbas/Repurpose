# Repurpose AI — Smart Content Engine

Turn one idea, transcript, YouTube URL, or pain point into 9 platform-ready content formats instantly. Powered by Groq AI (Llama 3.3 70B).

## Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Vercel Serverless Functions (API proxy)
- **Database + Auth**: Supabase (PostgreSQL + RLS)
- **AI**: Groq API (server-side proxied)
- **Styling**: Tailwind CSS v3 + shadcn/ui
- **Deployment**: Vercel

## Quick Start

```bash
# 1. Clone
git clone https://github.com/MuhammadTanveerAbbas/Repurpose.git
cd Repurpose

# 2. Install dependencies
pnpm install

# 3. Copy environment variables
cp .env.example .env.local

# 4. Configure .env.local with your values:
#    - VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_SUPABASE_PROJECT_ID
#    - GROQ_API_KEY (get from https://console.groq.com)
#    - CRON_SECRET (optional, for keep-alive)

# 5. Run database migrations
#    - Open supabase/schema.sql in Supabase SQL Editor → Run

# 6. Start development
pnpm dev
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL (client-safe) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon key (client-safe) |
| `VITE_SUPABASE_PROJECT_ID` | Yes | Supabase project reference |
| `GROQ_API_KEY` | Yes | Groq API key (server-only, never VITE_ prefixed) |
| `CRON_SECRET` | No | Secret for keep-alive cron endpoint |

## Project Structure

```
src/
├── components/       # UI components
│   ├── dashboard/    # Dashboard feature components
│   │   └── toolkit/  # Mini-tools (Hook Generator, Bio Builder, etc.)
│   └── ui/           # shadcn/ui primitives
├── contexts/         # AuthContext (auth state management)
├── hooks/            # Custom hooks
├── integrations/     # Supabase client and types
├── lib/              # Groq client, utilities
└── pages/            # Route pages
api/                  # Vercel serverless API functions
supabase/             # Database schema and config
```

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/generate` | POST | JWT | Proxies AI content generation to Groq |
| `/api/transcript` | GET | JWT | Fetches YouTube transcript |
| `/api/keep-alive` | GET | CRON_SECRET | Prevents DB cold starts |
| `/api/health` | GET | None | Health check with DB connectivity |

## Security

- **AI API key is server-side only**: `GROQ_API_KEY` is NEVER exposed to the client
- **JWT verification**: All API endpoints verify Supabase auth tokens
- **Row Level Security**: All database tables have RLS enforced
- **Security headers**: CSP, HSTS, X-Frame-Options, etc. configured
- **TypeScript strict mode**: Full type safety enabled

## Deployment

```bash
# 1. Push to GitHub
# 2. Import to Vercel
# 3. Set environment variables in Vercel dashboard
# 4. Deploy
```

### Vercel Environment Variables

Set these in Vercel dashboard (Production, Preview, Development):

**Client-side (prefixed with VITE_)**:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

**Server-side only**:
- `GROQ_API_KEY`
- `CRON_SECRET`

## License

MIT
