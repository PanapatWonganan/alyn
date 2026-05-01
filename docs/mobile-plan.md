# 📱 Alyn Mobile App — Flutter Development Plan

> แผนพัฒนาแอป mobile สำหรับ Alyn (อลิน) — แพลตฟอร์มนิยายออนไลน์ไทย
> Last updated: 2026-04-10

---

## 🎯 1. เป้าหมายและขอบเขต

### 1.1 Positioning
- **Reader-focused app** — เน้นประสบการณ์อ่านที่ดีที่สุดในมือถือ
- ไม่มีฟีเจอร์เขียนนิยาย (ให้ใช้เว็บ)
- ใช้แทนเวอร์ชันเดิม (React Native) ที่ลบออกไปแล้ว
- **Platform target v1**: **Android เท่านั้น** (iOS เพิ่มทีหลังเมื่อ Android เสถียร)
- **Payment**: **Google Play Billing** (IAP) — ใช้ระบบของ Play Store

### 1.2 ฟีเจอร์ที่มี
- เรียกดู/ค้นหานิยาย, อันดับ, สำรวจตามหมวด
- อ่านนิยาย (reader themes, font size, offline cache)
- Login / Register / Profile
- Library (bookmark, reading progress)
- Wallet (เติมเหรียญ, ซื้อตอน, donate)
- คอมเมนต์, แจ้งเตือน
- **Daily Check-in + Rewarded Ads** (ระบบใหม่)

### 1.3 ฟีเจอร์ที่ไม่มี (ใช้เว็บแทน)
- เขียน/แก้ไขนิยาย, TipTap editor
- Admin panel
- Writer dashboard / analytics

---

## 🏗️ 2. Tech Stack

| ด้าน | เลือกใช้ | เหตุผล |
|---|---|---|
| Framework | **Flutter 3.x** (Dart 3) | Cross-platform, UI สวย, perf ดี |
| State mgmt | **Riverpod 2** | Type-safe, testable, modern |
| Routing | **GoRouter** | Declarative, deep linking |
| HTTP | **Dio** + Retrofit | Interceptor, auto-retry, codegen |
| Local DB | **Drift** (SQLite) | Offline cache นิยาย/ตอน |
| Secure storage | **flutter_secure_storage** | เก็บ JWT token |
| Auth | JWT Bearer (API ใหม่) | แยกจาก NextAuth cookie |
| Rich text | **flutter_html** | Render chapter HTML |
| Fonts | **Noto Sans Thai** | ตรงกับเว็บ |
| Ads | **google_mobile_ads** | AdMob rewarded ads |
| Consent | **UserMessagingPlatform** | GDPR consent |
| i18n | intl (Thai only) | |
| Analytics | Firebase Analytics (optional) | |

---

## 📂 3. โครงสร้างโปรเจกต์ (Feature-first)

```
mobile/
├── lib/
│   ├── main.dart
│   ├── app.dart                      # MaterialApp + router + theme
│   ├── core/
│   │   ├── theme/                    # Alyn brand colors, typography
│   │   ├── router/                   # GoRouter config
│   │   ├── network/                  # Dio client + interceptors
│   │   ├── storage/                  # Secure storage, Drift DB
│   │   ├── ads/                      # AdMob service (shared)
│   │   ├── constants/
│   │   └── utils/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── data/                 # repository, API, models
│   │   │   ├── domain/               # entities, use cases
│   │   │   └── presentation/         # screens, widgets, providers
│   │   ├── home/
│   │   ├── explore/
│   │   ├── ranking/
│   │   ├── novel/                    # detail page
│   │   ├── reader/                   # chapter reader
│   │   ├── library/
│   │   ├── wallet/
│   │   ├── profile/
│   │   ├── notifications/
│   │   └── rewards/                  # ← Daily check-in + rewarded ads
│   └── shared/
│       ├── widgets/                  # NovelCard, Button, etc.
│       └── models/                   # common DTOs
├── assets/
│   ├── fonts/NotoSansThai/
│   ├── images/
│   └── logo/
├── test/
└── pubspec.yaml
```

---

## 🔐 4. Backend API สำหรับ Mobile

NextAuth ใช้ cookie-based session ซึ่งไม่เหมาะกับ mobile — ต้องสร้าง **JWT Bearer API** แยก

