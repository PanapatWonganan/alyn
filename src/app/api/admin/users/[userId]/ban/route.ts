import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireAdmin();
    const { userId } = await params;

    if (userId === session.user?.id) {
      return apiError("ไม่สามารถแบนบัญชีของตัวเองได้", 400);
    }

    const target = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!target) {
      return apiError("ไม่พบผู้ใช้", 404);
    }

    if (target.role === "ADMIN") {
      return apiError("ไม่สามารถแบนผู้ดูแลระบบได้", 400);
    }

    const user = await db.user.update({
      where: { id: userId },
      data: { isBanned: true },
      select: { id: true, isBanned: true },
    });

    return apiSuccess({ user, message: "แบนผู้ใช้สำเร็จ" });
  } catch (error) {
    return handleApiError(error);
  }
}
