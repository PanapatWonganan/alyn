/**
 * Shared order-fulfillment logic for payment webhooks.
 *
 * Both the postback handler and the return handler (fallback) call this.
 * It atomically:
 *   1. Marks the PaymentOrder as PAID (only if currently PENDING)
 *   2. Credits the user's coinBalance
 *   3. Records a CoinTransaction row
 *
 * Using a single helper ensures we never double-credit: the status transition
 * from PENDING → PAID is the guard.
 */

import { db } from "@/lib/db";

export interface FulfillResult {
  ok: boolean;
  alreadyPaid?: boolean;
  reason?: string;
  order?: {
    id: string;
    refNo: string;
    userId: string;
    status: string;
    coinAmount: number;
    bonusAmount: number;
  };
}

export async function fulfillPaymentOrder(
  refNo: string,
  providerTxnId?: string | null,
  rawPostback?: unknown
): Promise<FulfillResult> {
  const order = await db.paymentOrder.findUnique({ where: { refNo } });
  if (!order) {
    return { ok: false, reason: "ORDER_NOT_FOUND" };
  }

  if (order.status === "PAID") {
    return {
      ok: true,
      alreadyPaid: true,
      order: {
        id: order.id,
        refNo: order.refNo,
        userId: order.userId,
        status: order.status,
        coinAmount: order.coinAmount,
        bonusAmount: order.bonusAmount,
      },
    };
  }

  if (order.status !== "PENDING") {
    return { ok: false, reason: `INVALID_STATUS_${order.status}` };
  }

  const totalCoins = order.coinAmount + order.bonusAmount;

  try {
    const result = await db.$transaction(async (tx) => {
      // Conditional update: only succeeds if still PENDING. This is our
      // anti-double-credit guard. If another request already flipped the
      // status the updateMany affects 0 rows and we bail out.
      const updated = await tx.paymentOrder.updateMany({
        where: { id: order.id, status: "PENDING" },
        data: {
          status: "PAID",
          paidAt: new Date(),
          providerTxnId: providerTxnId ?? undefined,
          rawPostback: rawPostback
            ? (rawPostback as object)
            : undefined,
        },
      });

      if (updated.count === 0) {
        return { raced: true as const };
      }

      await tx.user.update({
        where: { id: order.userId },
        data: { coinBalance: { increment: totalCoins } },
      });

      await tx.coinTransaction.create({
        data: {
          type: "TOPUP",
          amount: totalCoins,
          description: `เติมเหรียญ ${order.coinAmount}${
            order.bonusAmount > 0 ? ` + โบนัส ${order.bonusAmount}` : ""
          } [ref:${order.refNo}]`,
          userId: order.userId,
        },
      });

      return { raced: false as const };
    });

    if (result.raced) {
      // Someone else fulfilled it between our read and write — treat as idempotent success.
      return {
        ok: true,
        alreadyPaid: true,
        order: {
          id: order.id,
          refNo: order.refNo,
          userId: order.userId,
          status: "PAID",
          coinAmount: order.coinAmount,
          bonusAmount: order.bonusAmount,
        },
      };
    }

    return {
      ok: true,
      order: {
        id: order.id,
        refNo: order.refNo,
        userId: order.userId,
        status: "PAID",
        coinAmount: order.coinAmount,
        bonusAmount: order.bonusAmount,
      },
    };
  } catch (err) {
    console.error("[PAYMENT] fulfillPaymentOrder error", err);
    return { ok: false, reason: "DB_ERROR" };
  }
}

/**
 * Mark an order as FAILED. Idempotent.
 */
export async function failPaymentOrder(
  refNo: string,
  reason?: string
): Promise<void> {
  await db.paymentOrder.updateMany({
    where: { refNo, status: "PENDING" },
    data: {
      status: "FAILED",
      rawPostback: reason ? ({ reason } as object) : undefined,
    },
  });
}