### 4.1 Endpoints ใหม่ที่ต้องเพิ่ม
```
POST /api/v1/auth/login          → { accessToken, refreshToken, user }
POST /api/v1/auth/register
POST /api/v1/auth/refresh        → { accessToken }
POST /api/v1/auth/logout
GET  /api/v1/me
```

### 4.2 Endpoints ที่ reuse ได้ (เพิ่ม Bearer auth middleware)
```
GET  /api/novels                 # list + filter + sort
GET  /api/novels/[id]
GET  /api/novels/[id]/chapters
GET  /api/chapters/[id]
GET  /api/genres
GET  /api/search
POST /api/bookmarks
GET  /api/library
POST /api/chapters/[id]/purchase
POST /api/wallet/topup
POST /api/comments
GET  /api/notifications
```

### 4.3 Endpoints สำหรับ Rewards System (ใหม่)
```
GET  /api/v1/checkin/status
  → { canCheckIn, currentStreak, nextReward, lastCheckInAt }

POST /api/v1/checkin/claim
  → { success, coinsEarned, newStreak, newBalance }

GET  /api/v1/ads/rewards/status
  → { remaining, maxPerDay, nextAvailableAt }

POST /api/v1/ads/rewards/request-token
  body: { adUnitId }
  → { customData: string }      # ส่งกลับไปใส่ใน SSV callback

POST /api/v1/ads/ssv-callback    # Google เรียก (ไม่ต้อง auth)
  → grant coin หลัง verify signature

GET  /api/v1/ads/rewards/recent
  → แสดงสถานะว่า coin ถูก grant แล้วหรือยัง (สำหรับ client poll)
```

### 4.4 Auth middleware
- แก้ `src/lib/auth-utils.ts` ให้รองรับทั้ง cookie (เว็บ) และ `Authorization: Bearer <token>` (mobile)
- JWT secret แยกจาก NextAuth secret
- Access token TTL: 15 นาที, Refresh token TTL: 30 วัน

---

## 🎨 5. Design System

### 5.1 Colors (ตรงกับเว็บ)
```dart
class AlynColors {
  static const rosegold = Color(0xFFCB8A7C);
  static const rosegoldDark = Color(0xFF9D5E55);
  static const cream = Color(0xFFFFF4F1);
  static const brandBlack = Color(0xFF2D1B18);
  static const coin = Color(0xFFD4A034);
}
```

### 5.2 Typography
- Font: **Noto Sans Thai** (bundled as asset)
- Headings: 600-700 weight
- Body: 400 weight
- Reader: ปรับขนาดได้ 14-24pt

### 5.3 Reader Themes
- `default` — cream bg, brand-black text
- `sepia` — warm sepia tone
- `night` — dark gray bg, soft white text
- `dark` — pure black bg

### 5.4 Component Library
- `AlynButton` — variants: primary / secondary / outline / ghost / coin
- `NovelCard` — ตรงกับเว็บ
- `GenreChip`, `TagChip`
- `CoinBadge` — แสดงราคา/จำนวนเหรียญ
- Icons: `lucide_icons` package

---

## 🗺️ 6. Screens (15 หน้า)

| # | Screen | Route | Notes |
|---|---|---|---|
| 1 | Splash / Onboarding | `/` | Auto-redirect |
| 2 | Login | `/auth/login` | |
| 3 | Register | `/auth/register` | |
| 4 | Home | `/home` | Bottom nav |
| 5 | Explore | `/explore` | Bottom nav |
| 6 | Ranking | `/ranking` | |
| 7 | Search | `/search` | |
| 8 | Novel Detail | `/novel/:id` | |
| 9 | Reader | `/novel/:id/chapter/:chapterId` | Full screen |
| 10 | Library | `/library` | Bottom nav |
| 11 | Wallet | `/wallet` | Bottom nav |
| 12 | Profile | `/profile` | Bottom nav |
| 13 | User public profile | `/user/:userId` | |
| 14 | Notifications | `/notifications` | |
| 15 | **Daily Check-in** | `/rewards/checkin` | Modal หรือ full page |

**Bottom nav bar** (5 tabs): Home · Explore · Library · Wallet · Profile

---

## 🎁 7. Daily Check-in + Rewarded Ads System

### 7.1 Concept
- **Daily Check-in**: เปิดแอปทุกวัน → กดรับเหรียญฟรี → streak ยิ่งยาว ยิ่งได้เยอะ
- **Rewarded Ad**: หลัง check-in กดดูวิดีโอโฆษณาเพิ่ม → ได้เหรียญ bonus → จำกัดต่อวัน

