/**
 * Constants และค่าคงที่ทั้งหมดของระบบ Alyn
 * ใช้สำหรับ roles, statuses, และค่าการตั้งค่าต่างๆ
 */

// ==================== User Roles ====================

/**
 * บทบาทผู้ใช้ในระบบ
 * - READER: ผู้อ่าน (default)
 * - WRITER: นักเขียน
 * - ADMIN: ผู้ดูแลระบบ
 */
export const USER_ROLES = {
  READER: 'READER',
  WRITER: 'WRITER',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// ==================== Novel Statuses ====================

/**
 * สถานะของนิยาย
 * - DRAFT: แบบร่าง (ยังไม่เผยแพร่)
 * - ONGOING: กำลังเขียน
 * - COMPLETED: จบแล้ว
 * - HIATUS: หยุดพัก
 */
export const NOVEL_STATUSES = {
  DRAFT: 'DRAFT',
  ONGOING: 'ONGOING',
  COMPLETED: 'COMPLETED',
  HIATUS: 'HIATUS',
} as const;

export type NovelStatus = (typeof NOVEL_STATUSES)[keyof typeof NOVEL_STATUSES];

// ==================== Transaction Types ====================

/**
 * ประเภทของธุรกรรมเหรียญ
 * - TOPUP: เติมเหรียญ
 * - PURCHASE: ซื้อตอน
 * - EARNING: รายได้ (จากการขายตอน)
 * - DONATION_SENT: ส่งทิป
 * - DONATION_RECEIVED: รับทิป
 */
export const TRANSACTION_TYPES = {
  TOPUP: 'TOPUP',
  PURCHASE: 'PURCHASE',
  EARNING: 'EARNING',
  DONATION_SENT: 'DONATION_SENT',
  DONATION_RECEIVED: 'DONATION_RECEIVED',
} as const;

export type TransactionType =
  (typeof TRANSACTION_TYPES)[keyof typeof TRANSACTION_TYPES];

// ==================== Notification Types ====================

/**
 * ประเภทของการแจ้งเตือน
 * - NEW_CHAPTER: ตอนใหม่ของนิยายที่ติดตาม
 * - COMMENT: มีคอมเมนต์ใหม่
 * - DONATION: ได้รับทิป
 * - SYSTEM: แจ้งเตือนจากระบบ
 */
export const NOTIFICATION_TYPES = {
  NEW_CHAPTER: 'NEW_CHAPTER',
  COMMENT: 'COMMENT',
  DONATION: 'DONATION',
  SYSTEM: 'SYSTEM',
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

// ==================== Coin Packages ====================

/**
 * แพ็คเกจเติมเหรียญ
 * - coins: จำนวนเหรียญที่ได้
 * - bonus: เหรียญโบนัส
 * - price: ราคา (บาท)
 */
export interface TopupPackage {
  coins: number;
  bonus: number;
  price: number;
}

export const TOPUP_PACKAGES: readonly TopupPackage[] = [
  { coins: 50, bonus: 0, price: 50 },
  { coins: 100, bonus: 5, price: 100 },
  { coins: 300, bonus: 20, price: 300 },
  { coins: 500, bonus: 50, price: 500 },
  { coins: 1000, bonus: 150, price: 1000 },
] as const;

// ==================== Revenue Split ====================

/**
 * สัดส่วนการแบ่งรายได้
 * - CHAPTER_WRITER: นักเขียนได้ 70% จากการขายตอน
 * - CHAPTER_PLATFORM: แพลตฟอร์มได้ 30% จากการขายตอน
 * - DONATION_WRITER: นักเขียนได้ 90% จากทิป
 * - DONATION_PLATFORM: แพลตฟอร์มได้ 10% จากทิป
 */
export const REVENUE_SPLIT = {
  CHAPTER_WRITER: 0.7,
  CHAPTER_PLATFORM: 0.3,
  DONATION_WRITER: 0.9,
  DONATION_PLATFORM: 0.1,
} as const;

// ==================== File Upload Limits ====================

/**
 * ขนาดไฟล์สูงสุดสำหรับการอัปโหลด
 */
export const MAX_FILE_SIZE = {
  COVER_IMAGE: 5 * 1024 * 1024, // 5MB
} as const;

/**
 * ประเภทไฟล์ที่รองรับสำหรับรูปภาพ
 */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

// ==================== Pagination ====================

/**
 * ค่าเริ่มต้นสำหรับ pagination
 */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ==================== Reader Themes ====================

/**
 * ธีมสำหรับหน้าอ่านนิยาย
 */
export const READER_THEMES = {
  DEFAULT: 'default',
  SEPIA: 'sepia',
  NIGHT: 'night',
  DARK: 'dark',
} as const;

export type ReaderTheme = (typeof READER_THEMES)[keyof typeof READER_THEMES];
