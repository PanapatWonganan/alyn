import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin();
    const { userId } = await params;

    const target = await db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!target) {
      return apiError("ไม่พบผู้ใช้", 404);
    }

    const user = await db.user.update({
      where: { id: userId },
      data: { isBanned: false },
      select: { id: true, isBanned: true },
    });

    return apiSuccess({ user, message: "ยกเลิกการแบนผู้ใช้สำเร็จ" });
  } catch (error) {
    return handleApiError(error);
  }
}
