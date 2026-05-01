import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { apiMessage, apiError, handleApiError } from "@/lib/api-response";

// POST /api/users/[userId]/follow - Follow a user
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireAuth();
    const { userId: targetId } = await params;
    const followerId = session.user.id as string;

    if (followerId === targetId) {
      return apiError("ไม่สามารถติดตามตัวเองได้", 400);
    }

    const target = await db.user.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    if (!target) {
      return apiError("ไม่พบผู้ใช้", 404);
    }

    await db.follow.upsert({
      where: {
        followerId_followingId: { followerId, followingId: targetId },
      },
      update: {},
      create: { followerId, followingId: targetId },
    });

    const followerCount = await db.follow.count({
      where: { followingId: targetId },
    });

    return apiMessage("ติดตามสำเร็จ", { following: true, followerCount }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/users/[userId]/follow - Unfollow a user
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireAuth();
    const { userId: targetId } = await params;
    const followerId = session.user.id as string;

    await db.follow
      .delete({
        where: {
          followerId_followingId: { followerId, followingId: targetId },
        },
      })
      .catch(() => null);

    const followerCount = await db.follow.count({
      where: { followingId: targetId },
    });

    return apiMessage("เลิกติดตามแล้ว", { following: false, followerCount });
  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/users/[userId]/follow - Check follow status and count
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: targetId } = await params;

    const followerCount = await db.follow.count({
      where: { followingId: targetId },
    });

    let following = false;
    try {
      const session = await requireAuth();
      const followerId = session.user.id as string;
      if (followerId && followerId !== targetId) {
        const existing = await db.follow.findUnique({
          where: {
            followerId_followingId: { followerId, followingId: targetId },
          },
          select: { id: true },
        });
        following = !!existing;
      }
    } catch {
      // not logged in — that's fine
    }

    return Response.json({ following, followerCount });
  } catch (error) {
    return handleApiError(error);
  }
}
