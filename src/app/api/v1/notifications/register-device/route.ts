import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { apiMessage, apiError, handleApiError } from "@/lib/api-response";

/**
 * POST /api/v1/notifications/register-device
 * Register a device token for push notifications
 * Request: { token: string, platform: "ios" | "android" | "web" }
 * Response: { message: "ลงทะเบียนอุปกรณ์สำเร็จ" }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await request.json();
    const { token, platform } = body;

    // Validate input
    if (!token || typeof token !== "string" || token.trim() === "") {
      return apiError("กรุณาระบุ token", 400, "INVALID_TOKEN");
    }

    if (!platform || !["ios", "android", "web"].includes(platform)) {
      return apiError(
        "กรุณาระบุ platform ที่ถูกต้อง (ios, android, web)",
        400,
        "INVALID_PLATFORM"
      );
    }

    // Upsert device token (create if new, update if exists)
    await db.deviceToken.upsert({
      where: {
        userId_token: {
          userId: session.user.id as string,
          token: token.trim(),
        },
      },
      create: {
        userId: session.user.id as string,
        token: token.trim(),
        platform,
      },
      update: {
        platform,
        updatedAt: new Date(),
      },
    });

    return apiMessage("ลงทะเบียนอุปกรณ์สำเร็จ");
  } catch (error) {
    return handleApiError(error);
  }
}
