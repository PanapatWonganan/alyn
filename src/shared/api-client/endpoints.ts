/**
 * Alyn API Client - Endpoint methods
 * Organized by domain (auth, users, novels, chapters, etc.)
 */

import { ApiClient } from './client';
import type {
  // User types
  UserPublicProfile,
  UserDetail,
  UserSession,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  // Novel types
  NovelSummary,
  NovelDetail,
  CreateNovelRequest,
  UpdateNovelRequest,
  NovelFilterParams,
  Genre,
  Tag,
  // Chapter types
  ChapterSummary,
  ChapterDetail,
  CreateChapterRequest,
  UpdateChapterRequest,
  // Comment types
  Comment,
  CreateCommentRequest,
  CommentFilterParams,
  // Bookmark & Progress types
  Bookmark,
  BookmarkRequest,
  ReadingProgress,
  // Notification types
  Notification,
  MarkNotificationReadRequest,
  NotificationFilterParams,
  // Coin & Transaction types
  TransactionRecord,
  TransactionFilterParams,
  TopupRequest,
  TopupResponse,
  PurchaseRequest,
  PurchaseResponse,
  // Donation types
  Donation,
  DonationRequest,
  DonationResponse,
  DonationFilterParams,
  // API response types
  ApiSuccessResponse,
  ApiPaginatedResponse,
  ApiMessageResponse,
  UploadResponse,
} from '../types';

// ==================== Auth Token Response ====================

/**
 * Response from mobile token-based authentication
 */
export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserSession;
}

// ==================== Search Response ====================

/**
 * Search results
 */
export interface SearchResponse {
  novels: NovelSummary[];
  total: number;
}

// ==================== Alyn API Client ====================

/**
 * Complete Alyn API client with all endpoint methods
 * Extends the base ApiClient with domain-specific methods
 */
export class AlynApiClient extends ApiClient {
  // ==================== Auth Endpoints ====================

  /**
   * Authentication-related endpoints
   */
  readonly auth = {
    /**
     * Login (mobile - returns JWT tokens)
     * @param email User email
     * @param password User password
     * @returns Access token, refresh token, and user session
     */
    login: (email: string, password: string) =>
      this.post<AuthTokenResponse>('/api/v1/auth/token', { email, password }),

    /**
     * Refresh access token (mobile)
     * @param refreshToken Refresh token
     * @returns New access token and refresh token
     */
    refresh: (refreshToken: string) =>
      this.post<AuthTokenResponse>('/api/v1/auth/refresh', { refreshToken }),

    /**
     * Register new user account
     * @param data Registration data
     * @returns Success message
     */
    register: (data: RegisterRequest) =>
      this.post<ApiMessageResponse>('/api/auth/register', data),

    /**
     * Request password reset email
     * @param email User email
     * @returns Success message
     */
    forgotPassword: (email: string) =>
      this.post<ApiMessageResponse>('/api/auth/forgot-password', { email }),

    /**
     * Reset password with token
     * @param token Reset token from email
     * @param password New password
     * @returns Success message
     */
    resetPassword: (token: string, password: string) =>
      this.post<ApiMessageResponse>('/api/auth/reset-password', { token, password }),
  };

  // ==================== User Endpoints ====================

  /**
   * User-related endpoints
   */
  readonly users = {
    /**
     * Get current user profile
     * @returns Current user data
     */
    me: () => this.get<ApiSuccessResponse<UserPublicProfile>>('/api/users/me'),

    /**
     * Update current user profile
     * @param data Profile data to update
     * @returns Updated user data
     */
    updateProfile: (data: UpdateProfileRequest) =>
      this.put<ApiSuccessResponse<UserPublicProfile>>('/api/users/me', data),

    /**
     * Get user profile by ID
     * @param userId User ID
     * @returns User profile data
     */
    getById: (userId: string) =>
      this.get<ApiSuccessResponse<UserDetail>>(`/api/users/${userId}`),

    /**
     * Change password
     * @param data Current and new password
     * @returns Success message
     */
    changePassword: (data: ChangePasswordRequest) =>
      this.post<ApiMessageResponse>('/api/users/change-password', data),
  };

  // ==================== Novel Endpoints ====================

  /**
   * Novel-related endpoints
   */
  readonly novels = {
    /**
     * List novels with filtering and pagination
     * @param params Filter and pagination parameters
     * @returns Paginated list of novels
     */
    list: (params?: NovelFilterParams) =>
      this.get<ApiPaginatedResponse<NovelSummary>>('/api/novels', params as any),

    /**
     * Create new novel
     * @param data Novel data
     * @returns Created novel
     */
    create: (data: CreateNovelRequest) =>
      this.post<ApiSuccessResponse<NovelDetail>>('/api/novels', data),

    /**
     * Get novel detail by ID
     * @param novelId Novel ID
     * @returns Novel details
     */
    getById: (novelId: string) =>
      this.get<ApiSuccessResponse<NovelDetail>>(`/api/novels/${novelId}`),

    /**
     * Update novel
     * @param novelId Novel ID
     * @param data Novel data to update
     * @returns Updated novel
     */
    update: (novelId: string, data: UpdateNovelRequest) =>
      this.put<ApiSuccessResponse<NovelDetail>>(`/api/novels/${novelId}`, data),

    /**
     * Delete novel
     * @param novelId Novel ID
     * @returns Success message
     */
    delete: (novelId: string) =>
      this.delete<ApiMessageResponse>(`/api/novels/${novelId}`),
  };

