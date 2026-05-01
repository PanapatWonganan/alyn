import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { apiPaginated, apiSuccess, apiError, handleApiError, parsePagination, calculatePagination } from "@/lib/api-response";
import { rateLimitRequest } from "@/lib/rate-limit";
import { sanitizeComment } from "@/lib/sanitize";
import { createAndPushNotification } from "@/lib/notification-service";

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
    const limit = rateLimitRequest(request, "comments:post", 10, 5 * 60 * 1000);
    if (!limit.success) {
      return apiError("คำขอมากเกินไป กรุณาลองอีกครั้งในภายหลัง", 429, "RATE_LIMITED");
    }

    const session = await requireAuth();
    const { chapterId, content } = await request.json();

    if (!chapterId || !content?.trim()) {
      return apiError("กรุณาเขียนความคิดเห็น", 400);
    }

    if (content.length > 2000) {
      return apiError("ความคิดเห็นยาวเกินไป (สูงสุด 2,000 ตัวอักษร)", 400);
    }

    const sanitized = sanitizeComment(content.trim());
    if (!sanitized.trim()) {
      return apiError("กรุณาเขียนความคิดเห็น", 400);
    }

    const comment = await db.comment.create({
      data: {
        content: sanitized,
        chapterId,
        userId: session.user.id,
      },
      include: {
        user: {
          select: { id: true, name: true, penName: true, avatar: true, role: true },
        },
        chapter: {
          select: {
            id: true,
            title: true,
            number: true,
            authorId: true,
            novelId: true,
            novel: { select: { id: true, title: true } },
          },
        },
      },
    });

    // Notify chapter author (but not when commenting on own chapter)
    if (comment.chapter.authorId && comment.chapter.authorId !== session.user.id) {
      const commenterName =
        (comment.user.penName as string | null) || comment.user.name || "ผู้อ่าน";
      try {
        await createAndPushNotification({
          userId: comment.chapter.authorId,
          type: "COMMENT",
          title: "มีความคิดเห็นใหม่",
          message: `${commenterName} แสดงความคิดเห็นที่ ${comment.chapter.novel.title} ตอนที่ ${comment.chapter.number}`,
          link: `/novel/${comment.chapter.novelId}/chapter/${comment.chapter.id}`,
        });
      } catch (err) {
        console.error("Failed to send comment notification:", err);
      }
    }

    return apiSuccess({ comment }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
