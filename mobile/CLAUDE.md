# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Alyn Mobile (อลิน) is the React Native companion app for the Alyn Thai novel reading/writing platform. It connects to the Next.js web backend at `http://localhost:3000/api`. The entire UI is in Thai.

**Stack:** Expo 54 + React Native 0.81 + React 19 + TypeScript 5.9 (strict) + expo-router 6

## Commands

- `npx expo start` — Start Metro bundler
- `npx expo start --ios` — Start and open on iOS Simulator (installs Expo Go automatically)
- `npx expo start --clear` — Start with cleared Metro cache
- `npx tsc --noEmit` — Type check without emitting files
- `npm run lint` — ESLint via Expo

**Dependency management:** Use `--legacy-peer-deps` when installing packages due to React 19 peer dependency conflicts:
```bash
npm install <package> --legacy-peer-deps
```

After adding Expo-compatible packages, prefer `npx expo install <package>` which auto-resolves SDK-compatible versions.

## Architecture

### Routing (expo-router file-based)

Three route groups in `app/`:

- **`(tabs)/`** — Bottom tab navigator with 4 tabs: Home (หน้าแรก), Explore (สำรวจ), Library (ชั้นหนังสือ), Profile (โปรไฟล์)
- **`(auth)/`** — Auth stack: login, register (full-screen, no tab bar)
- **`novel/[id]/`** — Nested stack: novel detail (`index.tsx`) and chapter reader (`chapter/[chapterId].tsx`)

Route files are thin re-exports from screen components:
```typescript
// app/(tabs)/index.tsx
export { default } from '@/components/screens/HomeScreen';
```

Root `_layout.tsx` wraps everything in `SafeAreaProvider` and `AuthProvider`.

### Screen Components

All screens live in `src/components/screens/` as default exports. They are the primary working files — route files in `app/` are just re-exports.

### Theme System

Five modules in `src/theme/`, all re-exported from `src/theme/index.ts`:

```typescript
import { colors, typography, spacing, borderRadius, shadows } from '@/theme';
```

Key patterns:
- **Typography sizes** use `.size` and `.lineHeight`: `typography.fontSize.xl.size` (not `.fontSize` directly)
- **`borderRadius`** is a **separate export** from spacing: `borderRadius.lg` (not `spacing.borderRadius.lg`)
- **Brand colors**: `colors.brand.rosegold` (#CB8A7C), `colors.brand.cream` (#FFF4F1), `colors.brand.rosegoldDark` (#9D5E55)
- **Coin color**: `colors.coin.primary` (#D4A034)
- **Text colors**: `colors.text.primary`, `colors.text.secondary`, `colors.text.inverse`
- **Reader themes**: `colors.reader.default`, `.sepia`, `.night`, `.dark` (each has `background`/`foreground`)
- Font family: Noto Sans Thai — `typography.fontFamily.regular`, `.medium`, `.semiBold`, `.bold`

### UI Components

All in `src/components/ui/` with barrel export from `index.ts`:

| Component | Key Props |
|-----------|-----------|
| `Button` | `variant` (primary/secondary/outline/ghost/coin), `size` (sm/md/lg), `children`, `loading`, `fullWidth` |
| `NovelCard` | `id`, `title`, `coverImage`, `author` (string), `genre` (string), `rating`, `viewCount`, `chapterCount`, `variant` (grid/horizontal/featured) |
| `Badge` | `label`, `variant` (default/outline/status/genre), `size` (sm/md) |
| `Input` | `label`, `leftIcon` (Ionicons glyph string), `secureTextEntry`, `error` |
| `SectionHeader` | `title`, `onSeeAllPress` |
| `CoinBadge` | `count` |
| `EmptyState` | `icon` (Ionicons glyph), `title`, `description`, `actionLabel`, `onActionPress` |

Icons: **Ionicons** exclusively via `@expo/vector-icons`.

### API Client

`src/services/api.ts` exports `apiClient` — an HTTP client that:
- Base URL: `http://localhost:3000/api` (configurable via `Constants.expoConfig.extra.apiUrl`)
- Auto-attaches Bearer token from `expo-secure-store`
- Auto-refreshes on 401 via `POST /v1/auth/refresh`
- Methods: `get<T>`, `post<T>`, `put<T>`, `delete<T>`, `uploadFile<T>`

### Authentication

`src/contexts/AuthContext.tsx` provides `useAuth()`:

```typescript
const { user, isAuthenticated, isLoading, login, register, logout, updateUser } = useAuth();
```

- Login: `POST /v1/auth/token` — returns `{ data: { accessToken, refreshToken, user } }`
- Register: `POST /auth/register` — then auto-logins
- Load stored auth: `GET /users/me` — returns `{ data: { user } }`
- Tokens stored in `expo-secure-store` as `auth_token` and `refresh_token`

### Backend API

The mobile app connects to the Alyn web backend. Key endpoints:

- `GET /api/novels?sort=popular|latest|updated&status=COMPLETED&genre=<id>&limit=20&page=1`
- `GET /api/novels/[novelId]` — novel detail with chapters
- `GET /api/novels/[novelId]/chapters/[chapterId]` — chapter content (null if locked)
- `GET /api/genres` — returns `{ data: { genres: [...] } }`
- `GET /api/search?q=<term>` — search novels
- `GET /api/bookmarks` — user's bookmarks
- `POST /api/bookmarks` — toggle bookmark `{ novelId }`
- `POST /api/coins/purchase` — buy chapter `{ chapterId }`
- `GET /api/reading-progress` — reading history
- `POST /api/reading-progress` — save progress `{ chapterId }`

All list endpoints return `{ data: [...], pagination: { page, limit, total, totalPages } }`.

Novel objects have nested relations: `author: { id, name, penName }`, `genre: { id, name, slug }`, `_count: { chapters, bookmarks }`.

Cover images are relative paths (e.g., `/uploads/covers/xxx.jpg`) — prepend backend base URL to display them.

### Path Alias

`@/*` maps to `./src/*` (tsconfig.json).

### Styling Conventions

- All styling via `StyleSheet.create()` — no styled-components or NativeWind
- Theme values used directly: `colors.brand.rosegold`, `spacing.base`, `typography.fontSize.md.size`
- Shadows spread: `...shadows.md`
- Bracket notation for numeric keys: `spacing['3xl']`, `typography.fontSize['2xl'].size`
- SafeAreaView from `react-native-safe-area-context` (not from `react-native`)

## Web Backend Reference

The web backend is in the parent directory (`/Alyn/`). See its `CLAUDE.md` for full backend documentation. Demo accounts: `reader@alyn.co` / `password123`.
