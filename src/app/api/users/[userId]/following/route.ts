import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  apiPaginated,
  handleApiError,
  parsePagination,
  calculatePagination,
} from "@/lib/api-response";

// GET /api/users/[userId]/following - List users that [userId] follows
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { page, limit } = parsePagination(request.nextUrl.searchParams);
    const skip = (page - 1) * limit;

    const [total, follows] = await Promise.all([
      db.follow.count({ where: { followerId: userId } }),
      db.follow.findMany({
        where: { followerId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          following: {
            select: {
              id: true,
              name: true,
              penName: true,
              avatar: true,
              bio: true,
              role: true,
            },
          },
        },
      }),
    ]);

    const users = follows.map((f) => ({
      ...f.following,
      followedAt: f.createdAt,
    }));

    return apiPaginated(users, calculatePagination(total, page, limit));
  } catch (error) {
    return handleApiError(error);
  }
}
