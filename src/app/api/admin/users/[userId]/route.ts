import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const result = await requireAdmin();
    if (result instanceof NextResponse) return result;

    const { userId } = await params;

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        novels: {
          select: {
            id: true,
            title: true,
            status: true,
            viewCount: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            chapter: {
              select: {
                title: true,
                novel: {
                  select: {
                    title: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        transactions: {
          select: {
            id: true,
            type: true,
            amount: true,
            description: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        _count: {
          select: {
            novels: true,
            comments: true,
            bookmarks: true,
            transactions: true,
          },
        },
      },
    });

    if (!user) {
      return apiError("User not found", 404);
    }

    return apiSuccess({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const result = await requireAdmin();
    if (result instanceof NextResponse) return result;
    const session = result;

    const { userId } = await params;
    const body = await request.json();

    // Prevent admin from changing their own role
    if (userId === session.user?.id && body.role !== undefined) {
      return apiError("ไม่สามารถเปลี่ยน role ของตัวเองได้", 400);
    }

    // Validate role if provided
    if (body.role && !["READER", "WRITER", "ADMIN"].includes(body.role)) {
      return apiError("Invalid role value", 400);
    }

    // Build update data - only allow specific fields
    // Explicitly type to prevent arbitrary field modification
    const updateData: {
      role?: string;
      name?: string;
      penName?: string;
      bio?: string;
      isActive?: boolean;
    } = {};
    if (body.role !== undefined) updateData.role = body.role;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.penName !== undefined) updateData.penName = body.penName;
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const user = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        penName: true,
        avatar: true,
        bio: true,
        role: true,
        coinBalance: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return apiSuccess({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const result = await requireAdmin();
    if (result instanceof NextResponse) return result;

    // Return error message as requested
    return apiError("ไม่สามารถลบผู้ใช้ได้ กรุณาใช้การเปลี่ยน role แทน", 400);
  } catch (error) {
    return handleApiError(error);
  }
}
