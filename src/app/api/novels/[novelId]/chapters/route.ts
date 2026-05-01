import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { notifyNovelFollowers, notifyAuthorFollowers } from "@/lib/notification-service";

// GET /api/novels/[novelId]/chapters - List chapters
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    const { novelId } = await params;
    const { searchParams } = new URL(request.url);
    const order = searchParams.get("order") === "desc" ? "desc" : "asc";

    const chapters = await db.chapter.findMany({
      where: { novelId },
      select: {
        id: true,
        number: true,
        title: true,
        wordCount: true,
        coinPrice: true,
        isFree: true,
        publishedAt: true,
        createdAt: true,
      },
      orderBy: { number: order },
    });

    return apiSuccess({ chapters });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/novels/[novelId]/chapters - Create a new chapter
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    const session = await requireAuth();
    const { novelId } = await params;

    // Verify novel ownership
    const novel = await db.novel.findUnique({ where: { id: novelId } });
    if (!novel) {
      return apiError("ไม่พบนิยาย", 404);
    }

    const role = (session.user as unknown as Record<string, unknown>).role as string;
    if (novel.authorId !== session.user.id && role !== "ADMIN") {
      return apiError("คุณไม่มีสิทธิ์เพิ่มตอนในนิยายนี้", 403);
    }

    const body = await request.json();
    const { title, content, coinPrice, isFree, publish } = body;

    if (!title || !content) {
      return apiError("กรุณากรอกชื่อตอนและเนื้อหา", 400);
    }

    // Validate coinPrice for paid chapters
    if (!isFree && coinPrice !== undefined) {
      if (coinPrice < 0) {
        return apiError("ราคาต้องไม่ติดลบ", 400);
      }
      if (coinPrice > 1000) {
        return apiError("ราคาต้องไม่เกิน 1,000 เหรียญ", 400);
      }
    }

    // Get next chapter number
    const lastChapter = await db.chapter.findFirst({
      where: { novelId },
      orderBy: { number: "desc" },
    });
    const nextNumber = (lastChapter?.number || 0) + 1;

    // Calculate word count (Thai + English)
    const wordCount = content.replace(/\s+/g, " ").trim().length;

    const chapter = await db.chapter.create({
      data: {
        number: nextNumber,
        title,
        content,
        wordCount,
        coinPrice: isFree ? 0 : (coinPrice || 0),
        isFree: isFree ?? true,
        publishedAt: publish ? new Date() : null,
        novelId,
        authorId: session.user.id,
      },
    });

    // Update novel status to ONGOING if it was DRAFT and chapter is published
    if (novel.status === "DRAFT" && publish) {
      await db.novel.update({
        where: { id: novelId },
        data: { status: "ONGOING" },
      });
    }

    // Notify followers (bookmarkers + author followers) when chapter is published
    if (publish) {
      try {
        await Promise.allSettled([
          notifyNovelFollowers({
            novelId,
            type: "NEW_CHAPTER",
            title: "ตอนใหม่มาแล้ว",
            message: `${novel.title} - ตอนที่ ${chapter.number}: ${chapter.title}`,
            link: `/novel/${novelId}/chapter/${chapter.id}`,
            excludeUserId: session.user.id,
          }),
          notifyAuthorFollowers({
            authorId: novel.authorId,
            type: "NEW_CHAPTER",
            title: "ผู้เขียนที่คุณติดตามอัปเดตตอนใหม่",
            message: `${novel.title} - ตอนที่ ${chapter.number}: ${chapter.title}`,
            link: `/novel/${novelId}/chapter/${chapter.id}`,
            excludeUserId: session.user.id,
          }),
        ]);
      } catch (err) {
        console.error("Failed to notify followers:", err);
      }
    }

    return apiSuccess({ chapter }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
