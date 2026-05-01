import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { apiMessage, apiError, handleApiError } from "@/lib/api-response";

// POST /api/admin/payouts/[id]/approve - Approve a payout request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const adminNote: string | undefined = body?.adminNote;

    const payout = await db.payoutRequest.findUnique({ where: { id } });
    if (!payout) {
      return apiError("ไม่พบคำขอถอนเงิน", 404);
    }
    if (payout.status !== "PENDING") {
      return apiError("คำขอนี้ได้ถูกดำเนินการแล้ว", 400);
    }

    const updated = await db.payoutRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        adminNote: adminNote ?? null,
        processedAt: new Date(),
      },
    });

    return apiMessage("อนุมัติคำขอถอนเงินแล้ว", { payout: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
