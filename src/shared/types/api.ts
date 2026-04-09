/**
 * API response envelope types
 * ประเภทข้อมูลสำหรับ response จาก API
 */

// ==================== Standard Response Envelopes ====================

/**
 * API Response แบบสำเร็จ (single item)
 * ใช้เมื่อต้องการส่งข้อมูลชิ้นเดียวกลับไป
 * @template T ประเภทของข้อมูลที่ส่งกลับ
 * @example
 * return NextResponse.json<ApiSuccessResponse<User>>({ data: user });
 */
export interface ApiSuccessResponse<T> {
  data: T;
}

/**
 * API Response แบบมี pagination
 * ใช้เมื่อต้องการส่งรายการข้อมูลพร้อม pagination metadata
 * @template T ประเภทของข้อมูลแต่ละชิ้นในอาร์เรย์
 * @example
 * return NextResponse.json<ApiPaginatedResponse<Novel>>({
 *   data: novels,
 *   pagination: { page: 1, limit: 20, total: 100, totalPages: 5 }
 * });
 */
export interface ApiPaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Pagination metadata
 * ข้อมูลเกี่ยวกับการแบ่งหน้า
 */
export interface PaginationMeta {
  page: number; // หน้าปัจจุบัน (1-based)
  limit: number; // จำนวนรายการต่อหน้า
  total: number; // จำนวนรายการทั้งหมด
  totalPages: number; // จำนวนหน้าทั้งหมด
}

/**
 * API Response แบบ error
 * ใช้เมื่อเกิดข้อผิดพลาด
 * @example
 * return NextResponse.json<ApiErrorResponse>(
 *   { error: "Novel not found", code: "NOVEL_NOT_FOUND" },
 *   { status: 404 }
 * );
 */
export interface ApiErrorResponse {
  error: string; // ข้อความ error
  code?: string; // รหัส error (optional) เช่น "UNAUTHORIZED", "NOT_FOUND"
  details?: unknown; // ข้อมูลเพิ่มเติม (optional) เช่น validation errors
}

/**
 * API Response แบบมีข้อความ
 * ใช้เมื่อต้องการส่งข้อความหรือผลลัพธ์ทั่วไป
 * @example
 * return NextResponse.json<ApiMessageResponse>({
 *   message: "Password reset email sent",
 *   email: user.email
 * });
 */
export interface ApiMessageResponse {
  message: string;
  [key: string]: unknown; // อนุญาตให้มี properties เพิ่มเติมได้
}

// ==================== Pagination Helpers ====================

/**
 * Query parameters สำหรับ pagination
 */
export interface PaginationParams {
  page?: number; // default: 1
  limit?: number; // default: 20
}

/**
 * ฟังก์ชันช่วยสำหรับคำนวณ pagination metadata
 * @param page หน้าปัจจุบัน
 * @param limit จำนวนรายการต่อหน้า
 * @param total จำนวนรายการทั้งหมด
 * @returns PaginationMeta object
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * ฟังก์ชันช่วยสำหรับคำนวณ offset สำหรับ database query
 * @param page หน้าปัจจุบัน (1-based)
 * @param limit จำนวนรายการต่อหน้า
 * @returns offset (0-based)
 */
export function getOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

// ==================== Common Error Codes ====================

/**
 * รหัส error ที่ใช้บ่อย
 */
export const ERROR_CODES = {
  // Auth errors (401)
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Permission errors (403)
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Not found errors (404)
  NOT_FOUND: 'NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  NOVEL_NOT_FOUND: 'NOVEL_NOT_FOUND',
  CHAPTER_NOT_FOUND: 'CHAPTER_NOT_FOUND',

  // Validation errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_FIELD: 'MISSING_FIELD',

  // Business logic errors (400/409)
  INSUFFICIENT_COINS: 'INSUFFICIENT_COINS',
  ALREADY_PURCHASED: 'ALREADY_PURCHASED',
  ALREADY_BOOKMARKED: 'ALREADY_BOOKMARKED',
  CHAPTER_FREE: 'CHAPTER_FREE',
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',

  // Server errors (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// ==================== Validation Error Types ====================

/**
 * Validation error สำหรับ field แต่ละตัว
 */
export interface FieldError {
  field: string;
  message: string;
  code?: string;
}

/**
 * API Error Response พร้อม validation errors
 */
export interface ApiValidationErrorResponse extends ApiErrorResponse {
  details: FieldError[];
}

// ==================== Upload Response Types ====================

/**
 * Response จากการอัปโหลดไฟล์
 */
export interface UploadResponse {
  url: string; // URL ของไฟล์ที่อัปโหลด
  filename: string; // ชื่อไฟล์ที่เซิร์ฟเวอร์
  originalFilename?: string; // ชื่อไฟล์ต้นฉบับ
  size?: number; // ขนาดไฟล์ (bytes)
  mimeType?: string; // MIME type
}

// ==================== Health Check Types ====================

/**
 * Response จาก health check endpoint
 */
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  version?: string;
  database?: 'connected' | 'disconnected';
  uptime?: number; // seconds
}
