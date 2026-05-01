import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { apiMessage, apiError, handleApiError } from "@/lib/api-response";

// POST /api/admin/payouts/[id]/reject - Reject a payout request and refund coins
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

    const updated = await db.$transaction(async (tx) => {
      // Refund coins back to writer
      await tx.user.update({
        where: { id: payout.userId },
        data: { coinBalance: { increment: payout.amountCoins } },
      });

      await tx.coinTransaction.create({
        data: {
          type: "TOPUP",
          amount: payout.amountCoins,
          description: `คืนเหรียญจากคำขอถอนเงินที่ถูกปฏิเสธ (#${payout.id})`,
          userId: payout.userId,
        },
      });

      return tx.payoutRequest.update({
        where: { id },
        data: {
          status: "REJECTED",
          adminNote: adminNote ?? null,
          processedAt: new Date(),
        },
      });
    });

    return apiMessage("ปฏิเสธคำขอและคืนเหรียญให้ผู้ใช้เรียบร้อยแล้ว", {
      payout: updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
