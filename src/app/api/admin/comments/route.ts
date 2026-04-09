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
    const { page, limit } = parsePagination(searchParams);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        {
          content: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          user: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    const [comments, total] = await Promise.all([
      db.comment.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              penName: true,
              avatar: true,
              email: true,
            },
          },
          chapter: {
            select: {
              id: true,
              number: true,
              title: true,
              novel: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      }),
      db.comment.count({ where }),
    ]);

    return NextResponse.json({
      data: comments,
      pagination: calculatePagination(total, page, limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
