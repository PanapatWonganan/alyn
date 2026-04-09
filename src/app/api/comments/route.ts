import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { apiPaginated, apiSuccess, apiError, handleApiError, parsePagination, calculatePagination } from "@/lib/api-response";

// GET /api/comments?chapterId=xxx - Get comments for a chapter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get("chapterId");
    const { page, limit } = parsePagination(searchParams);

    if (!chapterId) {
      return apiError("กรุณาระบุตอน", 400);
    }

    const [comments, total] = await Promise.all([
      db.comment.findMany({
        where: { chapterId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, penName: true, avatar: true, role: true },
          },
        },
      }),
      db.comment.count({ where: { chapterId } }),
    ]);

    return apiPaginated(comments, calculatePagination(total, page, limit));
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/comments - Create a comment
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { chapterId, content } = await request.json();

    if (!chapterId || !content?.trim()) {
      return apiError("กรุณาเขียนความคิดเห็น", 400);
    }

    if (content.length > 2000) {
      return apiError("ความคิดเห็นยาวเกินไป (สูงสุด 2,000 ตัวอักษร)", 400);
    }

    const comment = await db.comment.create({
      data: {
        content: content.trim(),
        chapterId,
        userId: session.user.id,
      },
      include: {
        user: {
          select: { id: true, name: true, penName: true, avatar: true, role: true },
        },
      },
    });

    return apiSuccess({ comment }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
