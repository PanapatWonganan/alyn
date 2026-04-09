import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashSync } from "bcryptjs";
import { apiMessage, apiError, handleApiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, newPassword } = body;

    // Validate inputs
    if (!token || !newPassword) {
      return apiError("กรุณากรอกข้อมูลให้ครบถ้วน", 400);
    }

    if (newPassword.length < 8) {
      return apiError("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร", 400);
    }

    // Find user by reset token and check if not expired
    const user = await db.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(), // Token expiry is greater than now
        },
      },
      select: { id: true },
    });

    if (!user) {
      return apiError("ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว", 400);
    }

    // Hash new password
    const passwordHash = hashSync(newPassword, 10);

    // Update password and clear reset token
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return apiMessage("รีเซ็ตรหัสผ่านเรียบร้อยแล้ว");
  } catch (error) {
    return handleApiError(error);
  }
}