### 7.2 Reward Structure (lock แล้ว)

**Daily Check-in (7-day cycle):**
```
Day 1  →  2 coins
Day 2  →  2 coins
Day 3  →  3 coins
Day 4  →  3 coins
Day 5  →  5 coins
Day 6  →  5 coins
Day 7  →  10 coins  (bonus day)
────────────────────
รวม 1 สัปดาห์ = 30 coins

Day 8+ → reset กลับไป Day 1 (เริ่ม cycle ใหม่)
```

**Rewarded Ad Bonus:**
```
ดูวิดีโอ 1 ครั้ง    →  +5 coins
จำกัด                →  5 ครั้ง/วัน
Cooldown             →  5 นาทีระหว่างครั้ง
────────────────────
สูงสุด = 25 coins/วัน จาก ads
```

**รวมสูงสุดต่อวัน**: ~14 coin (check-in 4.3 + ad 25) ≈ **~29 coin/วัน**
**รวมต่อเดือน (max)**: ~870 coin

### 7.3 Streak Logic
- ใช้ timezone **Asia/Bangkok**
- เช็คอินได้วันละ 1 ครั้ง (00:00-23:59)
- ข้ามวัน 1 วัน → streak reset เป็น Day 1
- ไม่มี streak freeze (เริ่มแรก — เพิ่มทีหลังได้ถ้าผู้ใช้ขอ)

### 7.4 Rate Limiting
- Check-in: 1 ครั้ง/วัน (hard limit ด้วย DB unique constraint)
- Ad reward: 5 ครั้ง/วัน, cooldown 5 นาที
- Reset counter ทุก 00:00 Asia/Bangkok

### 7.5 Database Schema (Prisma migration)

```prisma
model DailyCheckIn {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  checkedInAt  DateTime @default(now())
  streakDay    Int      // 1-7
  coinsEarned  Int
  createdAt    DateTime @default(now())

  @@index([userId, checkedInAt])
}

model AdReward {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  adUnitId      String
  rewardType    String   // "daily_bonus" | "extra_coins"
  coinsEarned   Int
  adNetworkTxId String?  @unique  // SSV transaction id (ป้องกัน replay)
  verified      Boolean  @default(false)
  createdAt     DateTime @default(now())

  @@index([userId, createdAt])
}

// เพิ่มใน User model
model User {
  // ... existing
  currentStreak    Int       @default(0)
  longestStreak    Int       @default(0)
  lastCheckInDate  DateTime?
  adRewardsToday   Int       @default(0)
  adRewardsDate    DateTime?
  lastAdRewardAt   DateTime?
  checkIns         DailyCheckIn[]
  adRewards        AdReward[]
}

enum TransactionType {
  TOPUP
  PURCHASE
  EARNING
  DONATION_SENT
  DONATION_RECEIVED
  CHECK_IN_REWARD    // ← ใหม่
  AD_REWARD          // ← ใหม่
}
```

### 7.6 AdMob Server-Side Verification (SSV)

**ทำไมต้องมี**: ถ้าเชื่อ client ว่า "ดูจบแล้ว" → cheat ง่าย แจกเหรียญฟรีไม่จำกัด
**ตัดสินใจ**: ใช้ SSV ตั้งแต่แรก (ปลอดภัยกว่า, ไม่ต้อง migrate ทีหลัง)

**Flow:**
```
1. [App] ขอ custom data token จาก backend
          POST /api/v1/ads/rewards/request-token
          ← { customData: "<signed-token>" }

2. [App] Load rewarded ad ด้วย google_mobile_ads
          Set ServerSideVerificationOptions(customData: token)

3. [User] ดูวิดีโอจนจบ

4. [Google AdMob] ส่ง SSV callback ไปยัง:
          GET /api/v1/ads/ssv-callback?
              ad_network=...&
              ad_unit=...&
              custom_data=<token>&
              reward_amount=...&
              reward_item=...&
              timestamp=...&
              transaction_id=...&
              user_id=...&
              signature=...&
              key_id=...

5. [Backend]
          - Verify ECDSA signature ด้วย Google public keys
            (https://gstatic.com/admob/reward/verifier-keys.json)
          - Decode custom_data → เอา userId
          - Check transaction_id ไม่ซ้ำ (unique constraint)
          - db.$transaction():
              • Create AdReward record (verified=true)
              • Update user.coinBalance += 5
              • Update user.adRewardsToday += 1
              • Create CoinTransaction (type=AD_REWARD)

6. [App] Poll GET /api/v1/ads/rewards/recent
          → เมื่อเจอ record ใหม่ → อัพเดต UI balance
          (หรือใช้ WebSocket/SSE ถ้าอยากเร็วกว่า)
```

