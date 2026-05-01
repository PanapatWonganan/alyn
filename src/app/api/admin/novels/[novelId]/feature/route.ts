import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    await requireAdmin();
    const { novelId } = await params;

    const novel = await db.novel.findUnique({
      where: { id: novelId },
      select: { id: true, isFeatured: true },
    });

    if (!novel) {
      return apiError("ไม่พบนิยาย", 404);
    }

    const updated = await db.novel.update({
      where: { id: novelId },
      data: { isFeatured: !novel.isFeatured },
      select: { id: true, isFeatured: true },
    });

    return apiSuccess({
      novel: updated,
      message: updated.isFeatured ? "ตั้งเป็นนิยายแนะนำ" : "ยกเลิกนิยายแนะนำ",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
