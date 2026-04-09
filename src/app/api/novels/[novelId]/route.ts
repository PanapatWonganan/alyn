import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { apiSuccess, apiMessage, apiError, handleApiError } from "@/lib/api-response";

// GET /api/novels/[novelId] - Get novel detail
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    const { novelId } = await params;

    const novel = await db.novel.findUnique({
      where: { id: novelId },
      include: {
        author: {
          select: { id: true, name: true, penName: true, avatar: true, bio: true },
        },
        genre: { select: { id: true, name: true, slug: true } },
        tags: { select: { id: true, name: true } },
        chapters: {
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
          orderBy: { number: "asc" },
        },
        _count: { select: { bookmarks: true } },
      },
    });

    if (!novel) {
      return apiError("ไม่พบนิยาย", 404);
    }

    // Increment view count (only for non-DRAFT novels)
    if (novel.status !== "DRAFT") {
      await db.novel.update({
        where: { id: novelId },
        data: { viewCount: { increment: 1 } },
      });
    }

    return apiSuccess({ novel });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/novels/[novelId] - Update novel
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    const session = await requireAuth();
    const { novelId } = await params;

    const novel = await db.novel.findUnique({ where: { id: novelId } });
    if (!novel) {
      return apiError("ไม่พบนิยาย", 404);
    }

    const role = (session.user as unknown as Record<string, unknown>).role as string;
    if (novel.authorId !== session.user.id && role !== "ADMIN") {
      return apiError("คุณไม่มีสิทธิ์แก้ไขนิยายนี้", 403);
    }

    const body = await request.json();
    const { title, synopsis, genreId, status, isAdult, coverImage, tagIds } = body;

    const updated = await db.novel.update({
      where: { id: novelId },
      data: {
        ...(title && { title }),
        ...(synopsis && { synopsis }),
        ...(genreId && { genreId }),
        ...(status && { status }),
        ...(isAdult !== undefined && { isAdult }),
        ...(coverImage !== undefined && { coverImage }),
        ...(tagIds && {
          tags: { set: tagIds.map((id: string) => ({ id })) },
        }),
      },
      include: {
        author: { select: { id: true, name: true, penName: true } },
        genre: { select: { id: true, name: true, slug: true } },
        tags: { select: { id: true, name: true } },
      },
    });

    return apiSuccess({ novel: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/novels/[novelId] - Delete novel
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    const session = await requireAuth();
    const { novelId } = await params;

    const novel = await db.novel.findUnique({ where: { id: novelId } });
    if (!novel) {
      return apiError("ไม่พบนิยาย", 404);
    }

    const role = (session.user as unknown as Record<string, unknown>).role as string;
    if (novel.authorId !== session.user.id && role !== "ADMIN") {
      return apiError("คุณไม่มีสิทธิ์ลบนิยายนี้", 403);
    }

    await db.novel.delete({ where: { id: novelId } });

    return apiMessage("ลบนิยายสำเร็จ");
  } catch (error) {
    return handleApiError(error);
  }
}
