import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

// GET /api/users/[userId] - Get user profile
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        penName: true,
        avatar: true,
        bio: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            novels: true,
            donationsReceived: true,
          },
        },
      },
    });

    if (!user) {
      return apiError("ไม่พบผู้ใช้", 404);
    }

    // Get user's published novels
    const novels = await db.novel.findMany({
      where: { authorId: userId, status: { not: "DRAFT" } },
      orderBy: { viewCount: "desc" },
      take: 10,
      include: {
        genre: { select: { id: true, name: true, slug: true } },
        _count: { select: { chapters: true, bookmarks: true } },
      },
    });

    // Get total views across all novels
    const totalViews = await db.novel.aggregate({
      where: { authorId: userId },
      _sum: { viewCount: true },
    });

    return apiSuccess({
      user,
      novels,
      stats: {
        totalNovels: user._count.novels,
        totalViews: totalViews._sum.viewCount || 0,
        totalDonations: user._count.donationsReceived,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
