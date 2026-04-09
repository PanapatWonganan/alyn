"use client";

import Button from "@/components/ui/Button";
import { BookOpen, Mail, Lock, Eye, EyeOff, User, PenTool, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"reader" | "writer">("reader");
  const [name, setName] = useState("");
  const [penName, setPenName] = useState("");
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
      // Register
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          penName: role === "writer" ? penName : undefined,
          email,
          password,
          role: role === "writer" ? "WRITER" : "READER",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "เกิดข้อผิดพลาด");
        setLoading(false);
        return;
      }

      // Auto login after registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Registration succeeded but auto-login failed, redirect to login
        router.push("/auth/login");
      } else {
        router.push("/");
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

          <h1 className="text-2xl font-bold text-brand-black">สมัครสมาชิก</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            เข้าร่วมชุมชนอลิน เริ่มอ่านและเขียนนิยายวันนี้
          </p>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Role Selection */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("reader")}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                role === "reader"
                  ? "border-rosegold-dark bg-cream"
                  : "border-border hover:border-rosegold/30"
              }`}
            >
              <BookOpen
                className={`h-6 w-6 ${
                  role === "reader"
                    ? "text-rosegold-dark"
                    : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  role === "reader"
                    ? "text-rosegold-dark"
                    : "text-muted-foreground"
                }`}
              >
                นักอ่าน
              </span>
            </button>
            <button
              type="button"
              onClick={() => setRole("writer")}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                role === "writer"
                  ? "border-rosegold-dark bg-cream"
                  : "border-border hover:border-rosegold/30"
              }`}
            >
              <PenTool
                className={`h-6 w-6 ${
                  role === "writer"
                    ? "text-rosegold-dark"
                    : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  role === "writer"
                    ? "text-rosegold-dark"
                    : "text-muted-foreground"
                }`}
              >
                นักเขียน
              </span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-black">
                ชื่อผู้ใช้
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="ชื่อที่แสดงในระบบ"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-white py-3 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-rosegold focus:outline-none focus:ring-2 focus:ring-rosegold/20"
                />
              </div>
            </div>

            {/* Pen Name (for writer) */}
            {role === "writer" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-brand-black">
                  นามปากกา
                </label>
                <div className="relative">
                  <PenTool className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="นามปากกาของคุณ"
                    value={penName}
                    onChange={(e) => setPenName(e.target.value)}
                    className="w-full rounded-xl border border-border bg-white py-3 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-rosegold focus:outline-none focus:ring-2 focus:ring-rosegold/20"
                  />
                </div>
              </div>
            )}

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
              <label className="mb-1.5 block text-sm font-medium text-brand-black">
                รหัสผ่าน
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
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
                  กำลังสมัครสมาชิก...
                </span>
              ) : (
                "สมัครสมาชิก"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            มีบัญชีอยู่แล้ว?{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-rosegold-dark hover:underline"
            >
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-rosegold to-rosegold-dark items-center justify-center p-12">
        <div className="max-w-md text-center text-white space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
            {role === "writer" ? (
              <PenTool className="h-10 w-10" />
            ) : (
              <BookOpen className="h-10 w-10" />
            )}
          </div>
          <h2 className="text-3xl font-bold">
            {role === "writer"
              ? "สร้างผลงานของคุณ"
              : "ค้นพบเรื่องราวที่ดีที่สุด"}
          </h2>
          <p className="text-lg leading-relaxed text-white/80">
            {role === "writer"
              ? "เขียนนิยายของคุณ สร้างรายได้ และเข้าถึงผู้อ่านหลายพันคนบนแพลตฟอร์มอลิน"
              : "อ่านนิยายคุณภาพที่คัดสรรมาเพื่อคุณ พร้อมชุมชนนักอ่านที่อบอุ่น"}
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
