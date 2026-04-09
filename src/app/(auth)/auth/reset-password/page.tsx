"use client";

import { Lock, Eye, EyeOff, Loader2, Check, AlertCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง");
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validate passwords
    if (newPassword.length < 6) {
      setError("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาด");
      }

      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
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

          <h1 className="text-2xl font-bold text-brand-black">รีเซ็ตรหัสผ่าน</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            กรอกรหัสผ่านใหม่ของคุณ
          </p>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="mt-8 space-y-6">
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-green-900">
                  รีเซ็ตรหัสผ่านสำเร็จ
                </h3>
                <p className="text-sm text-green-700">
                  รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว
                  กำลังนำคุณไปหน้าเข้าสู่ระบบ...
                </p>
              </div>

              <Link
                href="/auth/login"
                className="flex items-center justify-center gap-2 rounded-full bg-rosegold-dark px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-rosegold"
              >
                ไปหน้าเข้าสู่ระบบ
              </Link>
            </div>
          ) : !token ? (
            <div className="mt-8">
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-red-900">
                  ลิงก์ไม่ถูกต้อง
                </h3>
                <p className="text-sm text-red-700">
                  ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว
                  กรุณาขอลิงก์ใหม่อีกครั้ง
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <Link
                  href="/auth/forgot-password"
                  className="flex items-center justify-center gap-2 rounded-full bg-rosegold-dark px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-rosegold"
                >
                  ขอลิงก์รีเซ็ตรหัสผ่านใหม่
                </Link>
                <Link
                  href="/auth/login"
                  className="flex items-center justify-center gap-2 rounded-full border border-border bg-white px-6 py-3 text-sm font-medium text-brand-black transition-colors hover:bg-cream"
                >
                  กลับไปหน้าเข้าสู่ระบบ
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {/* New Password */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-brand-black">
                  รหัสผ่านใหม่
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-border bg-white py-3 pl-10 pr-12 text-sm placeholder:text-muted-foreground focus:border-rosegold focus:outline-none focus:ring-2 focus:ring-rosegold/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-brand-black"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-brand-black">
                  ยืนยันรหัสผ่านใหม่
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-border bg-white py-3 pl-10 pr-12 text-sm placeholder:text-muted-foreground focus:border-rosegold focus:outline-none focus:ring-2 focus:ring-rosegold/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-brand-black"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
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
                    กำลังรีเซ็ตรหัสผ่าน...
                  </span>
                ) : (
                  "รีเซ็ตรหัสผ่าน"
                )}
              </button>
            </form>
          )}

          {!success && (
            <div className="mt-6 text-center">
              <Link
                href="/auth/login"
                className="text-sm text-rosegold-dark hover:underline"
              >
                กลับไปหน้าเข้าสู่ระบบ
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-rosegold-dark to-rosegold items-center justify-center p-12">
        <div className="max-w-md text-center text-white space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
            <Lock className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-bold">สร้างรหัสผ่านใหม่</h2>
          <p className="text-lg leading-relaxed text-white/80">
            เลือกรหัสผ่านที่ปลอดภัย
            เพื่อปกป้องบัญชีและข้อมูลส่วนตัวของคุณ
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-rosegold-dark" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
