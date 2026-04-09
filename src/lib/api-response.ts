import { NextResponse } from "next/server";

/**
 * Standardized API response helpers for Alyn platform
 * All responses follow consistent formats for better client-side handling
 */

// Types

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Response Helpers

/**
 * Success response for single resource
 * @example apiSuccess({ novel: { id: 1, title: "..." } })
 * Returns: { data: { novel: { ... } } }
 */
export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

/**
 * Success response for paginated list resources
 * @example apiPaginated(novels, { page: 1, limit: 20, total: 100, totalPages: 5 })
 * Returns: { data: [...], pagination: { ... } }
 */
export function apiPaginated<T>(
  data: T[],
  pagination: PaginationMeta,
  status = 200
): NextResponse {
  return NextResponse.json({ data, pagination }, { status });
}

/**
 * Success response for action/mutation endpoints
 * @example apiMessage("บันทึกสำเร็จ", { id: 123 }, 201)
 * Returns: { message: "บันทึกสำเร็จ", id: 123 }
 */
export function apiMessage(
  message: string,
  extra?: Record<string, unknown>,
  status = 200
): NextResponse {
  return NextResponse.json({ message, ...extra }, { status });
}

/**
 * Error response
 * @example apiError("ไม่พบนิยาย", 404, "NOT_FOUND")
 * Returns: { error: "ไม่พบนิยาย", code: "NOT_FOUND" }
 */
export function apiError(
  error: string,
  status = 400,
  code?: string
): NextResponse {
  const body: { error: string; code?: string } = { error };
  if (code) {
    body.code = code;
  }
  return NextResponse.json(body, { status });
}

/**
 * Centralized error handler for API routes
 * Handles auth errors (UNAUTHORIZED/FORBIDDEN) and generic errors
 * @example
 * try {
 *   const session = await requireAuth();
 *   // ...
 * } catch (error) {
 *   return handleApiError(error);
 * }
 */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") {
      return apiError("กรุณาเข้าสู่ระบบ", 401, "UNAUTHORIZED");
    }
    if (error.message === "FORBIDDEN") {
      return apiError("ไม่มีสิทธิ์เข้าถึง", 403, "FORBIDDEN");
    }
  }
  console.error("API Error:", error);
  return apiError("เกิดข้อผิดพลาดภายในระบบ", 500, "INTERNAL_ERROR");
}

// Utility Helpers

/**
 * Parse pagination parameters from URLSearchParams
 * @example
 * const { page, limit } = parsePagination(request.nextUrl.searchParams);
 * // Defaults: page=1, limit=20
 */
export function parsePagination(
  searchParams: URLSearchParams
): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(
    1,
    Math.min(100, parseInt(searchParams.get("limit") || "20", 10))
  );

  return { page, limit };
}

/**
 * Calculate pagination metadata
 * @example
 * const pagination = calculatePagination(100, 1, 20);
 * // Returns: { page: 1, limit: 20, total: 100, totalPages: 5 }
 */
export function calculatePagination(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
  };
}
