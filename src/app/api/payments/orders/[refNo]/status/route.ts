import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

/**
 * GET /api/payments/orders/[refNo]/status
 * Returns the current status of a payment order owned by the authenticated user.
 * Used by the success page to show the final balance.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ refNo: string }> }
) {
  try {
    const session = await requireAuth();
    const { refNo } = await params;

    const order = await db.paymentOrder.findUnique({
      where: { refNo },
      select: {
        id: true,
        userId: true,
        packageId: true,
        coinAmount: true,
        bonusAmount: true,
        priceThb: true,
        refNo: true,
        status: true,
        paidAt: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    if (!order) {
      return apiError("ไม่พบรายการ", 404, "NOT_FOUND");
    }

    if (order.userId !== session.user.id) {
      return apiError("ไม่มีสิทธิ์เข้าถึง", 403, "FORBIDDEN");
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { coinBalance: true },
    });

    return apiSuccess({
      order,
      coinBalance: user?.coinBalance ?? 0,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
