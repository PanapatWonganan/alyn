import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { apiSuccess, apiMessage, apiError, handleApiError } from "@/lib/api-response";

// POST /api/reading-progress - Save reading progress
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { chapterId } = await request.json();

    if (!chapterId) {
      return apiError("กรุณาระบุตอน", 400);
    }

    await db.readingProgress.upsert({
      where: {
        userId_chapterId: {
          userId: session.user.id,
          chapterId,
        },
      },
      update: {}, // updatedAt will auto-update
      create: {
        userId: session.user.id,
        chapterId,
      },
    });

    return apiMessage("บันทึกความคืบหน้าแล้ว");
  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/reading-progress - Get user's reading history
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const novelId = searchParams.get("novelId");

    if (novelId) {
      // Get latest progress for a specific novel
      const progress = await db.readingProgress.findFirst({
        where: {
          userId: session.user.id,
          chapter: { novelId },
        },
        orderBy: { updatedAt: "desc" },
        include: {
          chapter: {
            select: { id: true, number: true, title: true, novelId: true },
          },
        },
      });

      return apiSuccess({ progress });
    }

    // Get all reading history (grouped by novel, latest chapter)
    const allProgress = await db.readingProgress.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        chapter: {
          select: {
            id: true,
            number: true,
            title: true,
            novelId: true,
            novel: {
              select: {
                id: true,
                title: true,
                slug: true,
                coverImage: true,
                author: { select: { id: true, name: true, penName: true } },
                _count: { select: { chapters: true } },
              },
            },
          },
        },
      },
    });

    // Group by novel, keep only latest chapter per novel
    const novelMap = new Map<string, typeof allProgress[0]>();
    for (const p of allProgress) {
      const nid = p.chapter.novelId;
      if (!novelMap.has(nid)) {
        novelMap.set(nid, p);
      }
    }

    return apiSuccess({
      history: Array.from(novelMap.values()),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
