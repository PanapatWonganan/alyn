import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { NextRequest } from "next/server";
import { apiMessage, handleApiError } from "@/lib/api-response";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    await requireAdmin();
    const { commentId } = await params;

    await db.comment.delete({
      where: { id: commentId },
    });

    return apiMessage("ลบความคิดเห็นสำเร็จ", { success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
