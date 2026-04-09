import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { apiMessage, handleApiError, parsePagination, calculatePagination } from "@/lib/api-response";
import { NextResponse } from "next/server";

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePagination(searchParams);
    const unreadOnly = searchParams.get("unread") === "true";

    const where: Record<string, unknown> = { userId: session.user.id };
    if (unreadOnly) where.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.notification.count({ where }),
      db.notification.count({
        where: { userId: session.user.id, isRead: false },
      }),
    ]);

    return NextResponse.json({
      data: notifications,
      unreadCount,
      pagination: calculatePagination(total, page, limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/notifications - Mark notifications as read
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { notificationIds, markAll } = await request.json();

    if (markAll) {
      await db.notification.updateMany({
        where: { userId: session.user.id, isRead: false },
        data: { isRead: true },
      });
    } else if (notificationIds?.length) {
      await db.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: session.user.id,
        },
        data: { isRead: true },
      });
    }

    return apiMessage("อ่านแจ้งเตือนแล้ว");
  } catch (error) {
    return handleApiError(error);
  }
}
