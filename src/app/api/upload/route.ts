import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { rateLimitRequest } from "@/lib/rate-limit";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// POST /api/upload - Upload an image
export async function POST(request: NextRequest) {
  try {
    const limit = rateLimitRequest(request, "upload:post", 10, 60 * 60 * 1000);
    if (!limit.success) {
      return apiError("คำขอมากเกินไป กรุณาลองอีกครั้งในภายหลัง", 429, "RATE_LIMITED");
    }

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
    const uploadDir = path.join(process.cwd(), "public", "uploads", "covers");
    const uploadPath = path.join(uploadDir, filename);

    await mkdir(uploadDir, { recursive: true });
    await writeFile(uploadPath, buffer);

    const url = `/uploads/covers/${filename}`;

    return apiSuccess({ url, filename });
  } catch (error) {
    return handleApiError(error);
  }
}
