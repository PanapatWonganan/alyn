/**
 * Shared types for Alyn platform
 * Re-exports all types from individual type files
 *
 * @example
 * import { UserSession, NovelSummary, ApiSuccessResponse } from '@/shared/types';
 */

// ==================== User Types ====================
export type {
  UserPublicProfile,
  UserSession,
  UserSummary,
  UserDetail,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
  AuthResponse,
} from './user';

// ==================== Novel Types ====================
export type {
  Genre,
  Tag,
  NovelSummary,
  NovelDetail,
  NovelManagement,
  CreateNovelRequest,
  UpdateNovelRequest,
  NovelFilterParams,
  Bookmark,
  BookmarkRequest,
  ReadingProgress,
  NovelRanking,
  RankingType,
} from './novel';

// ==================== Chapter Types ====================
export type {
  ChapterSummary,
  ChapterDetail,
  ChapterManagement,
  CreateChapterRequest,
  UpdateChapterRequest,
  PublishChapterRequest,
  ChapterFilterParams,
  ChapterPurchase,
  PurchaseChapterRequest,
  PurchaseChapterResponse,
  Comment,
  CreateCommentRequest,
  UpdateCommentRequest,
  CommentFilterParams,
  ChapterStats,
} from './chapter';

// ==================== Coin & Transaction Types ====================
export type {
  TopupPackage,
  TransactionRecord,
  TransactionFilterParams,
  TransactionStats,
  TopupRequest,
  TopupResponse,
  PurchaseRequest,
  PurchaseResponse,
  Donation,
  DonationRequest,
  DonationResponse,
  DonationFilterParams,
  DonationStats,
  WriterEarnings,
  PlatformRevenue,
  MonthlyEarningsReport,
  WithdrawalRequest,
  WithdrawalResponse,
} from './coin';

// Export constants from coin types
export { TOPUP_PACKAGES, REVENUE_SPLIT } from './coin';

// ==================== API Types ====================
export type {
  ApiSuccessResponse,
  ApiPaginatedResponse,
  PaginationMeta,
  ApiErrorResponse,
  ApiMessageResponse,
  PaginationParams,
  ErrorCode,
  FieldError,
  ApiValidationErrorResponse,
  UploadResponse,
  HealthCheckResponse,
} from './api';

// Export helpers from API types
export { createPaginationMeta, getOffset, ERROR_CODES } from './api';

// ==================== Constants ====================
// Re-export all constants
export {
  USER_ROLES,
  NOVEL_STATUSES,
  TRANSACTION_TYPES,
  NOTIFICATION_TYPES,
  MAX_FILE_SIZE,
  ALLOWED_IMAGE_TYPES,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  READER_THEMES,
} from '../constants';

// Export types from constants
export type {
  UserRole,
  NovelStatus,
  TransactionType,
  NotificationType,
  ReaderTheme,
} from '../constants';

// ==================== Notification Types ====================
// (Adding notification types here as they weren't in a separate file)

/**
 * ข้อมูลการแจ้งเตือน
 */
export interface Notification {
  id: string;
  type: import('../constants').NotificationType;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date | string;
  userId: string;
}

/**
 * ข้อมูลสำหรับการสร้างการแจ้งเตือน
 */
export interface CreateNotificationRequest {
  userId: string;
  type: import('../constants').NotificationType;
  title: string;
  message: string;
  link?: string;
}

/**
 * ข้อมูลสำหรับการทำเครื่องหมายว่าอ่านแล้ว
 */
export interface MarkNotificationReadRequest {
  notificationIds: string[]; // Array of notification IDs to mark as read
}

/**
 * ข้อมูลสำหรับการกรองการแจ้งเตือน
 */
export interface NotificationFilterParams {
  userId?: string;
  type?: import('../constants').NotificationType;
  isRead?: boolean;
  page?: number;
  limit?: number;
}
