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

**Models** (see `prisma/schema.prisma` for the source of truth): User, Follow, Review, PayoutRequest, PaymentOrder, Genre, Novel, Chapter, Tag, Bookmark, ReadingProgress, Comment, ChapterPurchase, CoinTransaction, Donation, Notification, DeviceToken, Report, DailyCheckIn, AdReward, IapPurchase.

**Enums are stored as strings** (not Prisma enums) — documented in schema comments:
- **Role:** `READER` | `WRITER` | `ADMIN`
- **NovelStatus:** `DRAFT` | `ONGOING` | `COMPLETED` | `HIATUS`
- **TransactionType:** `TOPUP` | `PURCHASE` | `EARNING` | `DONATION_SENT` | `DONATION_RECEIVED` | `CHECK_IN_REWARD` | `AD_REWARD` — all in active use (`CHECK_IN_REWARD` from `/api/v1/checkin/claim`, `AD_REWARD` from `/api/v1/ads/ssv-callback`).
- **NotificationType:** `NEW_CHAPTER` | `COMMENT` | `DONATION` | `SYSTEM`
- **ReportTargetType:** `COMMENT` | `NOVEL` | `CHAPTER`
- **ReportStatus:** `PENDING` | `RESOLVED` | `DISMISSED`
- **PayoutRequest status:** `PENDING` | `APPROVED` | `REJECTED` | `PAID`
- **PaymentOrder status:** `PENDING` | `PAID` | `FAILED` | `EXPIRED` | `CANCELLED`

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

Every external integration has a **mock fallback** so the app runs end-to-end without real API keys. The pattern is the same across all of them: log with a `[X MOCK]` prefix and return a synthetic success. Switching to live mode is always env-var driven.

