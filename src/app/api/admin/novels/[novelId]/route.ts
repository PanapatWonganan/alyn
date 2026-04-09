import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { NextRequest } from "next/server";
import { apiSuccess, apiMessage, apiError, handleApiError } from "@/lib/api-response";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    await requireAdmin();
    const { novelId } = await params;

    const novel = await db.novel.findUnique({
      where: { id: novelId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            penName: true,
            email: true,
            avatar: true,
          },
        },
        genre: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
          },
        },
        chapters: {
          select: {
            id: true,
            number: true,
            title: true,
            wordCount: true,
            coinPrice: true,
            isFree: true,
            publishedAt: true,
            createdAt: true,
          },
          orderBy: {
            number: "asc",
          },
        },
        _count: {
          select: {
            bookmarks: true,
            chapters: true,
          },
        },
      },
    });

    if (!novel) {
      return apiError("ไม่พบนิยาย", 404);
    }

    return apiSuccess({ novel });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    await requireAdmin();
    const { novelId } = await params;
    const body = await request.json();
    const { status, isAdult } = body;

    const updateData: any = {};

    if (status && ["DRAFT", "ONGOING", "COMPLETED", "HIATUS"].includes(status)) {
      updateData.status = status;
    }

    if (typeof isAdult === "boolean") {
      updateData.isAdult = isAdult;
    }

    const novel = await db.novel.update({
      where: { id: novelId },
      data: updateData,
    });

    return apiSuccess({ novel });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    await requireAdmin();
    const { novelId } = await params;

    // Delete novel (cascade will handle related records)
    await db.novel.delete({
      where: { id: novelId },
    });

    return apiMessage("ลบนิยายสำเร็จ", { success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
