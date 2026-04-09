"use client";

import NovelCard from "@/components/ui/NovelCard";
import { Library, BookOpen, Clock, Heart, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function LibraryPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [tab, setTab] = useState<"reading" | "bookmarks" | "history">(
    "reading"
  );
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [readingHistory, setReadingHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { key: "reading" as const, label: "กำลังอ่าน", icon: BookOpen },
    { key: "bookmarks" as const, label: "ชั้นหนังสือ", icon: Heart },
    { key: "history" as const, label: "ประวัติการอ่าน", icon: Clock },
  ];

  useEffect(() => {
    if (!session?.user) return;

    async function fetchData() {
      setLoading(true);
      try {
        const [bookmarksRes, historyRes] = await Promise.all([
          fetch("/api/bookmarks"),
          fetch("/api/reading-progress"),
        ]);

        const bookmarksData = await bookmarksRes.json();
        const historyData = await historyRes.json();

        setBookmarks(bookmarksData.bookmarks || []);
        setReadingHistory(historyData.history || []);
      } catch (error) {
        console.error("Error fetching library data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [session]);

  if (sessionStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rosegold-dark" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Library className="h-16 w-16 text-rosegold/20" />
        <h2 className="text-xl font-bold text-brand-black">
          กรุณาเข้าสู่ระบบ
        </h2>
        <p className="text-sm text-muted-foreground">
          เข้าสู่ระบบเพื่อดูชั้นหนังสือของคุณ
        </p>
        <Link
          href="/auth/login"
          className="rounded-full bg-rosegold-dark px-6 py-2 text-sm font-medium text-white hover:bg-rosegold"
        >
          เข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  // Transform bookmarks to novel card format
  const bookmarkedNovels = bookmarks.map((b: any) => ({
    id: b.novel?.id || b.novelId,
    title: b.novel?.title || "",
    author: b.novel?.author || "",
    coverImage: b.novel?.coverImage,
    genre: b.novel?.genre || "",
    viewCount: b.novel?.viewCount || 0,
    _count: b.novel?._count,
    status: b.novel?.status || "ONGOING",
  }));

  // Reading history -> novels from progress
  const historyNovels = readingHistory.map((item: any) => ({
    id: item.novelId || item.chapter?.novel?.id,
    title: item.novelTitle || item.chapter?.novel?.title || "",
    author: item.author || item.chapter?.novel?.author || "",
    coverImage: item.coverImage || item.chapter?.novel?.coverImage,
    genre: item.genre || item.chapter?.novel?.genre || "",
    viewCount: item.viewCount || item.chapter?.novel?.viewCount || 0,
    status: item.status || item.chapter?.novel?.status || "ONGOING",
    chapterCount: 0,
  }));

  const novels =
    tab === "reading"
      ? historyNovels
      : tab === "bookmarks"
      ? bookmarkedNovels
      : historyNovels;

  return (
    <div className="min-h-screen bg-cream/20">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-full bg-rosegold/10 p-3">
            <Library className="h-6 w-6 text-rosegold-dark" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-brand-black">
              ชั้นหนังสือของฉัน
            </h1>
            <p className="text-sm text-muted-foreground">
              รวมนิยายที่คุณกำลังอ่านและบันทึกไว้
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-1 rounded-full border border-border bg-white p-1 w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                tab === t.key
                  ? "bg-rosegold-dark text-white"
                  : "text-muted-foreground hover:text-brand-black"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Novels Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-rosegold-dark" />
          </div>
        ) : novels.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-6">
            {novels.map((novel: any, i: number) => (
              <NovelCard key={`${novel.id}-${i}`} {...novel} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="h-16 w-16 text-rosegold/20" />
            <h3 className="mt-4 text-lg font-semibold text-brand-black">
              ยังไม่มีนิยาย
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {tab === "bookmarks"
                ? "เริ่มสำรวจนิยายที่คุณชอบและเพิ่มในชั้นหนังสือ"
                : "เริ่มอ่านนิยายเพื่อบันทึกประวัติการอ่าน"}
            </p>
            <Link
              href="/ranking"
              className="mt-4 rounded-full bg-rosegold-dark px-6 py-2 text-sm font-medium text-white hover:bg-rosegold"
            >
              สำรวจนิยาย
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
