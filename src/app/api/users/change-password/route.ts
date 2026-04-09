import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { compareSync, hashSync } from "bcryptjs";
import { apiMessage, apiError, handleApiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    // Require authentication
    const session = await requireAuth();
    const userId = (session.user as { id: string }).id;

    // Parse request body
    const body = await req.json();
    const { currentPassword, newPassword } = body;

    // Validate inputs
    if (!currentPassword || !newPassword) {
      return apiError("กรุณากรอกข้อมูลให้ครบถ้วน", 400);
    }

    if (newPassword.length < 8) {
      return apiError("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร", 400);
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      return apiError("ไม่พบผู้ใช้งาน", 404);
    }

    // Verify current password
    const isPasswordValid = compareSync(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      return apiError("รหัสผ่านปัจจุบันไม่ถูกต้อง", 401);
    }

    // Hash new password
    const newPasswordHash = hashSync(newPassword, 10);

    // Update password in database
    await db.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    return apiMessage("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว");
  } catch (error) {
    return handleApiError(error);
  }
}
