import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { apiMessage, apiError, handleApiError } from "@/lib/api-response";

// DELETE /api/novels/[novelId]/reviews/[reviewId] - delete own review
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ novelId: string; reviewId: string }> }
) {
  try {
    const session = await requireAuth();
    const userId = session.user.id as string;
    const role = (session.user as unknown as Record<string, unknown>).role as string;
    const { novelId, reviewId } = await params;

    const review = await db.review.findUnique({
      where: { id: reviewId },
      select: { id: true, userId: true, novelId: true },
    });

    if (!review || review.novelId !== novelId) {
      return apiError("ไม่พบรีวิว", 404);
    }
    if (review.userId !== userId && role !== "ADMIN") {
      return apiError("ไม่มีสิทธิ์ลบรีวิวนี้", 403);
    }

    await db.$transaction(async (tx) => {
      await tx.review.delete({ where: { id: reviewId } });
      const agg = await tx.review.aggregate({
        where: { novelId },
        _avg: { rating: true },
        _count: { _all: true },
      });
      await tx.novel.update({
        where: { id: novelId },
        data: {
          averageRating: agg._avg.rating ?? 0,
          reviewCount: agg._count._all,
        },
      });
    });

    return apiMessage("ลบรีวิวสำเร็จ");
  } catch (error) {
    return handleApiError(error);
  }
}
