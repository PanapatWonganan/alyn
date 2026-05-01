import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  apiPaginated,
  handleApiError,
  parsePagination,
  calculatePagination,
} from "@/lib/api-response";

// GET /api/users/[userId]/followers - List followers of user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { page, limit } = parsePagination(request.nextUrl.searchParams);
    const skip = (page - 1) * limit;

    const [total, follows] = await Promise.all([
      db.follow.count({ where: { followingId: userId } }),
      db.follow.findMany({
        where: { followingId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          follower: {
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
      ...f.follower,
      followedAt: f.createdAt,
    }));

    return apiPaginated(users, calculatePagination(total, page, limit));
  } catch (error) {
    return handleApiError(error);
  }
}
