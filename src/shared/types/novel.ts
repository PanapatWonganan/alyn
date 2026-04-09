/**
 * Novel-related types
 * ประเภทข้อมูลที่เกี่ยวข้องกับนิยาย
 */

import { NovelStatus } from '../constants';
import { UserSummary } from './user';
import { ChapterSummary } from './chapter';

// ==================== Core Novel Types ====================

/**
 * ข้อมูลแนวเรื่อง (Genre)
 */
export interface Genre {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

/**
 * ข้อมูลแท็ก (Tag)
 */
export interface Tag {
  id: string;
  name: string;
}

/**
 * ข้อมูลนิยายแบบย่อ
 * ใช้สำหรับแสดงในรายการหรือการ์ด
 */
export interface NovelSummary {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  coverImage: string | null;
  status: NovelStatus;
  isAdult: boolean;
  viewCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;

  // Author info (can be flat or nested)
  authorId: string;
  author: UserSummary | string; // string for backward compatibility (penName or name)

  // Genre info (can be flat or nested)
  genreId: string;
  genre: Genre | string; // string for backward compatibility (genre name)

  // Aggregated data
  chapterCount?: number;
  latestChapterNumber?: number;
  latestChapterTitle?: string;
  latestChapterDate?: Date | string;
}

/**
 * ข้อมูลนิยายแบบเต็ม
 * ใช้สำหรับหน้ารายละเอียดนิยาย
 */
export interface NovelDetail extends Omit<NovelSummary, 'author' | 'genre'> {
  author: UserSummary;
  genre: Genre;
  tags: Tag[];
  chapters: ChapterSummary[];

  // Bookmark status (for current user)
  isBookmarked?: boolean;
}

/**
 * ข้อมูลนิยายสำหรับนักเขียน
 * รวมข้อมูลสถิติและตัวเลือกการจัดการ
 */
export interface NovelManagement extends NovelDetail {
  totalEarnings: number;
  totalPurchases: number;
  uniqueReaders: number;
}

// ==================== Novel Request Types ====================

/**
 * ข้อมูลสำหรับการสร้างนิยายใหม่
 */
export interface CreateNovelRequest {
  title: string;
  synopsis: string;
  coverImage?: string;
  genreId: string;
  tags?: string[]; // Array of tag names
  isAdult?: boolean;
  status?: NovelStatus; // default: DRAFT
}

/**
 * ข้อมูลสำหรับการอัปเดตนิยาย
 */
export interface UpdateNovelRequest {
  title?: string;
  synopsis?: string;
  coverImage?: string;
  genreId?: string;
  tags?: string[]; // Array of tag names (will replace existing)
  status?: NovelStatus;
  isAdult?: boolean;
}

/**
 * ข้อมูลสำหรับการกรองนิยาย
 */
export interface NovelFilterParams {
  genreId?: string;
  status?: NovelStatus;
  isAdult?: boolean;
  tags?: string[];
  authorId?: string;
  search?: string; // Search in title or synopsis
  sortBy?: 'latest' | 'popular' | 'updated'; // latest: newest, popular: most views, updated: recently updated
  page?: number;
  limit?: number;
}

// ==================== Bookmark Types ====================

/**
 * ข้อมูลบุ๊กมาร์ก
 */
export interface Bookmark {
  id: string;
  userId: string;
  novelId: string;
  createdAt: Date | string;
  novel?: NovelSummary;
}

/**
 * ข้อมูลสำหรับการเพิ่ม/ลบบุ๊กมาร์ก
 */
export interface BookmarkRequest {
  novelId: string;
}

// ==================== Reading Progress Types ====================

/**
 * ข้อมูลความคืบหน้าการอ่าน
 */
export interface ReadingProgress {
  id: string;
  userId: string;
  chapterId: string;
  updatedAt: Date | string;

  // Additional info for display
  novel?: NovelSummary;
  chapter?: ChapterSummary;
}

// ==================== Ranking Types ====================

/**
 * ข้อมูลนิยายสำหรับจัดอันดับ
 */
export interface NovelRanking extends NovelSummary {
  rank: number;
  score: number; // คะแนนที่ใช้จัดอันดับ (views, purchases, donations, etc.)
}

/**
 * ประเภทการจัดอันดับ
 */
export type RankingType = 'views' | 'popular' | 'earnings' | 'recent';
