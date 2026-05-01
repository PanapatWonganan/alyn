import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { apiMessage, apiError, handleApiError } from "@/lib/api-response";
import { createCharge, isOmiseMock } from "@/lib/payment/omise";

// Top-up packages: amount -> bonus
const TOPUP_PACKAGES: Record<number, number> = {
  50: 0,
  100: 5,
  300: 20,
  500: 50,
  1000: 150,
};

// POST /api/coins/topup - Top up coins via Omise (mock mode supported)
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { amount, token }: { amount?: number; token?: string } = body ?? {};

    if (
      !amount ||
      (!TOPUP_PACKAGES[amount] && TOPUP_PACKAGES[amount] !== 0)
    ) {
      return apiError("แพ็กเกจเติมเหรียญไม่ถูกต้อง", 400);
    }

    const bonus = TOPUP_PACKAGES[amount];
    const totalCoins = amount + bonus;

    // In real mode a token is required; in mock mode it is optional.
    if (!isOmiseMock() && !token) {
      return apiError("ไม่พบ payment token", 400, "MISSING_TOKEN");
    }

    // 1 coin = 1 THB = 100 satang
    const amountSatang = amount * 100;

    const charge = await createCharge({
      amountSatang,
      token,
      description: `Alyn coin topup: ${amount} coins (+${bonus} bonus)`,
      metadata: {
        userId: session.user.id,
        packageAmount: amount,
        bonus,
      },
    });

    if (charge.status !== "successful") {
      return apiError("การชำระเงินไม่สำเร็จ", 400, "CHARGE_FAILED");
    }

    // Update user balance and create transaction atomically
    const user = await db.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: { coinBalance: { increment: totalCoins } },
        select: { coinBalance: true },
      });

      await tx.coinTransaction.create({
        data: {
          type: "TOPUP",
          amount: totalCoins,
          description: `เติมเหรียญ ${amount} + โบนัส ${bonus} [charge:${charge.id}]`,
          userId: session.user.id,
        },
      });

      return updatedUser;
    });

    return apiMessage(`เติมเหรียญสำเร็จ! ได้รับ ${totalCoins} เหรียญ`, {
      coinBalance: user.coinBalance,
      newBalance: user.coinBalance,
      bonus,
      chargeId: charge.id,
      mock: charge.mock,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
