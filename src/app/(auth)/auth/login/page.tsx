"use client";

import Button from "@/components/ui/Button";
import { BookOpen, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      } else {
        const session = await getSession();
        const role = (session?.user as Record<string, unknown>)?.role as string;
        if (role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/");
        }
        router.refresh();
      }
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
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

          <h1 className="text-2xl font-bold text-brand-black">เข้าสู่ระบบ</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            ยินดีต้อนรับกลับ เข้าสู่ระบบเพื่อเริ่มอ่านนิยาย
          </p>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

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

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-brand-black">
                  รหัสผ่าน
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-rosegold-dark hover:underline"
                >
                  ลืมรหัสผ่าน?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="รหัสผ่าน"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  กำลังเข้าสู่ระบบ...
                </span>
              ) : (
                "เข้าสู่ระบบ"
              )}
            </Button>
          </form>

          {/* Demo accounts hint */}
          <div className="mt-4 rounded-xl border border-border bg-cream/50 px-4 py-3 text-xs text-muted-foreground">
            <p className="font-medium text-brand-black">บัญชีทดสอบ:</p>
            <p>นักอ่าน: reader@alyn.co / password123</p>
            <p>นักเขียน: writer@alyn.co / password123</p>
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            ยังไม่มีบัญชี?{" "}
            <Link
              href="/auth/register"
              className="font-semibold text-rosegold-dark hover:underline"
            >
              สมัครสมาชิก
            </Link>
          </div>
        </div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-rosegold-dark to-rosegold items-center justify-center p-12">
        <div className="max-w-md text-center text-white space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
            <BookOpen className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-bold">พื้นที่แห่งปัญญา</h2>
          <p className="text-lg leading-relaxed text-white/80">
            อลิน คัดสรรนิยายคุณภาพหลากหลายแนว
            ให้คุณดื่มด่ำกับเรื่องราวที่ดีที่สุด
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