**Security:**
- SSV endpoint ต้อง verify signature **เสมอ** — ห้ามข้าม
- Rate limit IP ที่เรียก SSV (ป้องกัน DoS)
- Log ทุก SSV request สำหรับ audit

### 7.7 Flutter Implementation

**Packages:**
```yaml
dependencies:
  google_mobile_ads: ^5.0.0
  # ... เดิม: dio, flutter_riverpod, go_router, flutter_secure_storage
```

**Provider structure:**
```dart
// features/rewards/presentation/providers/checkin_controller.dart
@riverpod
class CheckInController extends _$CheckInController {
  @override
  Future<CheckInStatus> build() async {
    return ref.read(checkInRepoProvider).getStatus();
  }

  Future<CheckInResult> claim() async {
    final result = await ref.read(checkInRepoProvider).claim();
    ref.invalidate(walletProvider);
    ref.invalidateSelf();
    return result;
  }
}

// core/ads/rewarded_ad_service.dart
class RewardedAdService {
  RewardedAd? _ad;
  final Dio _dio;

  Future<void> loadAd() async { /* ... */ }

  Future<void> show({required String userId}) async {
    if (_ad == null) return;

    // 1. Request custom data token
    final tokenRes = await _dio.post('/api/v1/ads/rewards/request-token');
    final customData = tokenRes.data['customData'];

    // 2. Set SSV options
    _ad!.setServerSideOptions(
      ServerSideVerificationOptions(
        userId: userId,
        customData: customData,
      ),
    );

    // 3. Show
    _ad!.show(onUserEarnedReward: (ad, reward) {
      // ไม่ต้อง grant ที่นี่ — backend จะทำผ่าน SSV
      // แค่ trigger UI "กำลังยืนยัน..." → poll rewards/recent
    });
  }
}
```

### 7.8 UI Mockups

**Home Screen Banner:**
```
┌─────────────────────────────┐
│ 🎁 รับเหรียญวันนี้!        │
│ Day 3/7 · +3 coins          │
│              [ เช็คอิน → ]  │
└─────────────────────────────┘
```

**Check-in Modal:**
```
┌─────────────────────────────┐
│       🔥 Streak 3 วัน        │
│                              │
│  [1] [2] [3] [4] [5] [6] [7]│
│   ✓    ✓    ●                │
│                              │
│   🪙 +3 เหรียญ               │
│                              │
│   [  รับเหรียญ  ]            │
│                              │
│  ───────── หรือ ─────────   │
│                              │
│   📺 ดูวิดีโอรับ +5 เหรียญ  │
│   (เหลือ 5/5 ครั้งวันนี้)    │
└─────────────────────────────┘
```

**Wallet → "หาเหรียญฟรี" Tab:**
- ปุ่ม Daily Check-in (disabled ถ้าเช็คแล้ววันนี้)
- ปุ่มดูวิดีโอ (แสดง remaining count + cooldown)
- ประวัติ reward ล่าสุด

### 7.9 Abuse Prevention
1. **Rate limit**: 1 check-in/วัน, 5 ad rewards/วัน (ปรับได้จาก admin)
2. **SSV signature verification**: ห้ามข้าม
3. **Transaction ID uniqueness**: ป้องกัน replay
4. **Cooldown enforcement**: ฝั่ง backend
5. **Device fingerprinting** (optional, phase 2)
6. **Emulator detection** (optional, phase 2)

### 7.10 Policy Compliance
- **Apple / Google**: แยกให้ชัด — ad reward = "แจก" ไม่ใช่ "ขาย" virtual currency
- **GDPR consent**: ใช้ `UserMessagingPlatform` แสดง consent dialog ครั้งแรกเปิดแอป
- **COPPA**: `tagForChildDirectedTreatment: false` (เพราะมีเนื้อหา 18+)
- **Age gate**: ยืนยันอายุก่อนเข้าแอป (จำเป็นเพราะ 18+)

---

## 🚀 8. Implementation Phases

### Phase 1 — Foundation
- สร้างโปรเจกต์ Flutter ใน `mobile/`
- ติดตั้ง dependencies หลัก
- Theme + routing + Dio client skeleton
- Folder structure
- CI (flutter analyze, test)

