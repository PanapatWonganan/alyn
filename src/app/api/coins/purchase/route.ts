import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { apiMessage, apiError, handleApiError } from "@/lib/api-response";
import { NextResponse } from "next/server";

// POST /api/coins/purchase - Purchase a chapter with coins
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { chapterId } = await request.json();

    if (!chapterId) {
      return apiError("กรุณาระบุตอนที่ต้องการซื้อ", 400);
    }

    // Get chapter info
    const chapter = await db.chapter.findUnique({
      where: { id: chapterId },
      include: {
        novel: { select: { authorId: true, title: true } },
      },
    });

    if (!chapter) {
      return apiError("ไม่พบตอนนี้", 404);
    }

    if (chapter.isFree || chapter.coinPrice === 0) {
      return apiError("ตอนนี้อ่านฟรี", 400);
    }

    // Check if user is trying to purchase their own chapter
    if (chapter.novel.authorId === session.user.id) {
      return apiError("ไม่สามารถซื้อบทของตัวเองได้", 400);
    }

    // Revenue split: 70% to writer, 30% platform fee
    const writerEarning = Math.floor(chapter.coinPrice * 0.7);

    // Execute purchase in transaction to prevent race conditions
    const updatedUser = await db.$transaction(async (tx) => {
      // Check if already purchased (inside transaction to prevent TOCTOU)
      const existing = await tx.chapterPurchase.findUnique({
        where: {
          userId_chapterId: {
            userId: session.user.id,
            chapterId,
          },
        },
      });

      if (existing) {
        throw new Error("ALREADY_PURCHASED");
      }

      // Check balance (inside transaction to prevent TOCTOU)
      const user = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { coinBalance: true },
      });

      if (!user || user.coinBalance < chapter.coinPrice) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      // Deduct buyer's balance
      await tx.user.update({
        where: { id: session.user.id },
        data: { coinBalance: { decrement: chapter.coinPrice } },
      });

      // Add writer's earning
      await tx.user.update({
        where: { id: chapter.novel.authorId },
        data: { coinBalance: { increment: writerEarning } },
      });

      // Create purchase record
      await tx.chapterPurchase.create({
        data: {
          userId: session.user.id,
          chapterId,
          coinSpent: chapter.coinPrice,
        },
      });

      // Buyer transaction log
      await tx.coinTransaction.create({
        data: {
          type: "PURCHASE",
          amount: -chapter.coinPrice,
          description: `ซื้อ ${chapter.novel.title} ตอนที่ ${chapter.number}`,
          userId: session.user.id,
        },
      });

      // Writer earning log
      await tx.coinTransaction.create({
        data: {
          type: "EARNING",
          amount: writerEarning,
          description: `รายได้จาก ${chapter.novel.title} ตอนที่ ${chapter.number}`,
          userId: chapter.novel.authorId,
        },
      });

      // Return updated balance
      const updatedUser = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { coinBalance: true },
      });

      return updatedUser;
    });

    return apiMessage(
      "ซื้อตอนสำเร็จ",
      {
        coinBalance: updatedUser?.coinBalance,
        coinSpent: chapter.coinPrice,
      }
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ALREADY_PURCHASED") {
        return apiError("คุณซื้อตอนนี้ไปแล้ว", 400);
      }
      if (error.message === "INSUFFICIENT_BALANCE") {
        return NextResponse.json(
          { error: "เหรียญไม่พอ กรุณาเติมเหรียญ", needTopup: true },
          { status: 400 }
        );
      }
    }
    return handleApiError(error);
  }
}
