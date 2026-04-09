# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Alyn (อลิน) is a premium Thai online novel reading/writing platform built for the Thai market. It competes with Tunwalai and ReadAWrite, differentiating through curated quality, premium UX, and a transparent coin-based microtransaction system. The entire UI is in Thai (`lang="th"`).

## Commands

- `npm run dev` — Start dev server (Turbopack)
- `npm run build` — Production build (includes TypeScript type checking)
- `npm run lint` — ESLint
- `npx prisma generate` — Regenerate Prisma client after schema changes (outputs to `src/generated/prisma/`)
- `npx prisma db push` — Push schema changes to database (use `--accept-data-loss` if prompted)
- `npx tsx prisma/seed.ts` — Seed database with demo data

**Important:** After resetting the database or making schema changes, run `npx prisma db push` and then `npx tsx prisma/seed.ts` to seed with demo data. You must restart the dev server after database resets, as the Prisma client is cached in `globalThis`.

Demo accounts (seeded): `admin@alyn.co`, `writer@alyn.co`, `writer2@alyn.co`, `writer3@alyn.co`, `reader@alyn.co` — all use password `password123`.

## Architecture

**Stack:** Next.js 16.2.1 (App Router, Turbopack) + React 19 + TypeScript 5 + Tailwind CSS v4 + Prisma 7 (PostgreSQL via pg adapter) + NextAuth 5 beta

### Route Groups & Layouts

Three layout groups separate concerns:

- **`(main)/layout.tsx`** — Navbar + Footer. All public pages: homepage, explore, novel detail, reader, ranking, library, wallet, write, settings, user profiles.
- **`(auth)/layout.tsx`** — Passthrough (no chrome). Login, register, forgot/reset password pages have their own full-screen designs.
- **`admin/layout.tsx`** — Admin sidebar via `AdminLayoutClient`. No Navbar/Footer. Protected by middleware (ADMIN role only).

Root `layout.tsx` is minimal: `<html>`, `<body>`, `<SessionProvider>`, `{children}` only.

### Authentication & Authorization

NextAuth 5 with Credentials provider, JWT strategy. Session includes `id`, `role`, `penName`, `coinBalance`.

Auth utilities in `src/lib/auth-utils.ts` use a **throw pattern** (not return NextResponse):
```typescript
const session = await requireAdmin(); // throws Error("UNAUTHORIZED") or Error("FORBIDDEN")
```
API routes must wrap calls in try/catch and check `error.message` for "UNAUTHORIZED"/"FORBIDDEN".

Middleware (`src/middleware.ts`) protects `/library`, `/wallet`, `/write` (require auth) and `/admin` (require ADMIN role).

### Database

Prisma 7 with PostgreSQL (pg adapter). Connection string in `.env` as `DATABASE_URL`.

**Key differences from older Prisma versions:**
- Connection config is in `prisma.config.ts` and `.env`, not in schema datasource block
- Client generated to `src/generated/prisma/` (import from there, not `@prisma/client`)
- Database client exported as `db` from `src/lib/db.ts` (not `prisma`)
- Using PostgreSQL adapter (`@prisma/adapter-pg`) for connection pooling and edge compatibility

12 models: User, Genre, Novel, Chapter, Tag, Bookmark, ReadingProgress, Comment, ChapterPurchase, CoinTransaction, Donation, Notification.

**Roles:** READER (default), WRITER, ADMIN. **Novel statuses:** DRAFT, ONGOING, COMPLETED, HIATUS. **Transaction types:** TOPUP, PURCHASE, EARNING, DONATION_SENT, DONATION_RECEIVED.

Revenue split: 70% writer / 30% platform for chapter purchases; 90/10 for donations.

**Financial operations** (coin purchase, top-up, donations) use `db.$transaction()` to prevent race conditions. Always wrap multiple related DB writes in a transaction.

### Design System

Brand colors defined in `src/app/globals.css` via Tailwind v4 `@theme inline`:
- `rosegold` (#CB8A7C) / `rosegold-dark` (#9D5E55) — primary
- `cream` (#FFF4F1) — background
- `brand-black` (#2D1B18) — text
- `coin` (#D4A034) — payment UI

Font: **Noto Sans Thai** via `@import` in globals.css.

Reader themes (default/sepia/night/dark) are toggled via inline styles and Tailwind classes in the chapter reader component.

### Component Conventions

- `src/components/ui/` — `Button` (variants: primary/secondary/outline/ghost/coin), `NovelCard` (accepts both flat strings and nested objects for author/genre)
- `src/components/layout/` — `Navbar` (search, notifications, user dropdown), `Footer`
- `src/components/editor/` — `RichTextEditor` (TipTap-based with Thai toolbar, requires `immediatelyRender: false` for SSR)
- `src/components/comments/` — `CommentSection` (theme-aware, adapts to reader themes)
- `src/components/donations/` — `DonationButton`, `DonationList`
- `src/components/admin/` — `AdminLayoutClient` (sidebar navigation)
- Use `cn()` from `src/lib/utils.ts` for conditional class merging (clsx + tailwind-merge)
- Icons: `lucide-react` exclusively

### Path Alias

`@/*` maps to `./src/*` (tsconfig.json).

### SEO

Root layout uses `title.template: "%s | อลิน"`. Static pages have metadata in their `layout.tsx` files. Dynamic pages (`/novel/[id]`, `/user/[userId]`) use `generateMetadata` in layout files to fetch data from the database.

### API Route Pattern

All API routes follow this structure:
```typescript
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    // ... handler using db
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHORIZED" ? 401 : 403 });
    }
    return NextResponse.json({ error: "..." }, { status: 500 });
  }
}
```

### File Uploads

Cover images uploaded via `POST /api/upload` to `public/uploads/covers/`. Accepted: JPG, PNG, WebP (max 5MB). Extension is derived from validated MIME type (not user-supplied filename). Returns `{ url, filename }`.

### Content Safety

Chapter content rendered with `dangerouslySetInnerHTML` is sanitized via DOMPurify on the client. Always sanitize HTML before rendering.

## Brand Assets

Logo SVGs in `public/logo/` (Primary, Secondary, White variants). Brand guideline PDF and source files in `Alyn/Logo/` directory. Competitor analysis in `competitor-analysis.md`.