  // ==================== Chapter Endpoints ====================

  /**
   * Chapter-related endpoints
   */
  readonly chapters = {
    /**
     * List chapters for a novel
     * @param novelId Novel ID
     * @param params Optional pagination parameters
     * @returns List of chapters
     */
    list: (novelId: string, params?: { page?: number; limit?: number }) =>
      this.get<ApiPaginatedResponse<ChapterSummary>>(
        `/api/novels/${novelId}/chapters`,
        params as any
      ),

    /**
     * Create new chapter
     * @param novelId Novel ID
     * @param data Chapter data (novelId will be automatically included)
     * @returns Created chapter
     */
    create: (novelId: string, data: Omit<CreateChapterRequest, 'novelId'>) =>
      this.post<ApiSuccessResponse<ChapterDetail>>(`/api/novels/${novelId}/chapters`, {
        ...data,
        novelId,
      }),

    /**
     * Get chapter detail
     * @param novelId Novel ID
     * @param chapterId Chapter ID
     * @returns Chapter details including content
     */
    getById: (novelId: string, chapterId: string) =>
      this.get<ApiSuccessResponse<ChapterDetail>>(
        `/api/novels/${novelId}/chapters/${chapterId}`
      ),

    /**
     * Update chapter
     * @param novelId Novel ID
     * @param chapterId Chapter ID
     * @param data Chapter data to update
     * @returns Updated chapter
     */
    update: (novelId: string, chapterId: string, data: UpdateChapterRequest) =>
      this.put<ApiSuccessResponse<ChapterDetail>>(
        `/api/novels/${novelId}/chapters/${chapterId}`,
        data
      ),

    /**
     * Delete chapter
     * @param novelId Novel ID
     * @param chapterId Chapter ID
     * @returns Success message
     */
    delete: (novelId: string, chapterId: string) =>
      this.delete<ApiMessageResponse>(`/api/novels/${novelId}/chapters/${chapterId}`),
  };

  // ==================== Genre Endpoints ====================

  /**
   * Genre-related endpoints
   */
  readonly genres = {
    /**
     * List all genres
     * @returns List of all genres
     */
    list: () => this.get<ApiSuccessResponse<Genre[]>>('/api/genres'),

    /**
     * Get genre by ID
     * @param genreId Genre ID
     * @returns Genre data
     */
    getById: (genreId: string) => this.get<ApiSuccessResponse<Genre>>(`/api/genres/${genreId}`),
  };

  // ==================== Search Endpoints ====================

  /**
   * Search-related endpoints
   */
  readonly search = {
    /**
     * Search novels by query
     * @param query Search query
     * @param params Optional filter parameters
     * @returns Search results
     */
    novels: (query: string, params?: { page?: number; limit?: number; genreId?: string }) =>
      this.get<ApiPaginatedResponse<NovelSummary>>('/api/search', {
        q: query,
        ...params,
      } as any),
  };

  // ==================== Comment Endpoints ====================

  /**
   * Comment-related endpoints
   */
  readonly comments = {
    /**
     * List comments for a chapter
     * @param params Filter parameters including chapterId
     * @returns Paginated list of comments
     */
    list: (params: CommentFilterParams) =>
      this.get<ApiPaginatedResponse<Comment>>('/api/comments', params as any),

    /**
     * Create new comment
     * @param data Comment data
     * @returns Created comment
     */
    create: (data: CreateCommentRequest) =>
      this.post<ApiSuccessResponse<Comment>>('/api/comments', data),

    /**
     * Delete comment
     * @param commentId Comment ID
     * @returns Success message
     */
    delete: (commentId: string) =>
      this.delete<ApiMessageResponse>(`/api/comments/${commentId}`),
  };

  // ==================== Bookmark Endpoints ====================

  /**
   * Bookmark-related endpoints
   */
  readonly bookmarks = {
    /**
     * List user's bookmarks
     * @param params Optional pagination parameters
     * @returns Paginated list of bookmarks
     */
    list: (params?: { page?: number; limit?: number }) =>
      this.get<ApiPaginatedResponse<Bookmark>>('/api/bookmarks', params as any),

    /**
     * Toggle bookmark for a novel
     * @param data Bookmark data
     * @returns Success message with bookmark status
     */
    toggle: (data: BookmarkRequest) =>
      this.post<ApiMessageResponse & { isBookmarked: boolean }>('/api/bookmarks', data),

    /**
     * Check if novel is bookmarked
     * @param novelId Novel ID
     * @returns Bookmark status
     */
    check: (novelId: string) =>
      this.get<{ isBookmarked: boolean }>('/api/bookmarks/check', { novelId } as any),
  };

