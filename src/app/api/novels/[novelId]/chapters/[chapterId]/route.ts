import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession, requireAuth } from "@/lib/auth-utils";
import { apiSuccess, apiMessage, apiError, handleApiError } from "@/lib/api-response";
import { notifyNovelFollowers, notifyAuthorFollowers } from "@/lib/notification-service";

// GET /api/novels/[novelId]/chapters/[chapterId] - Get chapter content
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ novelId: string; chapterId: string }> }
) {
  try {
    const { novelId, chapterId } = await params;
    const session = await getSession();

    const chapter = await db.chapter.findUnique({
      where: { id: chapterId },
      include: {
        novel: {
          select: { id: true, title: true, slug: true, authorId: true, isAdult: true },
        },
        author: {
          select: { id: true, name: true, penName: true },
        },
      },
    });

    if (!chapter || chapter.novelId !== novelId) {
      return apiError("ไม่พบตอนนี้", 404);
    }

    // Check if chapter is paid and user has purchased it
    if (!chapter.isFree && chapter.coinPrice > 0) {
      const isAuthor = session?.user?.id === chapter.novel.authorId;

      if (!isAuthor) {
        if (!session?.user) {
          // Return chapter without content for non-logged-in users
          return apiSuccess({
            chapter: {
              ...chapter,
              content: null,
              locked: true,
            },
          });
        }

        // Check if user has purchased this chapter
        const purchase = await db.chapterPurchase.findUnique({
          where: {
            userId_chapterId: {
              userId: session.user.id,
              chapterId: chapter.id,
            },
          },
        });

        if (!purchase) {
          return apiSuccess({
            chapter: {
              ...chapter,
              content: null,
              locked: true,
            },
          });
        }
      }
    }

    // Get prev/next chapter for navigation
    const [prevChapter, nextChapter] = await Promise.all([
      db.chapter.findFirst({
        where: { novelId, number: chapter.number - 1 },
        select: { id: true, number: true, title: true },
      }),
      db.chapter.findFirst({
        where: { novelId, number: chapter.number + 1 },
        select: { id: true, number: true, title: true },
      }),
    ]);

    return apiSuccess({
      chapter: { ...chapter, locked: false },
      prevChapter,
      nextChapter,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/novels/[novelId]/chapters/[chapterId] - Update chapter
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string; chapterId: string }> }
) {
  try {
    const session = await requireAuth();
    const { novelId, chapterId } = await params;

    const chapter = await db.chapter.findUnique({
      where: { id: chapterId },
      include: { novel: { select: { authorId: true, title: true } } },
    });

    if (!chapter || chapter.novelId !== novelId) {
      return apiError("ไม่พบตอนนี้", 404);
    }

    const role = (session.user as unknown as Record<string, unknown>).role as string;
    if (chapter.novel.authorId !== session.user.id && role !== "ADMIN") {
      return apiError("คุณไม่มีสิทธิ์แก้ไขตอนนี้", 403);
    }

    const body = await request.json();
    const { title, content, coinPrice, isFree, publish } = body;

    const wordCount = content
      ? content.replace(/\s+/g, " ").trim().length
      : undefined;

    const wasPublished = !!chapter.publishedAt;
    const updated = await db.chapter.update({
      where: { id: chapterId },
      data: {
        ...(title && { title }),
        ...(content && { content, wordCount }),
        ...(coinPrice !== undefined && { coinPrice: isFree ? 0 : coinPrice }),
        ...(isFree !== undefined && { isFree }),
        ...(publish && !chapter.publishedAt && { publishedAt: new Date() }),
      },
    });

    // Notify followers on transition to published
    if (publish && !wasPublished) {
      try {
        await Promise.allSettled([
          notifyNovelFollowers({
            novelId,
            type: "NEW_CHAPTER",
            title: "ตอนใหม่มาแล้ว",
            message: `${chapter.novel.title} - ตอนที่ ${updated.number}: ${updated.title}`,
            link: `/novel/${novelId}/chapter/${updated.id}`,
            excludeUserId: session.user.id,
          }),
          notifyAuthorFollowers({
            authorId: chapter.novel.authorId,
            type: "NEW_CHAPTER",
            title: "ผู้เขียนที่คุณติดตามอัปเดตตอนใหม่",
            message: `${chapter.novel.title} - ตอนที่ ${updated.number}: ${updated.title}`,
            link: `/novel/${novelId}/chapter/${updated.id}`,
            excludeUserId: session.user.id,
          }),
        ]);
      } catch (err) {
        console.error("Failed to notify followers:", err);
      }
    }

    return apiSuccess({ chapter: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/novels/[novelId]/chapters/[chapterId] - Delete chapter
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ novelId: string; chapterId: string }> }
) {
  try {
    const session = await requireAuth();
    const { novelId, chapterId } = await params;

    const chapter = await db.chapter.findUnique({
      where: { id: chapterId },
      include: { novel: { select: { authorId: true } } },
    });

    if (!chapter || chapter.novelId !== novelId) {
      return apiError("ไม่พบตอนนี้", 404);
    }

    const role = (session.user as unknown as Record<string, unknown>).role as string;
    if (chapter.novel.authorId !== session.user.id && role !== "ADMIN") {
      return apiError("คุณไม่มีสิทธิ์ลบตอนนี้", 403);
    }

    await db.chapter.delete({ where: { id: chapterId } });

    return apiMessage("ลบตอนสำเร็จ");
  } catch (error) {
    return handleApiError(error);
  }
}
