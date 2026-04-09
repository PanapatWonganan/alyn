"use client";

import { Mail, ArrowLeft, Loader2, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาด");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="mb-8 inline-block">
            <Image
              src="/logo/Logo_Primary.svg"
              alt="Alyn"
              width={120}
              height={40}
              className="h-10 w-auto"
            />
          </Link>

          <h1 className="text-2xl font-bold text-brand-black">ลืมรหัสผ่าน?</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            กรอกอีเมลของคุณ เราจะส่งลิงก์สำหรับรีเซ็ตรหัสผ่านให้คุณ
          </p>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {success ? (
            <div className="mt-8 space-y-6">
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-green-900">
                  ส่งลิงก์เรียบร้อยแล้ว
                </h3>
                <p className="text-sm text-green-700">
                  หากอีเมลนี้มีในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปแล้ว
                  กรุณาตรวจสอบอีเมลของคุณ
                </p>
              </div>

              <div className="rounded-xl border border-border bg-cream/50 px-4 py-3 text-xs text-muted-foreground">
                <p className="font-medium text-brand-black mb-1">หมายเหตุ:</p>
                <p>
                  ลิงก์รีเซ็ตรหัสผ่านจะหมดอายุภายใน 1 ชั่วโมง
                  หากไม่พบอีเมล กรุณาตรวจสอบในโฟลเดอร์สแปม
                </p>
              </div>

              <Link
                href="/auth/login"
                className="flex items-center justify-center gap-2 rounded-full border border-border bg-white px-6 py-3 text-sm font-medium text-brand-black transition-colors hover:bg-cream"
              >
                <ArrowLeft className="h-4 w-4" />
                กลับไปหน้าเข้าสู่ระบบ
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                {/* Email */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-brand-black">
                    อีเมล
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full rounded-xl border border-border bg-white py-3 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-rosegold focus:outline-none focus:ring-2 focus:ring-rosegold/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-rosegold-dark px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-rosegold disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      กำลังส่งลิงก์...
                    </span>
                  ) : (
                    "ส่งลิงก์รีเซ็ตรหัสผ่าน"
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 text-sm text-rosegold-dark hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  กลับไปหน้าเข้าสู่ระบบ
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-rosegold-dark to-rosegold items-center justify-center p-12">
        <div className="max-w-md text-center text-white space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
            <Mail className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-bold">รีเซ็ตรหัสผ่าน</h2>
          <p className="text-lg leading-relaxed text-white/80">
            ไม่ต้องกังวล เราจะช่วยคุณกู้คืนบัญชี
            เพื่อให้คุณกลับมาอ่านนิยายที่คุณรักได้อีกครั้ง
          </p>
          <Image
            src="/logo/Logo_White.svg"
            alt="Alyn"
            width={150}
            height={50}
            className="mx-auto h-12 w-auto opacity-50"
          />
        </div>
      </div>
    </div>
  );
}
