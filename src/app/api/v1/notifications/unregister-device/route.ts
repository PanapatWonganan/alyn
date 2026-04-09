import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { apiMessage, apiError, handleApiError } from "@/lib/api-response";

/**
 * POST /api/v1/notifications/unregister-device
 * Unregister a device token (e.g., on logout)
 * Request: { token: string }
 * Response: { message: "ยกเลิกการลงทะเบียนอุปกรณ์สำเร็จ" }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await request.json();
    const { token } = body;

    // Validate input
    if (!token || typeof token !== "string" || token.trim() === "") {
      return apiError("กรุณาระบุ token", 400, "INVALID_TOKEN");
    }

    // Delete the device token
    await db.deviceToken.deleteMany({
      where: {
        userId: session.user.id as string,
        token: token.trim(),
      },
    });

    return apiMessage("ยกเลิกการลงทะเบียนอุปกรณ์สำเร็จ");
  } catch (error) {
    return handleApiError(error);
  }
}
