# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Alyn (อลิน) is a premium Thai online novel reading/writing platform built for the Thai market. It competes with Tunwalai and ReadAWrite, differentiating through curated quality, premium UX, and a transparent coin-based microtransaction system. The entire UI is in Thai (`lang="th"`).

## Commands

- `npm run dev` — Start dev server (Turbopack)
- `npm run build` — Production build (includes TypeScript type checking)
- `npm run lint` — ESLint (script is just `eslint`, runs on entire repo)
- `npx prisma generate` — Regenerate Prisma client after schema changes (outputs to `src/generated/prisma/`)
- `npx prisma db push` — Push schema changes to database (use `--accept-data-loss` if prompted)
- `npx tsx prisma/seed.ts` — Seed database with demo data
- `npx tsx prisma/seed-erotic.ts` — Seed additional 18+ romance novels (idempotent via upsert)

**Node version:** Prisma 7 requires Node 20.19+, 22.12+, or 24.0+. This repo uses Node 22 via nvm. If commands fail with Prisma errors, run `nvm use 22` first.

**After schema changes or DB reset:** run `npx prisma db push` then `npx tsx prisma/seed.ts`. Restart the dev server — the Prisma client is cached in `globalThis` and stale clients cause "column does not exist" errors.

**No test runner is configured** — there is no `npm test` script. Do not write tests unless asked.

Demo accounts (seeded): `admin@alyn.co`, `writer@alyn.co`, `writer2@alyn.co`, `writer3@alyn.co`, `reader@alyn.co` — all use password `password123`.

## Architecture

**Stack:** Next.js 16.2.1 (App Router, Turbopack) + React 19 + TypeScript 5 + Tailwind CSS v4 + Prisma 7 (PostgreSQL via pg adapter) + NextAuth 5 beta + Resend (email) + Omise (payments, optional).

### Route Groups & Layouts

Three layout groups separate concerns:

- **`(main)/layout.tsx`** — Navbar + Footer. All public pages: homepage, explore, novel detail, reader, ranking, library, wallet, write (analytics/withdraw), settings, user profiles.
- **`(auth)/layout.tsx`** — Passthrough (no chrome). Login, register, forgot/reset/verify-email pages have their own full-screen designs.
- **`admin/layout.tsx`** — Admin sidebar via `AdminLayoutClient`. No Navbar/Footer. Protected by middleware (ADMIN role only). Includes pages: users, novels, comments, transactions, reports, payouts.

Root `layout.tsx` is minimal: `<html>`, `<body>`, `<SessionProvider>`, `{children}` only.

### Authentication & Authorization

NextAuth 5 with Credentials provider, JWT strategy. Session includes `id`, `role`, `penName`, `coinBalance`. The authorize callback in `src/lib/auth.ts` rejects users where `isBanned = true` — banned users cannot log in.

**Env vars**: NextAuth v5 uses `AUTH_SECRET` (not `NEXTAUTH_SECRET`). The middleware also reads `AUTH_SECRET`.

Auth utilities in `src/lib/auth-utils.ts` use a **throw pattern** (not return NextResponse):
```typescript
const session = await requireAdmin(); // throws Error("UNAUTHORIZED") or Error("FORBIDDEN")
```
API routes must wrap calls in try/catch and use `handleApiError(error)` from `src/lib/api-response.ts`, which maps `UNAUTHORIZED`/`FORBIDDEN` to 401/403 and unknown errors to 500.

Middleware (`src/middleware.ts`) protects `/library`, `/wallet`, `/write` (require auth) and `/admin` (require ADMIN role).

### Database

Prisma 7 with PostgreSQL (pg adapter). Connection string in `.env` as `DATABASE_URL`.

**Key differences from older Prisma versions:**
- Connection config is in `prisma.config.ts` and `.env`, not in schema datasource block
- Client generated to `src/generated/prisma/` — **import from there, not `@prisma/client`**
- Database client exported as **`db`** from `src/lib/db.ts` (not `prisma`)
- Uses PostgreSQL adapter (`@prisma/adapter-pg`) for connection pooling

