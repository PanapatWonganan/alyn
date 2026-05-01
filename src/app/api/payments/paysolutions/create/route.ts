import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { rateLimitRequest } from "@/lib/rate-limit";
import {
  findPackage,
  generateRefNo,
  createPaymentFormData,
  isPaysolutionsMock,
} from "@/lib/payment/paysolutions";

/**
 * POST /api/payments/paysolutions/create
 *
 * Creates a PENDING PaymentOrder and returns the form data needed to
 * redirect the user to Pay Solutions' hosted payment page (or to the mock
 * endpoint when mock mode is active).
 */
export async function POST(request: NextRequest) {
  try {
    const limit = rateLimitRequest(
      request,
      "payments:create",
      20,
      60 * 60 * 1000
    );
    if (!limit.success) {
      return apiError(
        "คำขอมากเกินไป กรุณาลองอีกครั้งในภายหลัง",
        429,
        "RATE_LIMITED"
      );
    }

    const session = await requireAuth();
    const body = await request.json().catch(() => ({}));
    const { packageId }: { packageId?: string } = body ?? {};

    if (!packageId) {
      return apiError("กรุณาเลือกแพ็กเกจ", 400);
    }

    const pkg = findPackage(packageId);
    if (!pkg) {
      return apiError("แพ็กเกจเติมเหรียญไม่ถูกต้อง", 400);
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true },
    });
    if (!user) {
      return apiError("ไม่พบบัญชีผู้ใช้", 404);
    }

    // Generate unique refno (retry if collision — extremely unlikely)
    let refNo = generateRefNo();
    for (let i = 0; i < 3; i++) {
      const exists = await db.paymentOrder.findUnique({ where: { refNo } });
      if (!exists) break;
      refNo = generateRefNo();
    }

    const order = await db.paymentOrder.create({
      data: {
        userId: user.id,
        packageId: pkg.id,
        coinAmount: pkg.coins,
        bonusAmount: pkg.bonus,
        priceThb: pkg.price,
        refNo,
        provider: "paysolutions",
        status: "PENDING",
        // Orders expire after 30 minutes if not paid
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    // Build absolute return/postback URLs
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.nextUrl.origin ||
      "http://localhost:3000";

    // IMPORTANT: Pay Solutions does NOT append refno to the return URL when
    // it redirects the user back. It simply redirects to the exact URL we
    // provide. So we embed the refno directly into the return URL here —
    // when the browser lands on /return?refno=XXX we can look up the order.
    const form = createPaymentFormData({
      refNo: order.refNo,
      amountThb: pkg.price,
      productDetail: `Alyn เติมเหรียญ ${pkg.coins}${
        pkg.bonus > 0 ? ` + โบนัส ${pkg.bonus}` : ""
      }`,
      customerEmail: user.email,
      returnUrl: `${origin}/api/payments/paysolutions/return?refno=${encodeURIComponent(
        order.refNo
      )}`,
      postbackUrl: `${origin}/api/payments/paysolutions/postback`,
    });

    return apiSuccess({
      order: {
        id: order.id,
        refNo: order.refNo,
        packageId: order.packageId,
        coinAmount: order.coinAmount,
        bonusAmount: order.bonusAmount,
        priceThb: order.priceThb,
        status: order.status,
        expiresAt: order.expiresAt,
      },
      form,
      mock: isPaysolutionsMock(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
