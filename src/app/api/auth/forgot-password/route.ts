import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";
import { apiMessage, apiError, handleApiError } from "@/lib/api-response";
import { rateLimitRequest } from "@/lib/rate-limit";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const limit = rateLimitRequest(req, "auth:forgot-password", 5, 15 * 60 * 1000);
    if (!limit.success) {
      return apiError("คำขอมากเกินไป กรุณาลองอีกครั้งในภายหลัง", 429, "RATE_LIMITED");
    }

    const body = await req.json();
    const { email } = body;

    // Validate email
    if (!email) {
      return apiError("กรุณากรอกอีเมล", 400);
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, name: true },
    });

    // If user exists, generate reset token
    if (user) {
      const resetToken = crypto.randomUUID();
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Store token in database
      await db.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      });

      const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/reset-password?token=${resetToken}`;
      await sendPasswordResetEmail(user.email, resetUrl, user.name);
    }

    // Always return success message (don't leak whether email exists)
    return apiMessage("หากอีเมลนี้มีในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปแล้ว");
  } catch (error) {
    return handleApiError(error);
  }
}
