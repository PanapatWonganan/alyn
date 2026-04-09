import { NextRequest } from "next/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import { compare } from "bcryptjs";

/**
 * POST /api/v1/auth/token
 * Mobile login endpoint - authenticates user and returns access + refresh tokens
 *
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "password": "password123"
 * }
 *
 * Response:
 * {
 *   "data": {
 *     "accessToken": "eyJ...",
 *     "refreshToken": "eyJ...",
 *     "user": {
 *       "id": "...",
 *       "email": "user@example.com",
 *       "name": "...",
 *       "role": "READER",
 *       "penName": "...",
 *       "coinBalance": 0
 *     }
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || typeof email !== "string") {
      return apiError("กรุณาระบุอีเมล", 400, "INVALID_EMAIL");
    }

    if (!password || typeof password !== "string") {
      return apiError("กรุณาระบุรหัสผ่าน", 400, "INVALID_PASSWORD");
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        penName: true,
        coinBalance: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return apiError("อีเมลหรือรหัสผ่านไม่ถูกต้อง", 401, "INVALID_CREDENTIALS");
    }

    // Verify password
    const isPasswordValid = await compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return apiError("อีเมลหรือรหัสผ่านไม่ถูกต้อง", 401, "INVALID_CREDENTIALS");
    }

    // Generate tokens
    const accessToken = await generateAccessToken(user.id, user.role);
    const refreshToken = await generateRefreshToken(user.id, user.role);

    // Return tokens and user data (exclude passwordHash)
    return apiSuccess(
      {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          penName: user.penName,
          coinBalance: user.coinBalance,
        },
      },
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
