import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { bangkokDayStart } from "@/lib/checkin";
import { verifySsvSignature } from "@/lib/admob/ssv";
import { verifyCustomData } from "@/lib/admob/customData";

const COINS_PER_AD = 5;
const MAX_PER_DAY = 5;
const COOLDOWN_MS = 5 * 60 * 1000;

/**
 * GET /api/v1/ads/ssv-callback
 *
 * Google AdMob calls this URL after a rewarded ad completes. NO AUTH —
 * the request is authenticated by the ECDSA signature it carries.
 *
 * We always return 200 so Google does not retry forever. Each branch
 * logs to the server console for audit.
 */
export async function GET(request: NextRequest) {
  // Empty 200 body. Google only checks the status code.
  const ok = () => new NextResponse(null, { status: 200 });

  try {
    const sp = request.nextUrl.searchParams;

    const verification = await verifySsvSignature(sp);
    if (!verification.valid || !verification.payload) {
      console.warn(
        "[ADMOB SSV] Rejected callback (invalid signature):",
        verification.reason ?? "unknown"
      );
      return ok();
    }
    const payload = verification.payload;

    const customDataToken = payload.customData ?? "";
    const decoded = verifyCustomData(customDataToken);
    if (!decoded) {
      console.warn(
        "[ADMOB SSV] Rejected callback (bad customData) txid=%s adUnit=%s",
        payload.transactionId,
        payload.adUnit
      );
      return ok();
    }
    const userId = decoded.userId;

    const now = new Date();
    const today = bangkokDayStart(now);

    try {
      await db.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            adRewardsToday: true,
            adRewardsDate: true,
            lastAdRewardAt: true,
          },
        });
        if (!user) {
          console.warn(
            "[ADMOB SSV] User no longer exists userId=%s txid=%s",
            userId,
            payload.transactionId
          );
          // Still record the AdReward (verified=false) so we never reprocess
          // this transaction id. P2002 will be thrown on retries.
          await tx.adReward.create({
            data: {
              userId,
              adUnitId: payload.adUnit,
              rewardType: "ad_user_missing",
              coinsEarned: 0,
              adNetworkTxId: payload.transactionId,
              verified: false,
            },
          });
          return;
        }

        // Daily counter resets at Bangkok-day boundary.
        let usedToday = 0;
        if (user.adRewardsDate) {
          const recordedDay = bangkokDayStart(user.adRewardsDate);
          if (recordedDay.getTime() === today.getTime()) {
            usedToday = user.adRewardsToday ?? 0;
          }
        }

        // Limit check.
        if (usedToday >= MAX_PER_DAY) {
          console.warn(
            "[ADMOB SSV] Daily limit exceeded userId=%s txid=%s",
            userId,
            payload.transactionId
          );
          await tx.adReward.create({
            data: {
              userId,
              adUnitId: payload.adUnit,
              rewardType: "ad_excess",
              coinsEarned: 0,
              adNetworkTxId: payload.transactionId,
              verified: false,
            },
          });
          return;
        }

        // Cooldown check.
        if (
          user.lastAdRewardAt &&
          now.getTime() - user.lastAdRewardAt.getTime() < COOLDOWN_MS
        ) {
          console.warn(
            "[ADMOB SSV] Cooldown active userId=%s txid=%s",
            userId,
            payload.transactionId
          );
          await tx.adReward.create({
            data: {
              userId,
              adUnitId: payload.adUnit,
              rewardType: "ad_cooldown",
              coinsEarned: 0,
              adNetworkTxId: payload.transactionId,
              verified: false,
            },
          });
          return;
        }

        // Grant.
        await tx.adReward.create({
          data: {
            userId,
            adUnitId: payload.adUnit,
            rewardType: "daily_bonus",
            coinsEarned: COINS_PER_AD,
            adNetworkTxId: payload.transactionId,
            verified: true,
          },
        });

        await tx.user.update({
          where: { id: userId },
          data: {
            coinBalance: { increment: COINS_PER_AD },
            adRewardsToday: usedToday + 1,
            adRewardsDate: now,
            lastAdRewardAt: now,
          },
        });

        await tx.coinTransaction.create({
          data: {
            userId,
            type: "AD_REWARD",
            amount: COINS_PER_AD,
            description: `รางวัลจากการดูโฆษณา +${COINS_PER_AD} เหรียญ`,
          },
        });

        console.info(
          "[ADMOB SSV] Granted %d coins userId=%s txid=%s",
          COINS_PER_AD,
          userId,
          payload.transactionId
        );
      });
    } catch (txError) {
      // Idempotent replay: the @unique on adNetworkTxId fires P2002.
      if (
        txError instanceof Prisma.PrismaClientKnownRequestError &&
        txError.code === "P2002"
      ) {
        console.info(
          "[ADMOB SSV] Duplicate callback ignored txid=%s",
          payload.transactionId
        );
        return ok();
      }
      console.error("[ADMOB SSV] DB error", txError);
      return ok();
    }

    return ok();
  } catch (error) {
    console.error("[ADMOB SSV] Unhandled error", error);
    return ok();
  }
}
