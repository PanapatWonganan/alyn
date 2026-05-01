"use client";

import Button from "@/components/ui/Button";
import {
  PenTool,
  Plus,
  BookOpen,
  Eye,
  BarChart3,
  Coins,
  Settings,
  FileText,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function WriteDashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [novels, setNovels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const userRole = (session?.user as unknown as Record<string, unknown>)
    ?.role as string | undefined;

  useEffect(() => {
    if (!session?.user) return;

    async function fetchMyNovels() {
      try {
        const res = await fetch(
          `/api/novels?authorId=${session!.user!.id}&limit=50`
        );
        const data = await res.json();
        setNovels(data.data || []);
      } catch (error) {
        console.error("Error fetching novels:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMyNovels();
  }, [session]);

  const statusLabel: Record<string, string> = {
    ONGOING: "กำลังเขียน",
    COMPLETED: "จบแล้ว",
    HIATUS: "พักเรื่อง",
    DRAFT: "แบบร่าง",
  };

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rosegold-dark" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <PenTool className="h-16 w-16 text-rosegold/20" />
        <h2 className="text-xl font-bold text-brand-black">
          กรุณาเข้าสู่ระบบ
        </h2>
        <Link
          href="/auth/login"
          className="rounded-full bg-rosegold-dark px-6 py-2 text-sm font-medium text-white hover:bg-rosegold"
        >
          เข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  // Calculate stats from real data
  const totalViews = novels.reduce((sum, n) => sum + (n.viewCount || 0), 0);
  const totalChapters = novels.reduce(
    (sum, n) => sum + (n._count?.chapters || 0),
    0
  );

  return (
    <div className="min-h-screen bg-cream/20">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-black">
              โต๊ะเขียนของฉัน
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              จัดการนิยายและติดตามสถิติของคุณ
            </p>
          </div>
          {(userRole === "WRITER" || userRole === "ADMIN") && (
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/write/analytics">
                <Button variant="outline">
                  <BarChart3 className="h-5 w-5" />
                  ดูสถิติ
                </Button>
              </Link>
              <Link href="/write/new">
                <Button>
                  <Plus className="h-5 w-5" />
                  สร้างนิยายใหม่
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Stats Overview */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            {
              label: "นิยายทั้งหมด",
              value: novels.length.toLocaleString("th-TH"),
              icon: BookOpen,
              color: "text-rosegold-dark",
              bg: "bg-rosegold/10",
            },
            {
              label: "ยอดวิวรวม",
              value: totalViews.toLocaleString("th-TH"),
              icon: Eye,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              label: "บทที่เผยแพร่",
              value: totalChapters.toLocaleString("th-TH"),
              icon: FileText,
              color: "text-green-600",
              bg: "bg-green-50",
            },
            {
              label: "รายได้ (เหรียญ)",
              value: "-",
              icon: Coins,
              color: "text-coin",
              bg: "bg-coin-light",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-white p-4 sm:p-5"
            >
              <div
                className={`mb-3 inline-flex rounded-full ${stat.bg} p-2`}
              >
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-brand-black">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Novels List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-brand-black">นิยายของฉัน</h2>

          {novels.length === 0 ? (
            <div className="rounded-xl border border-border bg-white py-16 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-rosegold/20" />
              <h3 className="mt-4 font-semibold text-brand-black">
                ยังไม่มีนิยาย
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {userRole === "READER"
                  ? "อัปเกรดเป็นนักเขียนเพื่อเริ่มสร้างนิยาย"
                  : "เริ่มสร้างนิยายเรื่องแรกของคุณ"}
              </p>
            </div>
          ) : (
            novels.map((novel: any) => {
              const authorName =
                typeof novel.author === "object"
                  ? novel.author.penName || novel.author.name
                  : novel.author;
              const genreName =
                typeof novel.genre === "object"
                  ? novel.genre.name
                  : novel.genre;

              return (
                <div
                  key={novel.id}
                  className="flex flex-col gap-4 rounded-xl border border-border bg-white p-5 transition-all hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-4">
                    {/* Cover thumbnail */}
                    <div className="h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-rosegold/20 to-cream">
                      {novel.coverImage ? (
                        <img
                          src={novel.coverImage}
                          alt={novel.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <BookOpen className="h-6 w-6 text-rosegold/30" />
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold text-brand-black">
                        {novel.title}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="rounded-full bg-cream px-2 py-0.5 font-medium text-rosegold-dark">
                          {genreName}
                        </span>
                        <span>{statusLabel[novel.status]}</span>
                        <span>&middot;</span>
                        <span>{novel._count?.chapters ?? 0} ตอน</span>
                        <span>&middot;</span>
                        <span>
                          {novel.viewCount.toLocaleString("th-TH")} วิว
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-1">
                        {novel.synopsis}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Link href={`/write/${novel.id}/editor`}>
                      <Button variant="outline" size="sm">
                        <PenTool className="h-4 w-4" />
                        เขียนต่อ
                      </Button>
                    </Link>
                    <Link href={`/write/${novel.id}/settings`}>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                        ตั้งค่า
                      </Button>
                    </Link>
                    <Link href={`/novel/${novel.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                        ดู
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
