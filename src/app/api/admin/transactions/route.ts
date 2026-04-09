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
    const type = searchParams.get("type") || "";
    const { page, limit } = parsePagination(searchParams);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (
      type &&
      ["TOPUP", "PURCHASE", "EARNING", "DONATION_SENT", "DONATION_RECEIVED"].includes(
        type
      )
    ) {
      where.type = type;
    }

    const [transactions, total, summary] = await Promise.all([
      db.coinTransaction.findMany({
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
              email: true,
              avatar: true,
            },
          },
        },
      }),
      db.coinTransaction.count({ where }),
      db.coinTransaction.groupBy({
        by: ["type"],
        _sum: {
          amount: true,
        },
      }),
    ]);

    // Calculate summary
    const summaryData = {
      totalTopups: 0,
      totalPurchases: 0,
      totalDonations: 0,
      totalEarnings: 0,
    };

    summary.forEach((item) => {
      const amount = item._sum.amount || 0;
      switch (item.type) {
        case "TOPUP":
          summaryData.totalTopups = amount;
          break;
        case "PURCHASE":
          summaryData.totalPurchases = Math.abs(amount); // Make positive for display
          break;
        case "DONATION_SENT":
          // Only count DONATION_SENT to avoid double-counting
          // (each donation creates both SENT and RECEIVED records)
          summaryData.totalDonations = Math.abs(amount);
          break;
        case "EARNING":
          summaryData.totalEarnings = amount;
          break;
      }
    });

    return NextResponse.json({
      data: transactions,
      pagination: calculatePagination(total, page, limit),
      summary: summaryData,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
