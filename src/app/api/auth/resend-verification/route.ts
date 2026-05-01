import { NextRequest } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { apiMessage, apiError, handleApiError } from "@/lib/api-response";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimitRequest } from "@/lib/rate-limit";

/**
 * POST /api/auth/resend-verification
 *
 * Regenerates the email verification token for the logged-in user
 * and sends a new verification email.
 */
export async function POST(request: NextRequest) {
  try {
    const limit = rateLimitRequest(
      request,
      "auth:resend-verification",
      5,
      15 * 60 * 1000
    );
    if (!limit.success) {
      return apiError(
        "คำขอมากเกินไป กรุณาลองอีกครั้งในภายหลัง",
        429,
        "RATE_LIMITED"
      );
    }

    const session = await requireAuth();
    const userId = (session.user as unknown as { id: string }).id;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, emailVerified: true },
    });

    if (!user) {
      return apiError("ไม่พบผู้ใช้งาน", 404, "NOT_FOUND");
    }

    if (user.emailVerified) {
      return apiMessage("อีเมลของคุณได้รับการยืนยันแล้ว");
    }

    const emailVerifyToken = crypto.randomBytes(32).toString("hex");
    const emailVerifyTokenExpiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    await db.user.update({
      where: { id: user.id },
      data: { emailVerifyToken, emailVerifyTokenExpiresAt },
    });

    const verifyUrl = `${
      process.env.NEXTAUTH_URL || "http://localhost:3000"
    }/auth/verify-email?token=${emailVerifyToken}`;

    await sendVerificationEmail(user.email, verifyUrl, user.name);

    return apiMessage("ส่งอีเมลยืนยันใหม่แล้ว กรุณาตรวจสอบกล่องจดหมายของคุณ");
  } catch (error) {
    return handleApiError(error);
  }
}
