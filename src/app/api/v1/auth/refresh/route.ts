import { NextRequest } from "next/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} from "@/lib/jwt";

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using a valid refresh token
 *
 * Request body:
 * {
 *   "refreshToken": "eyJ..."
 * }
 *
 * Response:
 * {
 *   "data": {
 *     "accessToken": "eyJ...",
 *     "refreshToken": "eyJ..."
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    // Validate input
    if (!refreshToken || typeof refreshToken !== "string") {
      return apiError("กรุณาระบุ refresh token", 400, "INVALID_REFRESH_TOKEN");
    }

    // Verify refresh token
    const payload = await verifyToken(refreshToken);

    if (!payload) {
      return apiError("Refresh token ไม่ถูกต้องหรือหมดอายุ", 401, "INVALID_TOKEN");
    }

    if (payload.type !== "refresh") {
      return apiError("Token ประเภทไม่ถูกต้อง", 401, "INVALID_TOKEN_TYPE");
    }

    // Fetch user to ensure they still exist and get latest role
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      return apiError("ไม่พบผู้ใช้งาน", 401, "USER_NOT_FOUND");
    }

    // Generate new tokens with fresh user data
    const newAccessToken = await generateAccessToken(user.id, user.role);
    const newRefreshToken = await generateRefreshToken(user.id, user.role);

    return apiSuccess(
      {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
