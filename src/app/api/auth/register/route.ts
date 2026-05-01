import { NextRequest } from "next/server";
import { hash } from "bcryptjs";
import crypto from "crypto";
import { db } from "@/lib/db";
import { apiMessage, apiError, handleApiError } from "@/lib/api-response";
import { rateLimitRequest } from "@/lib/rate-limit";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const limit = rateLimitRequest(request, "auth:register", 5, 15 * 60 * 1000);
    if (!limit.success) {
      return apiError("คำขอมากเกินไป กรุณาลองอีกครั้งในภายหลัง", 429, "RATE_LIMITED");
    }

    const body = await request.json();
    const { email, password, name, penName, role } = body;

    // Validation
    if (!email || !password || !name) {
      return apiError("กรุณากรอกข้อมูลให้ครบถ้วน", 400);
    }

    if (password.length < 8) {
      return apiError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร", 400);
    }

    const validRoles = ["READER", "WRITER"];
    const userRole = validRoles.includes(role) ? role : "READER";

    // Normalize email
    const normalizedEmail = email.toLowerCase();

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return apiError("อีเมลนี้ถูกใช้งานแล้ว", 409);
    }

    // Hash password
    const passwordHash = await hash(password, 10);

    // Generate email verification token (24h expiry)
    const emailVerifyToken = crypto.randomBytes(32).toString("hex");
    const emailVerifyTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create user
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
    });

    // Send verification email (non-blocking failure: log but do not fail registration)
    const verifyUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/verify-email?token=${emailVerifyToken}`;
    try {
      await sendVerificationEmail(user.email, verifyUrl, user.name);
    } catch (err) {
      console.error("[register] Failed to send verification email:", err);
    }

    return apiMessage(
      "สมัครสมาชิกสำเร็จ กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี",
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
