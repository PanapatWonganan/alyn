import { NextRequest } from "next/server";
import { hash } from "bcryptjs";
import crypto from "crypto";
import { db } from "@/lib/db";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { rateLimitRequest } from "@/lib/rate-limit";
import { sendVerificationEmail } from "@/lib/email";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";

/**
 * POST /api/v1/auth/register
 * Mobile registration — creates the user, sends a verification email, and
 * returns access + refresh tokens so the client can sign the user in
 * immediately (email verification is non-blocking; gating is per-feature).
 *
 * Body: { email, password, name, penName?, role? }
 * Response: { accessToken, refreshToken, user }
 */
export async function POST(request: NextRequest) {
  try {
    const limit = rateLimitRequest(request, "v1:auth:register", 5, 15 * 60 * 1000);
    if (!limit.success) {
      return apiError("คำขอมากเกินไป กรุณาลองอีกครั้งในภายหลัง", 429, "RATE_LIMITED");
    }

    const body = await request.json();
    const { email, password, name, penName, role } = body;

    if (!email || typeof email !== "string") {
      return apiError("กรุณาระบุอีเมล", 400, "INVALID_EMAIL");
    }
    if (!password || typeof password !== "string") {
      return apiError("กรุณาระบุรหัสผ่าน", 400, "INVALID_PASSWORD");
    }
    if (password.length < 8) {
      return apiError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร", 400, "WEAK_PASSWORD");
    }
    if (!name || typeof name !== "string") {
      return apiError("กรุณาระบุชื่อ", 400, "INVALID_NAME");
    }

    const validRoles = ["READER", "WRITER"];
    const userRole = validRoles.includes(role) ? role : "READER";
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (existingUser) {
      return apiError("อีเมลนี้ถูกใช้งานแล้ว", 409, "EMAIL_TAKEN");
    }

    const passwordHash = await hash(password, 10);
    const emailVerifyToken = crypto.randomBytes(32).toString("hex");
    const emailVerifyTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name,
        penName: userRole === "WRITER" ? penName || null : null,
        role: userRole,
        emailVerifyToken,
        emailVerifyTokenExpiresAt,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        penName: true,
        coinBalance: true,
      },
    });

    const verifyUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/verify-email?token=${emailVerifyToken}`;
    try {
      await sendVerificationEmail(user.email, verifyUrl, user.name);
    } catch (err) {
      console.error("[v1/auth/register] Failed to send verification email:", err);
    }

    const accessToken = await generateAccessToken(user.id, user.role);
    const refreshToken = await generateRefreshToken(user.id, user.role);

    return apiSuccess(
      {
        accessToken,
        refreshToken,
        user,
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
