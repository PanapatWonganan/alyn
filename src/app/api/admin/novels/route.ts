import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { NextRequest } from "next/server";
import { handleApiError, parsePagination, calculatePagination } from "@/lib/api-response";
import { NextResponse } from "next/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const { page, limit } = parsePagination(searchParams);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.title = {
        contains: search,
        mode: "insensitive",
      };
    }

    if (status && ["DRAFT", "ONGOING", "COMPLETED", "HIATUS"].includes(status)) {
      where.status = status;
    }

    const [novels, total] = await Promise.all([
      db.novel.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              penName: true,
              email: true,
            },
          },
          genre: {
            select: {
              id: true,
              name: true,
              icon: true,
            },
          },
          _count: {
            select: {
              chapters: true,
              bookmarks: true,
            },
          },
        },
      }),
      db.novel.count({ where }),
    ]);

    return NextResponse.json({
      data: novels,
      pagination: calculatePagination(total, page, limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
