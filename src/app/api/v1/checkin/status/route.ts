import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import {
  CHECK_IN_REWARDS,
  bangkokDayStart,
  decideCheckIn,
} from "@/lib/checkin";

/**
 * GET /api/v1/checkin/status
 *
 * Tells the client whether the user can check in today, what reward they
 * would get, and where they are in the 7-day cycle. All times are computed
 * against the Asia/Bangkok day boundary (server side).
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await requireAuth();
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        currentStreak: true,
        longestStreak: true,
        lastCheckInDate: true,
        coinBalance: true,
      },
    });

    if (!user) {
      return apiSuccess({
        canCheckIn: false,
        currentStreak: 0,
        longestStreak: 0,
        nextStreakDay: 1,
        nextReward: CHECK_IN_REWARDS[0],
        rewardSchedule: [...CHECK_IN_REWARDS],
        lastCheckInAt: null,
        coinBalance: 0,
      });
    }

    const now = new Date();
    const decision = decideCheckIn({
      now,
      lastCheckInDate: user.lastCheckInDate,
      currentStreak: user.currentStreak,
    });

    return apiSuccess({
      canCheckIn: !decision.alreadyClaimedToday,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      nextStreakDay: decision.nextStreakDay,
      nextReward: decision.coinsForNextClaim,
      rewardSchedule: [...CHECK_IN_REWARDS],
      lastCheckInAt: user.lastCheckInDate,
      coinBalance: user.coinBalance,
      // Bangkok-day-start of "today" — useful for client-side countdowns to next reset.
      todayStart: bangkokDayStart(now),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