- **`src/lib/email.ts`** (Resend) — `RESEND_API_KEY` unset → `[EMAIL MOCK]`. Helpers: `sendPasswordResetEmail`, `sendVerificationEmail`, `sendWelcomeEmail` (all Thai templates).
- **`src/lib/payment/omise.ts`** — `OMISE_SECRET_KEY` unset → `[OMISE MOCK]`. The real SDK is loaded via a runtime-computed module name so Turbopack does not attempt to resolve the `omise` package at build time; the package does not need to be installed for mock mode to work. Install `omise` only when going live.
- **`src/lib/payment/paysolutions.ts`** — Pay Solutions IPG. Mock mode when keys are unset; web checkout flow lives at `/api/payments/paysolutions/{create,return,postback,mock}` and `/(main)/wallet/{checkout,success,failed}`.
- **`src/lib/iap/google-play.ts`** — `IAP_GOOGLE_SERVICE_ACCOUNT_JSON` unset → `[IAP MOCK]` returns `{ ok: true, mock: true }` with a synthetic order id. Live mode dynamically imports `googleapis` via runtime-computed module name (so Turbopack doesn't bundle it). Requires `npm install googleapis` to go live; package is intentionally NOT in `package.json`.
- **`src/lib/admob/ssv.ts`** — `ADMOB_SSV_BYPASS=1` skips ECDSA signature verification (dev only). Live mode verifies against `https://www.gstatic.com/admob/reward/verifier-keys.json` with `node:crypto` only — no extra packages.
- **`src/lib/fcm.ts`** — `FCM_SERVICE_ACCOUNT_JSON` unset → `[FCM MOCK]`. Live mode signs an RS256 JWT with the service-account private key and exchanges it for an OAuth token — no SDK needed. Tokens that come back UNREGISTERED/INVALID are pruned from `device_tokens` automatically.

See `.env.example` for the full env var list. The full operator launch checklist (Google Play account, AdMob verification, App Links assetlinks.json, etc.) lives in the Memory project file `project_operator_setup.md`.

### Notifications

`src/lib/notification-service.ts` exports `notifyNovelFollowers(novelId, ...)` and `notifyAuthorFollowers(authorId, ...)`. These are wired into: chapter publish (POST/PUT in `src/app/api/novels/[novelId]/chapters/...`), comment create, and donation create. New notification-triggering events should call these helpers directly — do not write raw `db.notification.create()` calls at call sites.

"Followers" currently derives from `Bookmark` records for a novel (there's no separate follow-novel relation). The `Follow` model is user-to-user only.

Push delivery (FCM HTTP v1) lives in `src/lib/fcm.ts`. `notification-service.sendPushToUser` calls it for every in-app notification it creates and prunes dead device tokens reported by FCM (UNREGISTERED / INVALID_ARGUMENT). When `FCM_SERVICE_ACCOUNT_JSON` is unset, sending is a logged no-op — no need to short-circuit upstream.

### Mobile API (`/api/v1/*`)

A separate JWT/Bearer-authenticated API surface for the Flutter app. Sits alongside the cookie-based web routes; both go through `auth-utils.ts` (`requireAuth()` accepts either). Live endpoints:

- **Auth**: `POST /api/v1/auth/{token,register,refresh,logout}` — returns `{ accessToken, refreshToken, user }`. Tokens signed with `AUTH_SECRET`, access TTL 1h, refresh TTL 30d (`src/lib/jwt.ts`). `register` returns tokens immediately (mobile-friendly: email verification is non-blocking, gated per-feature). `logout` is stateless today — exists so a future denylist plugs in without changing the API.
- **User/notifications**: `GET /api/users/me` (already cookie-aware via Bearer fallback), `POST /api/v1/notifications/{register,unregister}-device`.
- **Daily check-in**: `GET /api/v1/checkin/status`, `POST /api/v1/checkin/claim`. Asia/Bangkok day boundary helpers in `src/lib/checkin.ts`. Reward table is `[2,2,3,3,5,5,10]` — locked, not configurable yet.
- **IAP (Google Play Billing)**: `GET /api/v1/iap/products` (public catalog, see `src/lib/iap/products.ts`), `POST /api/v1/iap/{verify,restore,rtdn-webhook}`. The `IapPurchase.purchaseToken` `@unique` constraint blocks replays; P2002 returns 409 `ALREADY_CONSUMED`. RTDN webhook is currently a logging stub.
- **AdMob rewarded ads**: `GET /api/v1/ads/rewards/{status,recent}`, `POST /api/v1/ads/rewards/request-token`, `GET /api/v1/ads/ssv-callback` (unauthenticated; ECDSA signature verifies the request). 5 coins/grant, 5/day cap, 5-min cooldown — denials still record an `AdReward` row with `verified=false` to keep `adNetworkTxId @unique` idempotent.
- **Notification delivery (mobile)**: same `notification-service.ts` flow as web; the `device_tokens` table holds FCM tokens registered by the Flutter app.

The mobile auth utilities also reject banned users (`auth-utils.getSessionFromBearerToken` checks `isBanned`).

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

`@/*` maps to `./src/*` (tsconfig.json). The `mobile/` directory is excluded from both TypeScript (`tsconfig.json` exclude) and ESLint (`eslint.config.mjs` globalIgnores) — that's where the Flutter app lives. See the Mobile App section below.

### SEO

Root layout uses `title.template: "%s | อลิน"`. `src/app/robots.ts` and `src/app/sitemap.ts` generate `/robots.txt` and `/sitemap.xml` dynamically from the database. Novel and chapter layout files export `generateMetadata` with OpenGraph (`type: 'book'`) and Twitter card fields. Novel detail pages inject JSON-LD `Book` schema with `aggregateRating`.

### File Uploads

Cover images uploaded via `POST /api/upload` to `public/uploads/covers/`. Accepted: JPG, PNG, WebP (max 5MB). Extension is derived from validated MIME type (not user-supplied filename). The route calls `mkdir({ recursive: true })` before writing — do not assume the directory exists. Returns `{ url, filename }`.

### Content Safety

- Chapter content rendered with `dangerouslySetInnerHTML` is sanitized via DOMPurify on the client in the reader.
- Comments are sanitized server-side via `sanitizeComment()` before persisting.
- Novels with `isAdult = true` show an age gate modal (`AgeGateModal`) on novel detail + chapter reader pages. Acceptance is stored in `localStorage` with a 30-day expiry.

## Mobile App

Flutter app lives in `mobile/`. See `mobile/CLAUDE.md` for the mobile-specific guide (provider/navigation pattern, API contract table, platform-specific quirks). `mobile/` is excluded from this project's TypeScript and ESLint configs.

**Current state**: Phase 1-7 of `docs/mobile-plan.md` shipped — auth, browse, reader, library, age gate, daily check-in, IAP top-up (Google Play Billing), rewarded ads + SSV, deep linking (alyn:// + Android App Links), file-based offline chapter cache. Phase 8 (production polish) is the remaining work.

**Stack deviations from the plan** (intentional, see `mobile/CLAUDE.md`): Provider + ChangeNotifier instead of Riverpod, custom `enum _Screen` switch in `_AppShell` instead of GoRouter, file-based JSON chapter cache instead of Drift+sqlcipher. The router migration becomes due if the app grows past ~8 screens — currently sitting right at that threshold.

**Known TODOs before launch** (same items live in `project_inflight_todos.md` Memory):
- Wire `firebase_messaging` SDK in the app (`mobile/lib/services/push_service.dart` already calls the backend — only Firebase init is missing).
- Replace AdMob test ad-unit IDs in `mobile/lib/services/rewarded_ad_service.dart`.
- Flip `android:autoVerify` to `true` in `mobile/android/app/src/main/AndroidManifest.xml` once the production keystore signs and `assetlinks.json` is published at `https://alyn.co/.well-known/`.
- Migrate `chapter_cache.dart` to Drift+sqlcipher for paid chapters.
- RTDN webhook (`/api/v1/iap/rtdn-webhook`) needs refund + subscription handlers.

## Brand Assets

Logo SVGs in `public/logo/` (Primary, Secondary, White variants). Brand guideline PDF and source files in `Alyn/Logo/` directory. Mock cover images used in seed data live in `public/uploads/covers/mock-*.jpeg`. Competitor analysis in `competitor-analysis.md`.