### Phase 2 — Backend API for Mobile
- เพิ่ม JWT auth endpoints (`/api/v1/auth/*`)
- แก้ `auth-utils.ts` รองรับ Bearer token
- API versioning layer
- E2E test ด้วย Postman/Thunder

### Phase 3 — Auth + Navigation
- Login / Register screens
- Secure token storage + auto-refresh interceptor
- GoRouter redirect guard
- Splash screen + age gate

### Phase 4 — Browse & Discovery
- Home (trending, latest, genres)
- Explore, Ranking, Search
- NovelCard widget + infinite scroll

### Phase 5 — Reading Experience
- Novel detail page
- Chapter reader (themes, font size, brightness)
- Reading progress tracking
- Offline cache ด้วย Drift

### Phase 6 — Library & Social
- Bookmarks, reading history
- Comments
- Notifications
- User profile

### Phase 7 — Monetization (Google Play Billing)
- Setup Google Play Console + In-app products (coin packs)
- `in_app_purchase` Flutter package integration
- Server-side receipt verification (Google Play Developer API)
- Wallet: เติมเหรียญผ่าน IAP, ประวัติ transaction
- ซื้อตอน (coin purchase) — ใช้ coin balance ในระบบ
- Donation — ใช้ coin balance ในระบบ

### Phase 7.5 — Rewards System (NEW) ⭐
**Backend:**
- Prisma migration (DailyCheckIn, AdReward, User fields)
- API endpoints (`/api/v1/checkin/*`, `/api/v1/ads/*`)
- AdMob SSV callback handler + signature verification
- Update CoinTransaction enum
- Unit tests for economy logic

**Flutter:**
- `google_mobile_ads` integration
- GDPR consent flow (UserMessagingPlatform)
- Check-in UI (banner + modal)
- Rewarded ad service + provider
- Streak tracking display
- Wallet "หาเหรียญฟรี" tab

**Admin (เว็บ):**
- หน้าดู stats: check-in DAU, ad revenue, abuse detection
- Config: ปรับ reward amounts จาก DB (ไม่ hardcode)

### Phase 8 — Polish & Launch
- App icon + splash + store listings
- Performance tuning
- Crash reporting (Sentry/Firebase Crashlytics)
- Analytics events
- Beta testing → Production release

---

## ⚠️ 9. ประเด็นที่ต้องตัดสินใจเพิ่มเติม

### 9.1 Decided ✅
- ✅ Reward amounts (Day 1-7: 2/2/3/3/5/5/10, Ad: +5, 5/วัน)
- ✅ ใช้ SSV ตั้งแต่แรก
- ✅ ไม่มี streak freeze (ยัง)
- ✅ Cooldown 5 นาทีระหว่าง ads
- ✅ Streak reset แบบเคร่ง (ขาด 1 วัน = reset)
- ✅ Timezone Asia/Bangkok
- ✅ Monorepo (mobile/ อยู่ใน root ของ alyn repo)
- ✅ **Platform target**: **Android only** ก่อน (iOS ทำทีหลัง)
- ✅ **Payment (Android)**: **Google Play Billing** (IAP) — ใช้ระบบของ Play Store
- ✅ **Push notifications**: Firebase Cloud Messaging (FCM)
- ✅ **Deep linking**: `alyn://novel/:id`, `alyn://chapter/:id` + Android App Links
- ✅ **Offline cache**: encrypted (ใช้ sqlcipher ผ่าน Drift สำหรับตอนที่ซื้อแล้ว)
- ✅ **AdMob account**: ต้องสมัคร + verify ก่อนเริ่ม Phase 7.5 (ใช้เวลา 1-2 สัปดาห์ — เริ่มทำคู่ขนาน)

### 9.2 Pending ⏳
- ⏳ iOS version — พิจารณาหลัง Android launch เสถียรแล้ว

---

## 💳 9.5 Google Play Billing (IAP) — รายละเอียด

### 9.5.1 Concept
- ใช้ **Google Play Billing Library** (ผ่าน Flutter `in_app_purchase` package)
- ผู้ใช้ซื้อ "coin pack" ด้วยเงินจริง → Google หัก fee (15% สำหรับ revenue ≤ $1M/ปี, 30% หลังจากนั้น)
- หลังซื้อสำเร็จ → backend verify receipt กับ Google Play Developer API → เพิ่ม coin ใน `user.coinBalance`
- **Coin คือ virtual currency ภายในแอป** — ใช้ซื้อตอน/donate ได้เฉพาะในแอป (ตรงตาม Play policy)

