import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { apiMessage, apiError, handleApiError } from "@/lib/api-response";

// Top-up packages: amount -> bonus
const TOPUP_PACKAGES: Record<number, number> = {
  50: 0,
  100: 5,
  300: 20,
  500: 50,
  1000: 150,
};

// POST /api/coins/topup - Top up coins (simulated, no real payment)
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { amount } = await request.json();

    if (!amount || !TOPUP_PACKAGES[amount] && TOPUP_PACKAGES[amount] !== 0) {
      return apiError("แพ็กเกจเติมเหรียญไม่ถูกต้อง", 400);
    }

    const bonus = TOPUP_PACKAGES[amount];
    const totalCoins = amount + bonus;

    // Update user balance and create transaction in a single transaction
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
          description: `เติมเหรียญ ${amount} + โบนัส ${bonus}`,
          userId: session.user.id,
        },
      });

      return updatedUser;
    });

    return apiMessage(
      `เติมเหรียญสำเร็จ! ได้รับ ${totalCoins} เหรียญ`,
      {
        coinBalance: user.coinBalance,
        bonus,
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
