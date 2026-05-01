# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`alyn_mobile` is the Flutter client for **Alyn (อลิน)** — a premium Thai novel reading/writing platform. It talks to the Next.js backend in the parent repo (`../`). The UI is entirely in Thai. The app supports guest browsing (no login) and becomes fully featured after signing in. Parent repo conventions are documented in `../CLAUDE.md`; this file covers mobile-specific concerns.

## Commands

- `flutter pub get` — Install dependencies
- `flutter analyze` — Lint + static analysis (uses `package:flutter_lints`). This is the only automated check; there is no test runner configured. Keep it clean.
- `flutter run -d macos` — Run on macOS (primary dev target — see "Platforms" below)
- `flutter run -d <device_id>` — Run on a specific device; `flutter devices` lists them
- `flutter build macos --debug` — Build without launching; produces `build/macos/Build/Products/Debug/alyn_mobile.app`
- `open build/macos/Build/Products/Debug/alyn_mobile.app` — Launch the built app detached from the CLI (survives terminal close)
- `flutter run --dart-define=API_BASE_URL=https://api.example.com` — Point the app at a non-default backend

## Backend dependency

The app requires the Next.js backend at `../` to be running. Start it from the parent repo with `nvm use 22 && npm run dev` (serves on `localhost:3000`). Without it, the Home/Discover/Detail screens show error states — the app itself still launches fine.

Demo accounts seeded by the backend: `reader@alyn.co` / `password123` (plus writer/admin variants — see `../CLAUDE.md`).

## Platforms

- **macOS desktop** is the primary dev target. iOS builds fail without the iOS 18.4 simulator runtime installed (Xcode 16.3 targets it by default).
- **Android** uses `10.0.2.2:3000` automatically for the emulator → host loopback. See `lib/api/config.dart`.
- **macOS sandbox requires network client entitlement.** Both `macos/Runner/DebugProfile.entitlements` and `macos/Runner/Release.entitlements` have `com.apple.security.network.client` set to true. Without it, `google_fonts` (downloads Noto Sans Thai from fonts.gstatic.com) and all API calls are blocked silently.

## Architecture

### State management: Provider + ChangeNotifier

Two top-level providers are wired in `main.dart` via `MultiProvider`:

- **`AuthProvider`** (`lib/state/auth_provider.dart`) — owns the session. States: `unknown` (booting) → `guest` | `authenticated`. During `unknown`, `_AppShell` shows a splash; screens should read `auth.isAuthenticated` to decide between guest CTA and authenticated content. `AuthProvider` also subscribes to `ApiClient.onSessionExpired` so a failed token refresh flips the app back to `guest` automatically.
- **`NovelsProvider`** (`lib/state/novels_provider.dart`) — caches home-screen data (trending, new releases, featured) and the genre list. Methods like `detail()`/`chapter()`/`byGenre()` are pass-throughs to `NovelService` — they return `Future<ApiNovel>` and callers manage their own local loading state (the Detail/Reader/Library screens each do this). Don't add one-off caches here without reason; the home + genres cache exists because those are fetched on every tab switch.

