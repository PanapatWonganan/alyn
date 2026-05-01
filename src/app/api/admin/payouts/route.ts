import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import {
  apiSuccess,
  handleApiError,
  parsePagination,
  calculatePagination,
} from "@/lib/api-response";

// GET /api/admin/payouts - List payout requests (admin)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status") ?? undefined;
    const { page, limit } = parsePagination(searchParams);

    const where = status ? { status } : {};

    const [requests, total] = await Promise.all([
      db.payoutRequest.findMany({
        where,
        orderBy: { requestedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              penName: true,
              avatar: true,
              coinBalance: true,
            },
          },
        },
      }),
      db.payoutRequest.count({ where }),
    ]);

    return apiSuccess({
      data: requests,
      pagination: calculatePagination(total, page, limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
