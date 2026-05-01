import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { rateLimitRequest } from "@/lib/rate-limit";
import { CHECK_IN_REWARDS, decideCheckIn } from "@/lib/checkin";

/**
 * POST /api/v1/checkin/claim
 *
 * Award today's check-in coins. Idempotent within a Bangkok calendar day:
 * a second call on the same day returns 409 ALREADY_CLAIMED. Wraps balance
 * update + DailyCheckIn row + CoinTransaction in a single $transaction.
 */
export async function POST(request: NextRequest) {
  try {
    // Belt-and-braces: the day uniqueness already prevents abuse, but cap
    // request volume to defend the DB from a misbehaving client.
    const limit = rateLimitRequest(request, "v1:checkin:claim", 10, 60_000);
    if (!limit.success) {
      return apiError("คำขอมากเกินไป", 429, "RATE_LIMITED");
    }

    const session = await requireAuth();
    const userId = session.user.id;

    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          currentStreak: true,
          longestStreak: true,
          lastCheckInDate: true,
          coinBalance: true,
        },
      });
      if (!user) throw new Error("USER_NOT_FOUND");

      const now = new Date();
      const decision = decideCheckIn({
        now,
        lastCheckInDate: user.lastCheckInDate,
        currentStreak: user.currentStreak,
      });
      if (decision.alreadyClaimedToday) {
        throw new Error("ALREADY_CLAIMED");
      }

      const coins = decision.coinsForNextClaim;
      const newStreak = decision.nextStreakDay;
      // longestStreak tracks consecutive-day count, not the 1..7 cycle position.
      // So bump it whenever the streak grew (not on a reset).
      const consecutiveDays = decision.resetFromBreak
        ? 1
        : (user.currentStreak ?? 0) + 1;
      const newLongest = Math.max(user.longestStreak ?? 0, consecutiveDays);

      await tx.dailyCheckIn.create({
        data: {
          userId,
          streakDay: newStreak,
          coinsEarned: coins,
          checkedInAt: now,
        },
      });

      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          currentStreak: newStreak,
          longestStreak: newLongest,
          lastCheckInDate: now,
          coinBalance: { increment: coins },
        },
        select: { coinBalance: true },
      });

      await tx.coinTransaction.create({
        data: {
          userId,
          type: "CHECK_IN_REWARD",
          amount: coins,
          description: `เช็คอินรายวัน (วันที่ ${newStreak}/7) +${coins} เหรียญ`,
        },
      });

      return {
        coinsEarned: coins,
        newStreak,
        newBalance: updated.coinBalance,
        rewardSchedule: [...CHECK_IN_REWARDS],
      };
    });

    return apiSuccess({
      success: true,
      coinsEarned: result.coinsEarned,
      newStreak: result.newStreak,
      newBalance: result.newBalance,
      rewardSchedule: result.rewardSchedule,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ALREADY_CLAIMED") {
        return apiError("เช็คอินวันนี้แล้ว", 409, "ALREADY_CLAIMED");
      }
      if (error.message === "USER_NOT_FOUND") {
        return apiError("ไม่พบผู้ใช้งาน", 404, "USER_NOT_FOUND");
      }
    }
    return handleApiError(error);
  }
}
