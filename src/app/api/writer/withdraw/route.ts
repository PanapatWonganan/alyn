import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import {
  apiSuccess,
  apiError,
  apiMessage,
  handleApiError,
} from "@/lib/api-response";

const MIN_PAYOUT_COINS = 500;

// GET /api/writer/withdraw - List payout history for the current writer
export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id as string;
    const role = (session.user as unknown as Record<string, unknown>)
      .role as string;

    if (role !== "WRITER" && role !== "ADMIN") {
      return apiError("ไม่มีสิทธิ์เข้าถึง", 403, "FORBIDDEN");
    }

    const requests = await db.payoutRequest.findMany({
      where: { userId },
      orderBy: { requestedAt: "desc" },
    });

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { coinBalance: true },
    });

    return apiSuccess({
      balance: user?.coinBalance ?? 0,
      minPayout: MIN_PAYOUT_COINS,
      requests,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/writer/withdraw - Create a payout request and hold the coins
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id as string;
    const role = (session.user as unknown as Record<string, unknown>)
      .role as string;

    if (role !== "WRITER" && role !== "ADMIN") {
      return apiError("ไม่มีสิทธิ์เข้าถึง", 403, "FORBIDDEN");
    }

    const body = await request.json();
    const {
      amountCoins,
      bankName,
      bankAccount,
      bankAccountName,
    }: {
      amountCoins?: number;
      bankName?: string;
      bankAccount?: string;
      bankAccountName?: string;
    } = body ?? {};

    if (
      !amountCoins ||
      !Number.isFinite(amountCoins) ||
      amountCoins < MIN_PAYOUT_COINS
    ) {
      return apiError(
        `จำนวนเหรียญต้องไม่น้อยกว่า ${MIN_PAYOUT_COINS} เหรียญ`,
        400
      );
    }
    if (!bankName || !bankAccount || !bankAccountName) {
      return apiError("กรุณากรอกข้อมูลบัญชีธนาคารให้ครบถ้วน", 400);
    }

    const payout = await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { coinBalance: true },
      });
      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }
      if (user.coinBalance < amountCoins) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      // Deduct coins immediately to "hold" them against the payout.
      await tx.user.update({
        where: { id: userId },
        data: { coinBalance: { decrement: amountCoins } },
      });

      const created = await tx.payoutRequest.create({
        data: {
          userId,
          amountCoins,
          amountThb: amountCoins, // 1 coin = 1 THB
          bankName,
          bankAccount,
          bankAccountName,
          status: "PENDING",
        },
      });

      await tx.coinTransaction.create({
        data: {
          type: "PURCHASE",
          amount: -amountCoins,
          description: `ถอนเงินเข้าบัญชี ${bankName} (คำขอ #${created.id})`,
          userId,
        },
      });

      return created;
    });

    return apiMessage("ส่งคำขอถอนเงินเรียบร้อยแล้ว", { payout }, 201);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INSUFFICIENT_BALANCE") {
        return apiError("ยอดเหรียญไม่เพียงพอ", 400, "INSUFFICIENT_BALANCE");
      }
      if (error.message === "USER_NOT_FOUND") {
        return apiError("ไม่พบผู้ใช้", 404, "USER_NOT_FOUND");
      }
    }
    return handleApiError(error);
  }
}
