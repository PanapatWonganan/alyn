import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { apiSuccess, handleApiError } from "@/lib/api-response";

/**
 * GET /api/v1/ads/rewards/recent
 *
 * Returns the user's last 10 AdReward rows. The mobile client polls this
 * after a rewarded ad finishes to confirm the asynchronous SSV grant.
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await requireAuth();

    const rows = await db.adReward.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        coinsEarned: true,
        verified: true,
        rewardType: true,
        createdAt: true,
      },
    });

    return apiSuccess({ rewards: rows });
  } catch (error) {
    return handleApiError(error);
  }
}
