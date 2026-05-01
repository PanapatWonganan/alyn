import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import {
  apiSuccess,
  apiError,
  handleApiError,
  parsePagination,
  calculatePagination,
} from "@/lib/api-response";

// GET /api/novels/[novelId]/reviews - paginated list of reviews
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    const { novelId } = await params;
    const { page, limit } = parsePagination(request.nextUrl.searchParams);
    const skip = (page - 1) * limit;

    const [total, reviews, novel] = await Promise.all([
      db.review.count({ where: { novelId } }),
      db.review.findMany({
        where: { novelId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              penName: true,
              avatar: true,
            },
          },
        },
      }),
      db.novel.findUnique({
        where: { id: novelId },
        select: { averageRating: true, reviewCount: true },
      }),
    ]);

    return Response.json({
      data: reviews,
      pagination: calculatePagination(total, page, limit),
      averageRating: novel?.averageRating ?? 0,
      reviewCount: novel?.reviewCount ?? 0,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/novels/[novelId]/reviews - create or update the user's review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    const session = await requireAuth();
    const userId = session.user.id as string;
    const { novelId } = await params;

    const body = await request.json();
    const rating = Number(body.rating);
    const content = typeof body.content === "string" ? body.content.trim() : null;

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return apiError("คะแนนต้องอยู่ระหว่าง 1-5", 400);
    }

    const novel = await db.novel.findUnique({
      where: { id: novelId },
      select: { id: true, authorId: true },
    });
    if (!novel) {
      return apiError("ไม่พบนิยาย", 404);
    }
    if (novel.authorId === userId) {
      return apiError("ไม่สามารถรีวิวนิยายของตัวเองได้", 400);
    }

    const review = await db.$transaction(async (tx) => {
      const upserted = await tx.review.upsert({
        where: { userId_novelId: { userId, novelId } },
        update: { rating, content: content || null },
        create: { userId, novelId, rating, content: content || null },
      });

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

      return upserted;
    });

    return apiSuccess({ review }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
