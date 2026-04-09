import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { apiSuccess, apiMessage, apiError, handleApiError } from "@/lib/api-response";
import { NextResponse } from "next/server";

// GET /api/bookmarks - Get user's bookmarks
export async function GET() {
  try {
    const session = await requireAuth();

    const bookmarks = await db.bookmark.findMany({
      where: { userId: session.user.id },
      include: {
        novel: {
          select: {
            id: true,
            title: true,
            synopsis: true,
            coverImage: true,
            status: true,
            viewCount: true,
            author: { select: { id: true, name: true, penName: true } },
            genre: { select: { id: true, name: true, slug: true } },
            _count: { select: { chapters: true, bookmarks: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess({ bookmarks });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/bookmarks - Toggle bookmark
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { novelId } = await request.json();

    if (!novelId) {
      return apiError("กรุณาระบุนิยาย", 400);
    }

    // Check if bookmark exists
    const existing = await db.bookmark.findUnique({
      where: {
        userId_novelId: {
          userId: session.user.id,
          novelId,
        },
      },
    });

    if (existing) {
      // Remove bookmark
      await db.bookmark.delete({ where: { id: existing.id } });
      return NextResponse.json({ bookmarked: false, message: "ลบบุ๊คมาร์คแล้ว" });
    } else {
      // Add bookmark
      await db.bookmark.create({
        data: {
          userId: session.user.id,
          novelId,
        },
      });
      return NextResponse.json({ bookmarked: true, message: "เพิ่มบุ๊คมาร์คแล้ว" });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
