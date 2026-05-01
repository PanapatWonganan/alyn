import { NextRequest } from "next/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { rateLimitRequest } from "@/lib/rate-limit";
import { getPack } from "@/lib/iap/products";
import { verifyPurchase, acknowledgePurchase } from "@/lib/iap/google-play";

interface RestoreItem {
  productId: string;
  purchaseToken: string;
  packageName: string;
  orderId?: string;
}

type RestoreStatus = "granted" | "already_consumed" | "failed";

interface RestoreResult {
  productId: string;
  status: RestoreStatus;
  reason?: string;
  coinsGranted?: number;
}

/**
 * POST /api/v1/iap/restore
 *
 * Re-process a list of Google Play purchases the client has on hand. Used
 * after reinstall, account switch, or when a previous verify never reached
 * the server.
 *
 * Each purchase runs through the same verify+grant pipeline as /verify.
 * Already-consumed tokens are reported back with status "already_consumed"
 * (not an error) so the client can safely call `consumePurchase()`.
 *
 * Request body: { purchases: [{ productId, purchaseToken, packageName, orderId? }, ...] }
 * Response: { results: [{ productId, status, reason?, coinsGranted? }, ...] }
 */
export async function POST(request: NextRequest) {
  try {
    const limit = rateLimitRequest(request, "v1:iap:restore", 10, 60_000);
    if (!limit.success) {
      return apiError("คำขอมากเกินไป กรุณาลองอีกครั้งในภายหลัง", 429, "RATE_LIMITED");
    }

    const session = await requireAuth();
    const userId = session.user.id;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return apiError("รูปแบบคำขอไม่ถูกต้อง", 400, "INVALID_BODY");
    }

    const purchasesRaw = (body as { purchases?: unknown }).purchases;
    if (!Array.isArray(purchasesRaw)) {
      return apiError("ไม่พบรายการการซื้อ", 400, "INVALID_PURCHASES");
    }

    if (purchasesRaw.length === 0) {
      return apiSuccess({ results: [] as RestoreResult[] });
    }

    if (purchasesRaw.length > 50) {
      return apiError(
        "รายการการซื้อมากเกินไป (สูงสุด 50 รายการ)",
        400,
        "TOO_MANY_PURCHASES"
      );
    }

    const purchases: RestoreItem[] = [];
    for (const item of purchasesRaw) {
      if (!item || typeof item !== "object") continue;
      const i = item as Record<string, unknown>;
      if (
        typeof i.productId !== "string" ||
        typeof i.purchaseToken !== "string" ||
        typeof i.packageName !== "string"
      ) {
        continue;
      }
      purchases.push({
        productId: i.productId,
        purchaseToken: i.purchaseToken,
        packageName: i.packageName,
        orderId: typeof i.orderId === "string" ? i.orderId : undefined,
      });
    }

    const results: RestoreResult[] = [];

    for (const item of purchases) {
      const pack = getPack(item.productId);
      if (!pack) {
        results.push({
          productId: item.productId,
          status: "failed",
          reason: "UNKNOWN_PRODUCT",
        });
        continue;
      }

      const totalCoins = pack.coins + pack.bonus;

      const verification = await verifyPurchase({
        packageName: item.packageName,
        productId: item.productId,
        purchaseToken: item.purchaseToken,
      });

      if (!verification.ok) {
        results.push({
          productId: item.productId,
          status: "failed",
          reason: verification.reason ?? "IAP_VERIFICATION_FAILED",
        });
        continue;
      }

      const finalOrderId = item.orderId || verification.orderId || null;

      let iapPurchaseId: string | null = null;
      try {
        const txResult = await db.$transaction(async (tx) => {
          const created = await tx.iapPurchase.create({
            data: {
              userId,
              productId: item.productId,
              purchaseToken: item.purchaseToken,
              orderId: finalOrderId,
              platform: "google_play",
              coinsGranted: totalCoins,
              priceAmountMicros: verification.priceAmountMicros ?? null,
              currency: verification.currency ?? "THB",
              verified: true,
              acknowledged: false,
            },
          });

          await tx.user.update({
            where: { id: userId },
            data: { coinBalance: { increment: totalCoins } },
          });

          await tx.coinTransaction.create({
            data: {
              userId,
              type: "TOPUP",
              amount: totalCoins,
              description: `เติมเหรียญผ่าน Google Play (${pack.name})`,
            },
          });

          return created.id;
        });
        iapPurchaseId = txResult;
      } catch (err) {
        if (
          err &&
          typeof err === "object" &&
          "code" in err &&
          (err as { code?: string }).code === "P2002"
        ) {
          results.push({
            productId: item.productId,
            status: "already_consumed",
          });
          continue;
        }
        console.error("[IAP] restore grant failed", err);
        results.push({
          productId: item.productId,
          status: "failed",
          reason: "GRANT_FAILED",
        });
        continue;
      }

      // Best-effort ack.
      const ack = await acknowledgePurchase({
        packageName: item.packageName,
        productId: item.productId,
        purchaseToken: item.purchaseToken,
      });

      if (ack.ok && iapPurchaseId) {
        try {
          await db.iapPurchase.update({
            where: { id: iapPurchaseId },
            data: { acknowledged: true },
          });
        } catch (err) {
          console.error("[IAP] restore: failed to mark acknowledged", err);
        }
      } else if (!ack.ok) {
        console.warn(
          `[IAP] restore: acknowledgePurchase failed for ${iapPurchaseId}: ${ack.reason}`
        );
      }

      results.push({
        productId: item.productId,
        status: "granted",
        coinsGranted: totalCoins,
      });
    }

    return apiSuccess({ results });
  } catch (error) {
    return handleApiError(error);
  }
}
