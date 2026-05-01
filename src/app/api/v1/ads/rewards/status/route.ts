import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { bangkokDayStart } from "@/lib/checkin";

const COINS_PER_AD = 5;
const MAX_PER_DAY = 5;
const COOLDOWN_MS = 5 * 60 * 1000;

/**
 * GET /api/v1/ads/rewards/status
 *
 * Read-only view of the user's rewarded-ad budget. Computes the daily
 * counter against the Asia/Bangkok day boundary without writing — the
 * counter is reset on the next successful ad grant in the SSV callback.
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await requireAuth();
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        adRewardsToday: true,
        adRewardsDate: true,
        lastAdRewardAt: true,
      },
    });

    const now = new Date();
    const today = bangkokDayStart(now);

    let used = 0;
    if (user?.adRewardsDate) {
      const recordedDay = bangkokDayStart(user.adRewardsDate);
      if (recordedDay.getTime() === today.getTime()) {
        used = user.adRewardsToday ?? 0;
      }
    }
    const remaining = Math.max(0, MAX_PER_DAY - used);

    let nextAvailableAt: Date;
    if (remaining === 0) {
      // Tomorrow's Bangkok-day start.
      nextAvailableAt = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    } else {
      const cooldownEnd = user?.lastAdRewardAt
        ? new Date(user.lastAdRewardAt.getTime() + COOLDOWN_MS)
        : now;
      nextAvailableAt = cooldownEnd > now ? cooldownEnd : now;
    }

    return apiSuccess({
      remaining,
      maxPerDay: MAX_PER_DAY,
      cooldownMs: COOLDOWN_MS,
      nextAvailableAt,
      coinsPerAd: COINS_PER_AD,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
