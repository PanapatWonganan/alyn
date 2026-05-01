import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError, apiMessage, handleApiError } from "@/lib/api-response";
import { sendWelcomeEmail } from "@/lib/email";

/**
 * GET /api/auth/verify-email?token=xxx
 *
 * Verifies a user's email address using the token sent on registration.
 * On success redirects to `/auth/login?verified=1`.
 *
 * This route is safe to hit from an email link (redirects),
 * and from a server component fetch (will also redirect).
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;

    if (!token) {
      return NextResponse.redirect(
        new URL("/auth/verify-email?error=missing", baseUrl)
      );
    }

    const user = await db.user.findFirst({
      where: { emailVerifyToken: token },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        emailVerifyTokenExpiresAt: true,
      },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL("/auth/verify-email?error=invalid", baseUrl)
      );
    }

    if (user.emailVerified) {
      return NextResponse.redirect(
        new URL("/auth/login?verified=1", baseUrl)
      );
    }

    if (
      !user.emailVerifyTokenExpiresAt ||
      user.emailVerifyTokenExpiresAt.getTime() < Date.now()
    ) {
      return NextResponse.redirect(
        new URL("/auth/verify-email?error=expired", baseUrl)
      );
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerifyToken: null,
        emailVerifyTokenExpiresAt: null,
      },
    });

    // Fire-and-forget welcome email
    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (err) {
      console.error("[verify-email] Failed to send welcome email:", err);
    }

    return NextResponse.redirect(new URL("/auth/login?verified=1", baseUrl));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/auth/verify-email
 * body: { token: string }
 *
 * Alternative JSON-based verification for client-side pages.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token : null;

    if (!token) {
      return apiError("ไม่พบโทเคนยืนยันอีเมล", 400, "MISSING_TOKEN");
    }

    const user = await db.user.findFirst({
      where: { emailVerifyToken: token },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        emailVerifyTokenExpiresAt: true,
      },
    });

    if (!user) {
      return apiError("ลิงก์ยืนยันไม่ถูกต้อง", 400, "INVALID_TOKEN");
    }

    if (user.emailVerified) {
      return apiMessage("อีเมลนี้ได้รับการยืนยันแล้ว");
    }

    if (
      !user.emailVerifyTokenExpiresAt ||
      user.emailVerifyTokenExpiresAt.getTime() < Date.now()
    ) {
      return apiError("ลิงก์ยืนยันหมดอายุแล้ว", 400, "EXPIRED_TOKEN");
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerifyToken: null,
        emailVerifyTokenExpiresAt: null,
      },
    });

    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (err) {
      console.error("[verify-email] Failed to send welcome email:", err);
    }

    return apiMessage("ยืนยันอีเมลสำเร็จ");
  } catch (error) {
    return handleApiError(error);
  }
}
