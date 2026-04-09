import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiError, handleApiError, parsePagination, calculatePagination } from "@/lib/api-response";
import { NextResponse } from "next/server";

// GET /api/search?q=keyword - Search novels
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const genre = searchParams.get("genre");
    const { page, limit } = parsePagination(searchParams);

    if (!q || q.length < 1) {
      return apiError("กรุณาระบุคำค้นหา", 400);
    }

    const where: Record<string, unknown> = {
      status: { not: "DRAFT" },
      OR: [
        { title: { contains: q } },
        { synopsis: { contains: q } },
        { author: { name: { contains: q } } },
        { author: { penName: { contains: q } } },
        { tags: { some: { name: { contains: q } } } },
      ],
    };

    if (genre) {
      where.genreId = genre;
    }

    const [novels, total] = await Promise.all([
      db.novel.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { viewCount: "desc" },
        include: {
          author: {
            select: { id: true, name: true, penName: true, avatar: true },
          },
          genre: { select: { id: true, name: true, slug: true } },
          tags: { select: { id: true, name: true } },
          _count: { select: { chapters: true, bookmarks: true } },
        },
      }),
      db.novel.count({ where }),
    ]);

    return NextResponse.json({
      data: novels,
      query: q,
      pagination: calculatePagination(total, page, limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
