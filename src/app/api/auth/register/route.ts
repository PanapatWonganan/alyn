import { NextRequest } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { apiMessage, apiError, handleApiError } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, penName, role } = body;

    // Validation
    if (!email || !password || !name) {
      return apiError("กรุณากรอกข้อมูลให้ครบถ้วน", 400);
    }

    if (password.length < 8) {
      return apiError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร", 400);
    }

    const validRoles = ["READER", "WRITER"];
    const userRole = validRoles.includes(role) ? role : "READER";

    // Normalize email
    const normalizedEmail = email.toLowerCase();

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return apiError("อีเมลนี้ถูกใช้งานแล้ว", 409);
    }

    // Hash password
    const passwordHash = await hash(password, 10);

    // Create user
    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name,
        penName: userRole === "WRITER" ? penName || null : null,
        role: userRole,
      },
    });

    return apiMessage(
      "สมัครสมาชิกสำเร็จ",
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