Screens read providers with `context.watch<T>()` to rebuild or `context.read<T>()` for one-shot calls. `initState` triggers fetches via `WidgetsBinding.instance.addPostFrameCallback` (since `context.read` isn't safe during `initState` itself).

### API layer

`lib/api/` has four concerns, deliberately split:

- **`config.dart`** — platform-aware `baseUrl` with `--dart-define=API_BASE_URL=...` override. Android emulator → `10.0.2.2:3000`; everything else → `localhost:3000`.
- **`api_client.dart`** — singleton Dio wrapper with interceptors:
  - Injects `Authorization: Bearer <accessToken>` on every request (skips `/api/v1/auth/token` and `/api/v1/auth/refresh`).
  - On 401 from a non-auth endpoint, calls `/api/v1/auth/refresh` with the stored refresh token, retries the original request on success, or fires `onSessionExpired` + clears tokens on failure. The `_refreshing` flag prevents concurrent refresh storms.
  - `ApiClient.toApiException()` is the canonical error funnel — services always wrap `DioException` through it. Surface `e.message` to users (backend returns Thai strings in the `error` field).
- **`token_storage.dart`** — wraps `flutter_secure_storage`; keys are `alyn_access_token` / `alyn_refresh_token`.
- **`models.dart`** — DTOs mirror the Next.js response field names (e.g., `coverImage`, `averageRating`, `_count: { chapters, bookmarks }`, `minCoinPrice`). `Paginated<T>.fromJson` reads `{ data: [...], pagination: {...} }` — matches the backend's `apiPaginated` helper. Single-resource endpoints return `apiSuccess({ novel })` → `{ novel: {...} }` (spread, no `data` wrapper); services call `body['novel']` directly. **Match exactly what the backend helper produces — mismatches are the top source of "data not showing" bugs.**
- **`services.dart`** — thin per-resource classes (`AuthService`, `NovelService`, `GenreService`, `UserService`, `BookmarkService`, `ProgressService`). Every method wraps Dio calls in `try/on DioException catch (e) { throw ApiClient.toApiException(e); }`.

### Adapter pattern for UI models

The UI layer (`lib/widgets/`, screens) was built against internal UI types (`Book`, `Genre`) before the API existed. Rather than refactor every widget, `lib/data/adapters.dart` maps API → UI types:

- `bookFromNovel(ApiNovel)` → `Book` (picks a cover spec deterministically from `id.hashCode % kBooks.length` for visual stability across loads, since the backend doesn't ship bitmap art)
- `genreFromApi(ApiGenre)` → `Genre` (color from fixed palette by hash of id)

**Keep using adapters** when adding new list/grid views — don't change widget signatures to take `ApiNovel` directly. `lib/data/mock_data.dart` (`kBooks`, `kGenres`) is retained only as the source of cover palettes and as offline fallback; don't read from it for production flows.

### Navigation

There is **no routing library**. `_AppShell` in `main.dart` is a single `StatefulWidget` that switches on an `enum _Screen { onboarding, login, main, detail, reader }` plus a `_tab` string. Deep flows carry state in fields (`_activeBook`, `_activeChapterId`). The main tabs are rendered via a plain `switch` against `_tab`.

When adding a new screen, add it to `_Screen`, wire the state field, and handle back-navigation manually (detail → main, reader → detail). If this grows beyond ~8 screens, consider `go_router` — until then, keep the switch simple.

### Reader HTML handling

The Next.js backend stores chapter bodies as HTML. `ReaderScreen._extractParagraphs` does light sanitization: replaces `</p>` and `<br>` with newlines, strips all other tags via regex, decodes a handful of HTML entities (`&nbsp;`, `&amp;`, etc.), then splits on blank lines. This is not a general HTML renderer — if chapters ever need images or inline formatting, swap to `flutter_html`. Drop cap styling lives in `_Paragraph`.

Locked (paid) chapters come back as `{ chapter: { locked: true, coinPrice, ... }, content: null }` — `_LockedView` handles display. **Do not call chapter-purchase APIs from here yet** (not implemented client-side); the locked view is display-only.

### Theme system

`ThemeController` (in `lib/theme/palette.dart`) is a `ChangeNotifier` that holds `ThemeMode` and exposes `AlynPalette` (rose light/dark presets ported from the web app's token system). `PaletteScope` is an `InheritedWidget` used via `PaletteScope.of(context)` — every screen reads colors this way, not from `Theme.of(context)`. Typography goes through `AlynFonts` in `lib/theme/typography.dart`, which wraps `google_fonts` for Noto Sans/Serif Thai, Fraunces (display), and JetBrains Mono.

### API response shape contracts

These must stay in sync with `../src/lib/api-response.ts`:

| Endpoint                             | Backend helper                  | Client reads                       |
|--------------------------------------|---------------------------------|------------------------------------|
| `GET /api/novels`                    | `apiPaginated(items, pag)`      | `body` via `Paginated.fromJson`    |
| `GET /api/novels/:id`                | `apiSuccess({ novel })`         | `body['novel']`                    |
| `GET /api/novels/:id/chapters/:cid`  | `apiSuccess({ chapter, prevChapter, nextChapter })` | `body['chapter']` + `prevChapter` + `nextChapter` |
| `GET /api/genres`                    | `apiSuccess({ genres })`        | `body['genres']`                   |
| `GET /api/bookmarks`                 | `apiSuccess({ bookmarks })`     | `body['bookmarks']`                |
| `GET /api/reading-progress`          | `apiSuccess({ history })`       | `body['history']`                  |
| `GET /api/users/me`                  | `apiSuccess({ user })`          | `body['user']`                     |
| `POST /api/v1/auth/token`            | returns `{ accessToken, refreshToken, user }` | top-level spread          |
| `POST /api/v1/auth/refresh`          | returns `{ accessToken, refreshToken }`       | top-level spread          |

## Not yet implemented

- Bookmark/unbookmark actions (list view only)
- Chapter purchase flow (locked view shows price but no purchase UI)
- Writer screens (placeholder `WriterScreen`)
- Follow user, review submission, donation, notifications
- Onboarding persistence (currently shows every cold start)

When adding these, reuse the service layer (`lib/api/services.dart`) and the existing adapter pattern; match whatever shape `apiSuccess(...)` produces in the corresponding `../src/app/api/...` route.