### 9.5.2 Coin Packs (ตัวอย่าง — ปรับได้)
```
Pack  1  →  ฿ 35    →   50 coin
Pack  2  →  ฿ 99    →  150 coin   +  5 bonus  = 155
Pack  3  →  ฿ 199   →  300 coin   + 20 bonus  = 320
Pack  4  →  ฿ 399   →  600 coin   + 60 bonus  = 660
Pack  5  →  ฿ 799   → 1200 coin   + 150 bonus = 1350
Pack  6  →  ฿ 1,590 → 2400 coin   + 400 bonus = 2800
```

### 9.5.3 Product IDs (Google Play Console)
```
alyn.coins.pack1   (consumable)
alyn.coins.pack2   (consumable)
alyn.coins.pack3   (consumable)
alyn.coins.pack4   (consumable)
alyn.coins.pack5   (consumable)
alyn.coins.pack6   (consumable)
```
**ต้องเป็น `consumable`** — ไม่ใช่ subscription หรือ non-consumable (เพราะซื้อซ้ำได้)

### 9.5.4 Flow
```
1. [Flutter] แสดงหน้า "เติมเหรียญ" → fetch products ด้วย InAppPurchase.queryProductDetails()
2. [User] เลือก pack → กดซื้อ → InAppPurchase.buyConsumable(purchaseParam)
3. [Google Play] แสดง dialog ชำระเงิน → user ยืนยัน
4. [Flutter] ได้ PurchaseDetails พร้อม purchaseToken → POST /api/v1/iap/verify
            body: { productId, purchaseToken, packageName }
5. [Backend]
   - เรียก Google Play Developer API: purchases.products.get(packageName, productId, token)
   - Verify: purchaseState = 0 (purchased), consumptionState, acknowledged
   - Check purchaseToken ไม่ซ้ำ (unique constraint)
   - db.$transaction():
     • Create CoinTransaction (type=TOPUP, source=GOOGLE_PLAY)
     • Update user.coinBalance += coins
     • Create IapPurchase record (verified=true)
6. [Backend] Acknowledge purchase ผ่าน Google API (ภายใน 3 วัน!)
            purchases.products.acknowledge()
7. [Backend] → 200 { newBalance }
8. [Flutter] consumePurchase() → ให้ user ซื้อซ้ำได้
```

### 9.5.5 Database Schema
```prisma
model IapPurchase {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  productId       String   // "alyn.coins.pack1"
  purchaseToken   String   @unique
  orderId         String?
  platform        String   // "google_play" (future: "app_store")
  coinsGranted    Int
  priceAmountMicros String? // จาก Google
  currency        String?  // "THB"
  verified        Boolean  @default(false)
  acknowledged    Boolean  @default(false)
  createdAt       DateTime @default(now())

  @@index([userId, createdAt])
}

enum TransactionSource {
  GOOGLE_PLAY
  APPLE_APP_STORE
  MANUAL
}
```

### 9.5.6 API Endpoints
```
GET  /api/v1/iap/products
  → { products: [{ productId, name, coins, bonus, price }] }
  (ตัวเลขตรงกับ Play Console)

POST /api/v1/iap/verify
  body: { productId, purchaseToken, packageName }
  → { success, newBalance, transactionId }

POST /api/v1/iap/restore
  body: { purchases: [...] }
  → restore purchases ที่ verify ไม่ผ่าน (เผื่อ network fail)

POST /api/v1/iap/rtdn-webhook    # Real-time Developer Notifications (optional)
  → Google ส่ง event เช่น refund, chargeback
```

### 9.5.7 Security
- **Receipt verification ทุกครั้งฝั่ง backend** — ห้ามเชื่อ client
- **Purchase token unique constraint** — ป้องกัน replay
- **Acknowledge ภายใน 3 วัน** — ถ้าไม่ ack, Google จะ refund อัตโนมัติ!
- **Handle refunds**: ตั้ง Google Play RTDN webhook → ถ้ามี refund → หัก coin คืน (ถ้า balance พอ)
- **Service account**: ใช้ Google Cloud service account เรียก Play Developer API (ไม่ใช่ user OAuth)