**Models** (see `prisma/schema.prisma` for the source of truth): User, Follow, Review, PayoutRequest, Genre, Novel, Chapter, Tag, Bookmark, ReadingProgress, Comment, ChapterPurchase, CoinTransaction, Donation, Notification, DeviceToken, Report.

**Enums are stored as strings** (not Prisma enums) — documented in schema comments:
- **Role:** `READER` | `WRITER` | `ADMIN`
- **NovelStatus:** `DRAFT` | `ONGOING` | `COMPLETED` | `HIATUS`
- **TransactionType:** `TOPUP` | `PURCHASE` | `EARNING` | `DONATION_SENT` | `DONATION_RECEIVED` | `CHECK_IN_REWARD` | `AD_REWARD` (some reserved for future mobile rewards system)
- **NotificationType:** `NEW_CHAPTER` | `COMMENT` | `DONATION` | `SYSTEM`
- **ReportTargetType:** `COMMENT` | `NOVEL` | `CHAPTER`
- **ReportStatus:** `PENDING` | `RESOLVED` | `DISMISSED`
- **PayoutRequest status:** `PENDING` | `APPROVED` | `REJECTED` | `PAID`

**Revenue split:** 70% writer / 30% platform for chapter purchases; 90/10 for donations. 1 coin = 1 THB.

**Financial operations** (top-up, chapter purchase, donations, withdraw hold/refund) MUST use `db.$transaction()`. Wrap all related writes — balance update + transaction record + side-effects — in one transaction.

### API Response Conventions

Helpers in `src/lib/api-response.ts`:

- `apiSuccess(data)` — **spreads `data` directly into JSON** (e.g. `apiSuccess({ novel })` → `{ novel: {...} }`, NOT `{ data: { novel: {...} } }`). Do not double-wrap.
- `apiPaginated(items, pagination)` — returns `{ data: [...], pagination: {...} }`. When consuming from the frontend, read `res.data` for the array, not `res.novels`/`res.items`.
- `apiError(message, status, code?)` — returns `{ error, code? }`.
- `handleApiError(error)` — catch-all; understands the throw pattern from `auth-utils`.
- `parsePagination(searchParams)` + `calculatePagination(total, page, limit)` — keep pagination shapes consistent.

When adding a new frontend fetch, match the response shape the helper produces — mismatches here have been the #1 source of "data not showing" bugs in this repo.

### API Route Pattern

