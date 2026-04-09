import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// POST /api/upload - Upload an image
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return apiError("กรุณาเลือกไฟล์", 400);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return apiError("รองรับเฉพาะไฟล์ JPG, PNG, WebP", 400);
    }

    if (file.size > MAX_SIZE) {
      return apiError("ไฟล์ต้องมีขนาดไม่เกิน 5MB", 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename with extension based on validated MIME type
    const extMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };
    const ext = extMap[file.type];
    if (!ext) {
      return apiError("รองรับเฉพาะไฟล์ JPG, PNG, WebP", 400);
    }
    const filename = `${crypto.randomUUID()}.${ext}`;
    const uploadPath = path.join(process.cwd(), "public", "uploads", "covers", filename);

    await writeFile(uploadPath, buffer);

    const url = `/uploads/covers/${filename}`;

    return apiSuccess({ url, filename });
  } catch (error) {
    return handleApiError(error);
  }
}
