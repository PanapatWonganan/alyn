import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

/**
 * POST /api/novels/[novelId]/chapters/[chapterId]/purchase
 *
 * Spend coins to unlock a paid chapter.
 *
 * Idempotent on the (userId, chapterId) unique constraint — repeated calls
 * after a successful purchase return success without re-charging.
 *
 * Revenue split is applied at this point: writer gets 70% of coinPrice,
 * platform retains 30%. The split is recorded as separate ledger entries:
 * - PURCHASE on the buyer (negative impact on balance)
 * - EARNING on the author (positive impact on balance, 70%)
 * The 30% platform cut is implicit (no opposing user balance is touched).
 */
const WRITER_SHARE = 0.7;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ novelId: string; chapterId: string }> }
) {
  try {
    const session = await requireAuth();
    const { novelId, chapterId } = await params;
    const userId = session.user.id;

    const chapter = await db.chapter.findUnique({
      where: { id: chapterId },
      select: {
        id: true,
        novelId: true,
        title: true,
        number: true,
        coinPrice: true,
        isFree: true,
        publishedAt: true,
        novel: { select: { id: true, title: true, authorId: true } },
      },
    });

    if (!chapter || chapter.novelId !== novelId) {
      return apiError("ไม่พบตอนนี้", 404);
    }
    if (!chapter.publishedAt) {
      return apiError("ตอนนี้ยังไม่เผยแพร่", 400, "CHAPTER_UNPUBLISHED");
    }
    if (chapter.isFree || chapter.coinPrice <= 0) {
      return apiError("ตอนนี้อ่านฟรี ไม่ต้องซื้อ", 400, "CHAPTER_FREE");
    }
    if (chapter.novel.authorId === userId) {
      return apiError("คุณเป็นเจ้าของตอนนี้", 400, "OWNER_CANNOT_PURCHASE");
    }

    const existing = await db.chapterPurchase.findUnique({
      where: { userId_chapterId: { userId, chapterId } },
      select: { id: true, coinSpent: true },
    });
    if (existing) {
      const me = await db.user.findUnique({
        where: { id: userId },
        select: { coinBalance: true },
      });
      return apiSuccess({
        purchased: true,
        alreadyOwned: true,
        coinSpent: existing.coinSpent,
        coinBalance: me?.coinBalance ?? 0,
      });
    }

    const buyer = await db.user.findUnique({
      where: { id: userId },
      select: { coinBalance: true },
    });
    if (!buyer) return apiError("ไม่พบผู้ใช้งาน", 404);
    if (buyer.coinBalance < chapter.coinPrice) {
      return apiError("เหรียญไม่พอ กรุณาเติมเหรียญก่อน", 402, "INSUFFICIENT_COINS");
    }

    const writerShare = Math.floor(chapter.coinPrice * WRITER_SHARE);

    const result = await db.$transaction(async (tx) => {
      // Re-check balance inside the transaction to avoid races.
      const fresh = await tx.user.findUnique({
        where: { id: userId },
        select: { coinBalance: true },
      });
      if (!fresh || fresh.coinBalance < chapter.coinPrice) {
        throw new Error("INSUFFICIENT_COINS");
      }

      // Create the purchase record (unique constraint catches double-spend races).
      const purchase = await tx.chapterPurchase.create({
        data: {
          userId,
          chapterId: chapter.id,
          coinSpent: chapter.coinPrice,
        },
      });

      // Buyer: deduct coins + ledger entry
      const updatedBuyer = await tx.user.update({
        where: { id: userId },
        data: { coinBalance: { decrement: chapter.coinPrice } },
        select: { coinBalance: true },
      });
      await tx.coinTransaction.create({
        data: {
          userId,
          type: "PURCHASE",
          amount: -chapter.coinPrice,
          description: `ซื้อตอน "${chapter.novel.title}" ตอนที่ ${chapter.number}: ${chapter.title}`,
        },
      });

      // Writer: add 70% share + ledger entry
      await tx.user.update({
        where: { id: chapter.novel.authorId },
        data: { coinBalance: { increment: writerShare } },
      });
      await tx.coinTransaction.create({
        data: {
          userId: chapter.novel.authorId,
          type: "EARNING",
          amount: writerShare,
          description: `รายได้จากตอน "${chapter.novel.title}" ตอนที่ ${chapter.number}`,
        },
      });

      return { purchase, coinBalance: updatedBuyer.coinBalance };
    });

    return apiSuccess({
      purchased: true,
      alreadyOwned: false,
      coinSpent: chapter.coinPrice,
      coinBalance: result.coinBalance,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_COINS") {
      return apiError("เหรียญไม่พอ กรุณาเติมเหรียญก่อน", 402, "INSUFFICIENT_COINS");
    }
    return handleApiError(error);
  }
}