```typescript
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { rateLimitRequest } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const limit = rateLimitRequest(request, "route:action", 10, 60_000);
    if (!limit.success) return apiError("คำขอมากเกินไป ...", 429, "RATE_LIMITED");

    const session = await requireAuth();
    // ... handler
    return apiSuccess({ result });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Rate Limiting & Sanitization

- `src/lib/rate-limit.ts` — in-memory (Map-based, per-process) rate limiter. Not distributed — fine for a single Next.js node, will need Redis for multi-instance deploy. Apply to auth endpoints (5/15min), comments (10/5min), upload (10/1hr).
- `src/lib/sanitize.ts` — `sanitizeComment()` uses a strict allowlist (`<b>`, `<i>`, `<br>`, `<p>`), strips script/iframe/style/on* handlers. **Always run on comment content before persisting.** Chapter HTML uses DOMPurify (`dompurify` package) on the client in the reader.

### External Services (Mock Mode)

Both email and payment services have **mock fallbacks** — they work end-to-end without real API keys:

- **`src/lib/email.ts`** (Resend) — if `RESEND_API_KEY` is unset, `sendEmail()` logs to console with `[EMAIL MOCK]` prefix and returns a fake id. Helpers: `sendPasswordResetEmail`, `sendVerificationEmail`, `sendWelcomeEmail` — all Thai templates.
- **`src/lib/payment/omise.ts`** — if `OMISE_SECRET_KEY` is unset, `createCharge()` returns `{ mock: true, status: "successful" }` and logs `[OMISE MOCK]`. The real SDK is loaded via a runtime-computed module name so Turbopack does not attempt to resolve the `omise` package at build time; the package does not need to be installed for mock mode to work. Install `omise` only when going live.

See `.env.example` for the full env var list.

### Notifications

`src/lib/notification-service.ts` exports `notifyNovelFollowers(novelId, ...)` and `notifyAuthorFollowers(authorId, ...)`. These are wired into: chapter publish (POST/PUT in `src/app/api/novels/[novelId]/chapters/...`), comment create, and donation create. New notification-triggering events should call these helpers directly — do not write raw `db.notification.create()` calls at call sites.

"Followers" currently derives from `Bookmark` records for a novel (there's no separate follow-novel relation). The `Follow` model is user-to-user only.

### Design System

Brand colors defined in `src/app/globals.css` via Tailwind v4 `@theme inline`:
- `rosegold` (#CB8A7C) / `rosegold-dark` (#9D5E55) — primary
- `cream` (#FFF4F1) — background
- `brand-black` (#2D1B18) — text
- `coin` (#D4A034) — payment UI

Font: **Noto Sans Thai** via `@import` in globals.css.

Reader themes (default/sepia/night/dark) are toggled via inline styles and Tailwind classes in the chapter reader component. There is no site-wide dark mode — only the reader has themes.

### Component Conventions

- `src/components/ui/` — `Button` (variants: primary/secondary/outline/ghost/coin), `NovelCard` (accepts both flat strings and nested objects for author/genre)
- `src/components/layout/` — `Navbar`, `Footer`
- `src/components/editor/` — `RichTextEditor` (TipTap; requires `immediatelyRender: false` for SSR)
- `src/components/comments/` — `CommentSection` (theme-aware)
- `src/components/donations/` — `DonationButton`, `DonationList`
- `src/components/reviews/` — `ReviewSection` (star rating + list + form)
- `src/components/safety/` — `AgeGateModal` (18+ gate, stored in `localStorage` key `alyn_age_verified`), `ReportButton` (opens report modal, posts to `/api/reports`)
- `src/components/admin/` — `AdminLayoutClient`
- Use `cn()` from `src/lib/utils.ts` for conditional class merging (clsx + tailwind-merge)
- Icons: `lucide-react` exclusively

### Path Alias

`@/*` maps to `./src/*` (tsconfig.json). The `mobile/` directory is excluded from both TypeScript (`tsconfig.json` exclude) and ESLint (`eslint.config.mjs` globalIgnores) — Flutter app lives there per `docs/mobile-plan.md` but is not yet implemented.

### SEO

Root layout uses `title.template: "%s | อลิน"`. `src/app/robots.ts` and `src/app/sitemap.ts` generate `/robots.txt` and `/sitemap.xml` dynamically from the database. Novel and chapter layout files export `generateMetadata` with OpenGraph (`type: 'book'`) and Twitter card fields. Novel detail pages inject JSON-LD `Book` schema with `aggregateRating`.

### File Uploads

Cover images uploaded via `POST /api/upload` to `public/uploads/covers/`. Accepted: JPG, PNG, WebP (max 5MB). Extension is derived from validated MIME type (not user-supplied filename). The route calls `mkdir({ recursive: true })` before writing — do not assume the directory exists. Returns `{ url, filename }`.

### Content Safety

- Chapter content rendered with `dangerouslySetInnerHTML` is sanitized via DOMPurify on the client in the reader.
- Comments are sanitized server-side via `sanitizeComment()` before persisting.
- Novels with `isAdult = true` show an age gate modal (`AgeGateModal`) on novel detail + chapter reader pages. Acceptance is stored in `localStorage` with a 30-day expiry.

## Mobile App

A Flutter mobile app is planned but not yet built. See `docs/mobile-plan.md` for the full architecture plan (Riverpod + GoRouter + Dio, Android-first, Google Play Billing, AdMob rewarded ads + daily check-in). The prior React Native attempt was deleted — the `mobile/` directory is reserved for the new Flutter project and is currently excluded from TS/ESLint.

## Brand Assets

Logo SVGs in `public/logo/` (Primary, Secondary, White variants). Brand guideline PDF and source files in `Alyn/Logo/` directory. Mock cover images used in seed data live in `public/uploads/covers/mock-*.jpeg`. Competitor analysis in `competitor-analysis.md`.
