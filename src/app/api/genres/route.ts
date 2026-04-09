import { db } from "@/lib/db";
import { apiSuccess, handleApiError } from "@/lib/api-response";

// GET /api/genres - List all genres
export async function GET() {
  try {
    const genres = await db.genre.findMany({
      include: {
        _count: { select: { novels: true } },
      },
      orderBy: { name: "asc" },
    });

    return apiSuccess({ genres });
  } catch (error) {
    return handleApiError(error);
  }
}
