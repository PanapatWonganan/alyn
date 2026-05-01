import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { NextRequest } from "next/server";
import { apiMessage, handleApiError } from "@/lib/api-response";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    await requireAdmin();
    const { commentId } = await params;

    // Soft delete: replace content with admin marker
    await db.comment.update({
      where: { id: commentId },
      data: { content: "[ลบโดยผู้ดูแล]" },
    });

    return apiMessage("ลบความคิดเห็นสำเร็จ", { success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