  // ==================== Reading Progress Endpoints ====================

  /**
   * Reading progress endpoints
   */
  readonly readingProgress = {
    /**
     * Get reading progress for a novel
     * @param novelId Novel ID
     * @returns Reading progress data
     */
    get: (novelId: string) =>
      this.get<ApiSuccessResponse<ReadingProgress | null>>('/api/reading-progress', {
        novelId,
      } as any),

    /**
     * Save/update reading progress
     * @param chapterId Chapter ID
     * @returns Success message
     */
    save: (chapterId: string) =>
      this.post<ApiMessageResponse>('/api/reading-progress', { chapterId }),

    /**
     * List user's reading history
     * @param params Optional pagination parameters
     * @returns Paginated list of reading progress
     */
    list: (params?: { page?: number; limit?: number }) =>
      this.get<ApiPaginatedResponse<ReadingProgress>>('/api/reading-progress/history', params as any),
  };

  // ==================== Notification Endpoints ====================

  /**
   * Notification-related endpoints
   */
  readonly notifications = {
    /**
     * List user's notifications
     * @param params Optional filter and pagination parameters
     * @returns Paginated list of notifications
     */
    list: (params?: NotificationFilterParams) =>
      this.get<ApiPaginatedResponse<Notification>>('/api/notifications', params as any),

    /**
     * Mark notifications as read
     * @param data Notification IDs to mark as read
     * @returns Success message
     */
    markRead: (data: MarkNotificationReadRequest) =>
      this.put<ApiMessageResponse>('/api/notifications', data),

    /**
     * Mark all notifications as read
     * @returns Success message
     */
    markAllRead: () =>
      this.put<ApiMessageResponse>('/api/notifications/mark-all-read', {}),

    /**
     * Get unread notification count
     * @returns Unread count
     */
    getUnreadCount: () =>
      this.get<{ count: number }>('/api/notifications/unread-count'),
  };

  // ==================== Coin & Transaction Endpoints ====================

  /**
   * Coin and transaction endpoints
   */
  readonly coins = {
    /**
     * Top up coins
     * @param data Top-up request data
     * @returns Top-up result with new balance
     */
    topup: (data: TopupRequest) => this.post<TopupResponse>('/api/coins/topup', data),

    /**
     * Purchase chapter
     * @param data Purchase request data
     * @returns Purchase result with new balance
     */
    purchase: (data: PurchaseRequest) =>
      this.post<PurchaseResponse>('/api/coins/purchase', data),

    /**
     * Get transaction history
     * @param params Filter and pagination parameters
     * @returns Paginated list of transactions
     */
    transactions: (params?: TransactionFilterParams) =>
      this.get<ApiPaginatedResponse<TransactionRecord>>('/api/coins/transactions', params as any),

    /**
     * Get current coin balance
     * @returns Current balance
     */
    getBalance: () => this.get<{ balance: number }>('/api/coins/balance'),
  };

  // ==================== Donation Endpoints ====================

  /**
   * Donation-related endpoints
   */
  readonly donations = {
    /**
     * List donations (sent or received)
     * @param params Filter and pagination parameters
     * @returns Paginated list of donations
     */
    list: (params?: DonationFilterParams) =>
      this.get<ApiPaginatedResponse<Donation>>('/api/donations', params as any),

    /**
     * Send donation to writer
     * @param data Donation request data
     * @returns Donation result with new balance
     */
    send: (data: DonationRequest) =>
      this.post<DonationResponse>('/api/donations', data),

    /**
     * Get donation statistics for a user
     * @param userId Optional user ID (defaults to current user)
     * @returns Donation statistics
     */
    getStats: (userId?: string) =>
      this.get<{
        totalSent: number;
        totalReceived: number;
        totalEarnings: number;
        donorCount: number;
      }>('/api/donations/stats', userId ? { userId } : undefined),
  };

  // ==================== Upload Endpoints ====================

  /**
   * File upload endpoints
   */
  readonly files = {
    /**
     * Upload image file (cover, avatar, etc.)
     * @param file File to upload
     * @param type Optional file type hint (cover, avatar)
     * @returns Upload result with URL
     */
    uploadImage: async (file: File, type?: 'cover' | 'avatar') => {
      const formData = new FormData();
      formData.append('file', file);
      if (type) {
        formData.append('type', type);
      }

      return this.upload<UploadResponse>('/api/upload', formData);
    },
  };
}
