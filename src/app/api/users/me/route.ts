import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

// GET /api/users/me - Get current user's full profile
export async function GET() {
  try {
    const session = await requireAuth();

    const user = await db.user.findUnique({
      where: { id: session.user.id },
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
        _count: {
          select: {
            novels: true,
            bookmarks: true,
            comments: true,
          },
        },
      },
    });

    return apiSuccess({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/users/me - Update current user's profile
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { name, penName, bio, avatar } = body;

    // Validate name is not empty
    if (!name || !name.trim()) {
      return apiError("กรุณากรอกชื่อ", 400);
    }

    const user = await db.user.update({
      where: { id: session.user.id },
      data: {
        ...(name && { name }),
        ...(penName !== undefined && { penName }),
        ...(bio !== undefined && { bio }),
        ...(avatar !== undefined && { avatar }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        penName: true,
        avatar: true,
        bio: true,
        role: true,
        coinBalance: true,
      },
    });

    return apiSuccess({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
