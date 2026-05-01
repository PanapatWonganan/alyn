import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";

export const metadata = {
  title: "ยืนยันอีเมล",
  description: "ยืนยันอีเมลสำหรับบัญชี Alyn ของคุณ",
};

type Status = "success" | "already" | "invalid" | "expired" | "missing";

async function verifyToken(token: string | undefined): Promise<Status> {
  if (!token) return "missing";

  const user = await db.user.findFirst({
    where: { emailVerifyToken: token },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      emailVerifyTokenExpiresAt: true,
    },
  });

  if (!user) return "invalid";
  if (user.emailVerified) return "already";
  if (
    !user.emailVerifyTokenExpiresAt ||
    user.emailVerifyTokenExpiresAt.getTime() < Date.now()
  ) {
    return "expired";
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      emailVerifyToken: null,
      emailVerifyTokenExpiresAt: null,
    },
  });

  try {
    await sendWelcomeEmail(user.email, user.name);
  } catch (err) {
    console.error("[verify-email] Failed to send welcome email:", err);
  }

  return "success";
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const params = await searchParams;

  // If an explicit error was passed via the API redirect, honor it.
  let status: Status;
  if (params.error === "missing") status = "missing";
  else if (params.error === "invalid") status = "invalid";
  else if (params.error === "expired") status = "expired";
  else status = await verifyToken(params.token);

  if (status === "success") {
    redirect("/auth/verify-email/success");
  }

  const messages: Record<Status, { title: string; body: string }> = {
    success: {
      title: "ยืนยันอีเมลสำเร็จ",
      body: "บัญชีของคุณพร้อมใช้งานแล้ว",
    },
    already: {
      title: "อีเมลนี้ได้รับการยืนยันแล้ว",
      body: "คุณสามารถเข้าสู่ระบบได้ทันที",
    },
    invalid: {
      title: "ลิงก์ยืนยันไม่ถูกต้อง",
      body: "ลิงก์นี้อาจถูกใช้งานไปแล้ว หรือไม่มีอยู่ในระบบ",
    },
    expired: {
      title: "ลิงก์ยืนยันหมดอายุแล้ว",
      body: "กรุณาเข้าสู่ระบบและขอลิงก์ยืนยันใหม่",
    },
    missing: {
      title: "ไม่พบโทเคนยืนยัน",
      body: "โปรดตรวจสอบลิงก์ในอีเมลของคุณอีกครั้ง",
    },
  };

  const msg = messages[status];

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-rosegold tracking-widest">
            อลิน
          </h1>
          <p className="text-sm text-rosegold-dark mt-1">
            แพลตฟอร์มนิยายออนไลน์คุณภาพ
          </p>
        </div>
        <h2 className="text-2xl font-semibold text-brand-black mb-3">
          {msg.title}
        </h2>
        <p className="text-brand-black/70 mb-6">{msg.body}</p>
        <div className="flex flex-col gap-3">
          <Link
            href="/auth/login"
            className="w-full inline-block py-3 px-4 rounded-lg bg-rosegold text-white font-semibold hover:bg-rosegold-dark transition-colors"
          >
            ไปหน้าเข้าสู่ระบบ
          </Link>
          {(status === "expired" || status === "invalid") && (
            <Link
              href="/auth/register"
              className="w-full inline-block py-3 px-4 rounded-lg border border-rosegold text-rosegold font-semibold hover:bg-cream transition-colors"
            >
              สมัครสมาชิกใหม่
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
