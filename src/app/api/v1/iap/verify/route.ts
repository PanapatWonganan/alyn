import { NextRequest } from "next/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { rateLimitRequest } from "@/lib/rate-limit";
import { getPack } from "@/lib/iap/products";
import { verifyPurchase, acknowledgePurchase } from "@/lib/iap/google-play";

/**
 * POST /api/v1/iap/verify
 *
 * Verify a Google Play purchase and grant coins.
 *
 * Request body:
 * { productId, purchaseToken, packageName, orderId? }
 *
 * Flow:
 *   1. Validate productId is in our catalog.
 *   2. Verify with Google Play Developer API (mocked when no service account).
 *   3. In a single $transaction: insert IapPurchase (purchaseToken @unique
 *      blocks replays), increment coinBalance, insert CoinTransaction.
 *   4. Best-effort acknowledge with Google so they don't auto-refund.
 *
 * Replay protection comes from the @unique index on `purchaseToken`. The
 * P2002 conflict is mapped to 409 ALREADY_CONSUMED so the client can fall
 * back to its restore flow.
 */
export async function POST(request: NextRequest) {
  try {
    const limit = rateLimitRequest(request, "v1:iap:verify", 30, 60_000);
    if (!limit.success) {
      return apiError("คำขอมากเกินไป กรุณาลองอีกครั้งในภายหลัง", 429, "RATE_LIMITED");
    }

    const session = await requireAuth();
    const userId = session.user.id;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return apiError("รูปแบบคำขอไม่ถูกต้อง", 400, "INVALID_BODY");
    }

    const { productId, purchaseToken, packageName, orderId } = body as {
      productId?: unknown;
      purchaseToken?: unknown;
      packageName?: unknown;
      orderId?: unknown;
    };

    if (typeof productId !== "string" || !productId) {
      return apiError("ไม่พบรหัสสินค้า", 400, "INVALID_PRODUCT_ID");
    }
    if (typeof purchaseToken !== "string" || !purchaseToken) {
      return apiError("ไม่พบโทเค็นการซื้อ", 400, "INVALID_PURCHASE_TOKEN");
    }
    if (typeof packageName !== "string" || !packageName) {
      return apiError("ไม่พบชื่อแพ็กเกจ", 400, "INVALID_PACKAGE_NAME");
    }

    const pack = getPack(productId);
    if (!pack) {
      return apiError("ไม่พบแพ็กเหรียญที่ระบุ", 400, "UNKNOWN_PRODUCT");
    }

    const totalCoins = pack.coins + pack.bonus;

    // Verify with Google Play Developer API (or mock).
    const verification = await verifyPurchase({
      packageName,
      productId,
      purchaseToken,
    });

    if (!verification.ok) {
      return apiError(
        "ตรวจสอบการซื้อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
        400,
        "IAP_VERIFICATION_FAILED"
      );
    }

    const finalOrderId =
      (typeof orderId === "string" && orderId) || verification.orderId || null;

    let iapPurchaseId: string;
    let newBalance: number;

    try {
      const result = await db.$transaction(async (tx) => {
        const created = await tx.iapPurchase.create({
          data: {
            userId,
            productId,
            purchaseToken,
            orderId: finalOrderId,
            platform: "google_play",
            coinsGranted: totalCoins,
            priceAmountMicros: verification.priceAmountMicros ?? null,
            currency: verification.currency ?? "THB",
            verified: true,
            acknowledged: false,
          },
        });

        const updated = await tx.user.update({
          where: { id: userId },
          data: { coinBalance: { increment: totalCoins } },
          select: { coinBalance: true },
        });

        await tx.coinTransaction.create({
          data: {
            userId,
            type: "TOPUP",
            amount: totalCoins,
            description: `เติมเหรียญผ่าน Google Play (${pack.name})`,
          },
        });

        return { iapPurchaseId: created.id, newBalance: updated.coinBalance };
      });

      iapPurchaseId = result.iapPurchaseId;
      newBalance = result.newBalance;
    } catch (err) {
      // Prisma unique constraint violation → already consumed.
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        (err as { code?: string }).code === "P2002"
      ) {
        return apiError(
          "การซื้อนี้ถูกใช้แล้ว",
          409,
          "ALREADY_CONSUMED"
        );
      }
      throw err;
    }

    // Best-effort acknowledge — user already got their coins. If this fails
    // we keep the row with acknowledged=false and a future retry/RTDN handler
    // can finish the job.
    const ack = await acknowledgePurchase({
      packageName,
      productId,
      purchaseToken,
    });

    if (ack.ok) {
      try {
        await db.iapPurchase.update({
          where: { id: iapPurchaseId },
          data: { acknowledged: true },
        });
      } catch (err) {
        console.error("[IAP] failed to mark purchase acknowledged", err);
      }
    } else {
      console.warn(
        `[IAP] acknowledgePurchase failed for ${iapPurchaseId}: ${ack.reason}`
      );
    }

    return apiSuccess({
      success: true,
      newBalance,
      coinsGranted: totalCoins,
      transactionId: iapPurchaseId,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
