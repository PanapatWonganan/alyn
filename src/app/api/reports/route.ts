import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

const VALID_TARGET_TYPES = ["COMMENT", "NOVEL", "CHAPTER"] as const;

// POST /api/reports - Submit a report
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { targetType, targetId, reason } = body;

    if (!targetType || !targetId || !reason?.trim()) {
      return apiError("กรุณาระบุข้อมูลให้ครบถ้วน", 400);
    }

    if (!VALID_TARGET_TYPES.includes(targetType)) {
      return apiError("ประเภทรายงานไม่ถูกต้อง", 400);
    }

    if (reason.length > 1000) {
      return apiError("เหตุผลยาวเกินไป (สูงสุด 1,000 ตัวอักษร)", 400);
    }

    const report = await db.report.create({
      data: {
        targetType,
        targetId,
        reason: reason.trim(),
        reporterId: session.user.id,
      },
    });

    return apiSuccess({ report }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
