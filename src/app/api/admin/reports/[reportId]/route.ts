import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

// PATCH /api/admin/reports/[reportId] - update status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    await requireAdmin();
    const { reportId } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !["PENDING", "RESOLVED", "DISMISSED"].includes(status)) {
      return apiError("สถานะไม่ถูกต้อง", 400);
    }

    const report = await db.report.update({
      where: { id: reportId },
      data: { status },
    });

    return apiSuccess({ report });
  } catch (error) {
    return handleApiError(error);
  }
}
