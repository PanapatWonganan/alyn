import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { apiPaginated, handleApiError, parsePagination, calculatePagination } from "@/lib/api-response";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const result = await requireAdmin();
    if (result instanceof NextResponse) return result;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const { page, limit } = parsePagination(searchParams);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Search by name or email
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filter by role
    if (role && ["READER", "WRITER", "ADMIN"].includes(role)) {
      where.role = role;
    }

    // Get users with counts
    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          penName: true,
          avatar: true,
          role: true,
          coinBalance: true,
          createdAt: true,
          _count: {
            select: {
              novels: true,
              comments: true,
              bookmarks: true,
            },
          },
        },
      }),
      db.user.count({ where }),
    ]);

    return apiPaginated(users, calculatePagination(total, page, limit));
  } catch (error) {
    return handleApiError(error);
  }
}
