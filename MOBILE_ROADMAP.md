# Alyn Mobile App Roadmap

## Overview
แผนการเตรียม backend และสร้าง mobile app สำหรับแพลตฟอร์ม Alyn
เทคโนโลยีที่เลือก: **React Native (Expo)** — ใช้ React/TypeScript ที่มีอยู่แล้ว, แชร์ types/logic กับ web

---

## Phase 1: เตรียม Backend ให้พร้อม

### 1.1 Standardize API Responses
- [x] สร้าง `src/lib/api-response.ts` — helper functions สำหรับ response format มาตรฐาน
- [x] Pagination format: `{ data: T[], pagination: { page, limit, total, totalPages } }`
- [x] Error format: `{ error: string, code?: string }`
- [x] Success format: `{ data: T }` หรือ `{ data: T[], pagination }`
- [x] แก้ทุก API route ให้ใช้ format เดียวกัน
- [x] Auth error handling pattern เดียวกันทุก route

### 1.2 API Versioning
- [x] ย้าย routes ไปอยู่ใต้ `/api/v1/`
- [x] สร้าง rewrite rules ให้ `/api/` เดิมยังใช้ได้ (backward compat)
- [x] เตรียมโครงสร้างสำหรับ v2 ในอนาคต

### 1.3 SQLite → PostgreSQL Migration
- [x] เปลี่ยน Prisma adapter จาก better-sqlite3 เป็น pg adapter
- [x] อัปเดต `prisma.config.ts` และ `src/lib/db.ts`
- [x] อัปเดต `prisma/schema.prisma` datasource
- [x] ทดสอบ seed data กับ PostgreSQL
- [x] อัปเดต `.env` สำหรับ DATABASE_URL

### 1.4 Token-based Auth (Mobile-friendly)
- [x] เพิ่ม Bearer token support ใน NextAuth config
- [x] สร้าง `/api/v1/auth/token` endpoint สำหรับ mobile login (return JWT)
- [x] สร้าง `/api/v1/auth/refresh` endpoint สำหรับ refresh token
- [x] อัปเดต middleware ให้ตรวจ Authorization header ด้วย
- [x] อัปเดต `auth-utils.ts` ให้รองรับทั้ง cookie และ bearer token

---

## Phase 2: Shared Layer

### 2.1 Shared Types & Validation
- [x] สร้าง `src/shared/types/` — TypeScript types ที่ทั้ง web และ mobile ใช้ร่วม
- [x] สร้าง `src/shared/validations/` — Zod schemas สำหรับ input validation
- [x] สร้าง `src/shared/constants/` — ค่าคงที่ (roles, statuses, transaction types)

### 2.2 API Client SDK
- [x] สร้าง `src/shared/api-client/` — typed API client
- [x] Support ทั้ง cookie-based (web) และ token-based (mobile) auth
- [x] Auto-generated types จาก API responses

### 2.3 Push Notification
- [x] เพิ่ม FCM (Firebase Cloud Messaging) integration
- [x] เพิ่ม `deviceToken` field ใน User model
- [x] สร้าง `/api/v1/notifications/register-device` endpoint
- [x] อัปเดต notification creation ให้ส่ง push ด้วย

---

## Phase 3: Mobile App (React Native / Expo)

### 3.1 Project Setup
- [ ] Init Expo project ใน `/mobile` directory
- [ ] Setup monorepo structure (Turborepo)
- [ ] Link shared types/validation/api-client packages
- [ ] Configure navigation (React Navigation)
- [ ] Setup theme system (match web brand colors)

### 3.2 Core Screens (Priority Order)
1. [ ] **Reader** — อ่านนิยาย (หัวใจของ app)
2. [ ] **Explore/Search** — สำรวจ/ค้นหานิยาย
3. [ ] **Login/Register** — ระบบ auth
4. [ ] **Library/Bookmark** — ชั้นหนังสือ
5. [ ] **Wallet & Coin** — กระเป๋าเงิน (In-App Purchase)
6. [ ] **Novel Detail** — รายละเอียดนิยาย
7. [ ] **Profile** — โปรไฟล์ผู้ใช้
8. [ ] **Write** (basic editor) — เขียนนิยาย (MVP)

### 3.3 Mobile-specific Features
- [ ] Offline reading (cache ที่ซื้อแล้ว)
- [ ] Push notifications
- [ ] Biometric auth (Face ID / Fingerprint)
- [ ] Deep linking

---

## Phase 4: Distribution

### 4.1 Testing
- [ ] Internal testing (TestFlight / Google Internal)
- [ ] Beta testing กับกลุ่มผู้ใช้

### 4.2 App Store Submission
- [ ] Apple App Store (ระวัง 30% In-App Purchase cut)
- [ ] Google Play Store
- [ ] App Store Optimization (ASO)

---

## Key Decisions

| หัวข้อ | การตัดสินใจ |
|---|---|
| Framework | React Native (Expo) |
| Code sharing | Monorepo + shared packages |
| Auth | JWT token-based สำหรับ mobile |
| Database | PostgreSQL (รองรับ concurrent connections) |
| Push | Firebase Cloud Messaging (FCM) |
| In-App Purchase | ให้ top-up ผ่าน web เป็นหลัก, IAP เป็น option เสริม |
| MVP scope | อ่านอย่างเดียวก่อน, เพิ่มเขียนทีหลัง |