### 9.5.8 Flutter Package
```yaml
dependencies:
  in_app_purchase: ^3.2.0
```

### 9.5.9 Pre-launch Checklist
- [ ] สร้าง Google Cloud project + service account
- [ ] Enable Google Play Developer API
- [ ] Link service account กับ Play Console
- [ ] สร้าง in-app products ใน Play Console (6 packs)
- [ ] Upload signed APK + ตั้ง app เป็น "Internal testing" track
- [ ] ทดสอบซื้อด้วย test account (ไม่เสียเงินจริง)
- [ ] ทดสอบ refund flow
- [ ] ทดสอบ restore purchases

---

## 📦 10. Monorepo Structure

```
alyn/
├── src/                 # Next.js เว็บ (เดิม)
├── prisma/              # DB schema (shared)
├── public/
├── mobile/              # Flutter app (ใหม่)
│   ├── lib/
│   ├── android/
│   ├── ios/
│   └── pubspec.yaml
└── docs/
    ├── mobile-plan.md   # ← ไฟล์นี้
    └── api/             # API contract (shared)
```

- `mobile/` อยู่ใน root เพื่อ share Prisma schema + API docs
- เพิ่ม `mobile/` ใน `.gitignore` ของ Next.js build (ทำแล้ว: `tsconfig.json`, `eslint.config.mjs`)

---

## 💰 11. ประมาณการรายได้

### Ad Revenue (Rewarded Ads)
```
สมมติ DAU = 1,000 คน
ผู้ใช้ดู ad เฉลี่ย 3 ครั้ง/วัน = 3,000 ads/day
eCPM ประเทศไทย (rewarded) ≈ $3-8 → ใช้ $5
รายได้ = 3,000 × $5 / 1,000 = $15/วัน
      ≈ $450/เดือน ($5,400/ปี)

ถ้า DAU = 10,000:
      ≈ $4,500/เดือน ($54,000/ปี)
```

### Coin Economy Balance
```
ผู้ใช้ขยันสุด (ทุกวัน + ดู ad เต็ม):
  - Check-in: ~4.3 coin/วัน
  - Ad: 25 coin/วัน
  - รวม: ~29 coin/วัน → ~870/เดือน

ตอนนิยายราคา 5 coin:
  → อ่านฟรีได้ ~174 ตอน/เดือน

ผู้ใช้ทั่วไป (check-in อย่างเดียว):
  - ~130 coin/เดือน → ~26 ตอน/เดือน
```

---

## 📋 12. Ready to Start Checklist

ก่อนเริ่ม Phase 1 ต้องเตรียม:

### Accounts & Keys
- [ ] **Google Play Developer account** ($25 one-time) — ต้องมีก่อน
- [ ] **AdMob account** + verify (ใช้เวลา 1-2 สัปดาห์)
- [ ] **Firebase project** (analytics, crashlytics, FCM)
- [ ] **Google Cloud project** + service account สำหรับ Play Developer API
- [ ] **SHA-1/SHA-256** signing keys (สำหรับ App Links + Firebase)

### Code Setup
- [ ] Flutter SDK installed (latest stable)
- [ ] Android Studio (Android SDK, emulator)
- [ ] `mobile/` directory created
- [ ] API versioning folder `/api/v1/` (Next.js)
- [ ] `google-services.json` ไว้ใน `mobile/android/app/`

### Design
- [ ] Export brand colors + fonts
- [ ] Design mockups สำหรับหน้าหลัก (optional — ใช้ component library ของเว็บเป็น ref)
- [ ] App icon (adaptive icon สำหรับ Android)
- [ ] Splash screen asset

---

## 🎬 13. Recommended Starting Point

**แนะนำลำดับ:**
1. **Phase 2 ก่อน** (Backend JWT API) — เพราะ Flutter ใช้ API ไม่ได้ถ้ายังไม่มี
2. **Phase 1** (Flutter skeleton) — parallel กับ Phase 2 ได้ถ้ามีคน 2 คน
3. **Phase 3-7** ตามลำดับ
4. **Phase 7.5** (Rewards) — ทำหลัง wallet พื้นฐานเสร็จ
5. **Phase 8** — launch

**เริ่มจาก:** `Phase 2 → สร้าง /api/v1/auth/login + bearer middleware` เป็นจุดเริ่มต้นที่เล็กที่สุดและทดสอบได้

---

*แผนนี้สามารถปรับแก้ได้ตามที่ต้องการ — เป็น living document*
