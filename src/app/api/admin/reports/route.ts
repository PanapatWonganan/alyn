import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import {
  apiPaginated,
  handleApiError,
  parsePagination,
  calculatePagination,
} from "@/lib/api-response";

// GET /api/admin/reports - List reports (default: pending)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PENDING";
    const { page, limit } = parsePagination(searchParams);

    const where: Record<string, unknown> = {};
    if (["PENDING", "RESOLVED", "DISMISSED"].includes(status)) {
      where.status = status;
    }

    const [reports, total] = await Promise.all([
      db.report.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          reporter: {
            select: { id: true, name: true, penName: true, email: true },
          },
        },
      }),
      db.report.count({ where }),
    ]);

    return apiPaginated(reports, calculatePagination(total, page, limit));
  } catch (error) {
    return handleApiError(error);
  }
}
