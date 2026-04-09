/**
 * Chapter-related types
 * ประเภทข้อมูลที่เกี่ยวข้องกับตอน
 */

import { UserSummary } from './user';

// ==================== Core Chapter Types ====================

/**
 * ข้อมูลตอนแบบย่อ
 * ใช้สำหรับแสดงในรายการตอน (ไม่รวมเนื้อหา)
 */
export interface ChapterSummary {
  id: string;
  number: number;
  title: string;
  wordCount: number;
  coinPrice: number;
  isFree: boolean;
  publishedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;

  novelId: string;
  authorId: string;

  // Purchase status (for current user)
  isPurchased?: boolean;

  // Novel title (optional, for display)
  novelTitle?: string;
}

/**
 * ข้อมูลตอนแบบเต็ม
 * ใช้สำหรับหน้าอ่านตอน (รวมเนื้อหา)
 */
export interface ChapterDetail extends ChapterSummary {
  content: string;
  author: UserSummary;

  // Navigation
  previousChapterId: string | null;
  nextChapterId: string | null;

  // Novel info
  novelTitle: string;
  novelSlug: string;

  // Stats
  commentCount?: number;
  purchaseCount?: number;
}

/**
 * ข้อมูลตอนสำหรับนักเขียน
 * รวมข้อมูลสถิติและรายได้
 */
export interface ChapterManagement extends ChapterDetail {
  totalEarnings: number;
  purchaseCount: number;
  uniqueReaders: number;
  avgReadingTime?: number; // in seconds
}

// ==================== Chapter Request Types ====================

/**
 * ข้อมูลสำหรับการสร้างตอนใหม่
 */
export interface CreateChapterRequest {
  novelId: string;
  number: number;
  title: string;
  content: string;
  coinPrice?: number; // default: 0 (free)
  isFree?: boolean; // default: true
  publishedAt?: string | null; // ISO date string, null = draft
}

/**
 * ข้อมูลสำหรับการอัปเดตตอน
 */
export interface UpdateChapterRequest {
  title?: string;
  content?: string;
  coinPrice?: number;
  isFree?: boolean;
  publishedAt?: string | null; // null = unpublish (set to draft)
}

/**
 * ข้อมูลสำหรับการเผยแพร่ตอน
 */
export interface PublishChapterRequest {
  publishedAt?: string; // ISO date string, default: now
}

/**
 * ข้อมูลสำหรับการกรองตอน
 */
export interface ChapterFilterParams {
  novelId?: string;
  authorId?: string;
  isFree?: boolean;
  isPublished?: boolean; // true: has publishedAt, false: draft
  page?: number;
  limit?: number;
}

// ==================== Chapter Purchase Types ====================

/**
 * ข้อมูลการซื้อตอน
 */
export interface ChapterPurchase {
  id: string;
  userId: string;
  chapterId: string;
  coinSpent: number;
  createdAt: Date | string;

  // Additional info for display
  chapter?: ChapterSummary;
}

/**
 * ข้อมูลสำหรับการซื้อตอน
 */
export interface PurchaseChapterRequest {
  chapterId: string;
}

/**
 * ผลลัพธ์จากการซื้อตอน
 */
export interface PurchaseChapterResponse {
  success: boolean;
  message: string;
  purchase?: ChapterPurchase;
  newCoinBalance?: number;
}

// ==================== Comment Types ====================

/**
 * ข้อมูลคอมเมนต์
 */
export interface Comment {
  id: string;
  content: string;
  createdAt: Date | string;
  userId: string;
  chapterId: string;
  user: UserSummary;
}

/**
 * ข้อมูลสำหรับการสร้างคอมเมนต์
 */
export interface CreateCommentRequest {
  chapterId: string;
  content: string;
}

/**
 * ข้อมูลสำหรับการอัปเดตคอมเมนต์
 */
export interface UpdateCommentRequest {
  content: string;
}

/**
 * ข้อมูลสำหรับการกรองคอมเมนต์
 */
export interface CommentFilterParams {
  chapterId: string;
  page?: number;
  limit?: number;
}

// ==================== Reading Statistics ====================

/**
 * สถิติการอ่านของตอน
 */
export interface ChapterStats {
  chapterId: string;
  viewCount: number;
  purchaseCount: number;
  commentCount: number;
  uniqueReaders: number;
  totalEarnings: number;
  avgReadingTime?: number; // in seconds
}
