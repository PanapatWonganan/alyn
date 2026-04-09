import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { handleApiError, parsePagination, calculatePagination } from "@/lib/api-response";
import { NextResponse } from "next/server";

// GET /api/coins/transactions - Get user's transaction history
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePagination(searchParams);
    const type = searchParams.get("type"); // TOPUP | PURCHASE | EARNING | DONATION_SENT | DONATION_RECEIVED

    const where: Record<string, unknown> = { userId: session.user.id };
    if (type) where.type = type;

    const [transactions, total, user] = await Promise.all([
      db.coinTransaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.coinTransaction.count({ where }),
      db.user.findUnique({
        where: { id: session.user.id },
        select: { coinBalance: true },
      }),
    ]);

    return NextResponse.json({
      data: transactions,
      coinBalance: user?.coinBalance || 0,
      pagination: calculatePagination(total, page, limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
