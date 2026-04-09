import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { apiMessage, apiError, handleApiError } from "@/lib/api-response";

// DELETE /api/comments/[commentId] - Delete a comment (owner or admin)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const session = await requireAuth();
    const { commentId } = await params;

    const comment = await db.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      return apiError("ไม่พบความคิดเห็น", 404);
    }

    const role = (session.user as unknown as Record<string, unknown>).role as string;
    if (comment.userId !== session.user.id && role !== "ADMIN") {
      return apiError("คุณไม่มีสิทธิ์ลบ", 403);
    }

    await db.comment.delete({ where: { id: commentId } });
    return apiMessage("ลบความคิดเห็นแล้ว");
  } catch (error) {
    return handleApiError(error);
  }
}
