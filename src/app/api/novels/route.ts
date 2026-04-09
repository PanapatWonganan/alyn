import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireWriter } from "@/lib/auth-utils";
import { apiPaginated, apiSuccess, apiError, handleApiError, parsePagination, calculatePagination } from "@/lib/api-response";

// GET /api/novels - List novels with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePagination(searchParams);
    const genre = searchParams.get("genre");
    const status = searchParams.get("status");
    const sort = searchParams.get("sort") || "latest";
    const authorId = searchParams.get("authorId");

    const where: Record<string, unknown> = {};
    if (genre) where.genreId = genre;
    if (status) where.status = status;
    if (authorId) where.authorId = authorId;

    // Only show published novels (not DRAFT) for public listing
    if (!authorId) {
      where.status = { not: "DRAFT" };
    }

    const orderBy: Record<string, string> =
      sort === "popular"
        ? { viewCount: "desc" }
        : sort === "updated"
          ? { updatedAt: "desc" }
          : sort === "oldest"
            ? { createdAt: "asc" }
            : { createdAt: "desc" };

    const [novels, total] = await Promise.all([
      db.novel.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
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

    return apiPaginated(novels, calculatePagination(total, page, limit));
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/novels - Create a new novel
export async function POST(request: NextRequest) {
  try {
    const session = await requireWriter();

    const body = await request.json();
    const { title, synopsis, genreId, isAdult, tagIds } = body;

    if (!title || !synopsis || !genreId) {
      return apiError("กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อเรื่อง, เรื่องย่อ, หมวดหมู่)", 400);
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\u0E00-\u0E7F]+/g, "-")
      .replace(/^-|-$/g, "")
      || `novel-${Math.random().toString(36).slice(2, 10)}`;

    // Check unique slug
    const existingSlug = await db.novel.findUnique({ where: { slug } });
    const finalSlug = existingSlug ? `${slug}-${Math.random().toString(36).slice(2, 10)}` : slug;

    const novel = await db.novel.create({
      data: {
        title,
        slug: finalSlug,
        synopsis,
        genreId,
        authorId: session.user.id,
        isAdult: isAdult || false,
        tags: tagIds?.length
          ? { connect: tagIds.map((id: string) => ({ id })) }
          : undefined,
      },
      include: {
        author: {
          select: { id: true, name: true, penName: true },
        },
        genre: { select: { id: true, name: true, slug: true } },
        tags: { select: { id: true, name: true } },
      },
    });

    return apiSuccess({ novel }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
