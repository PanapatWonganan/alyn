"use client";

import Button from "@/components/ui/Button";
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  BookOpen,
  Type,
  Sun,
  Moon,
  Coffee,
  Minus,
  Plus,
  Loader2,
  Lock,
  Coins,
} from "lucide-react";
import Link from "next/link";
import { useState, use, useEffect } from "react";
import { useSession } from "next-auth/react";
import CommentSection from "@/components/comments/CommentSection";
import AgeGateModal from "@/components/safety/AgeGateModal";
import DOMPurify from "dompurify";

/* eslint-disable @typescript-eslint/no-explicit-any */

type ReaderTheme = "default" | "sepia" | "night" | "dark";

export default function ReaderPage({
  params,
}: {
  params: Promise<{ id: string; chapterId: string }>;
}) {
  const { id, chapterId } = use(params);
  const { data: session } = useSession();
  const [chapter, setChapter] = useState<any>(null);
  const [prevChapter, setPrevChapter] = useState<any>(null);
  const [nextChapter, setNextChapter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<ReaderTheme>("default");
  const [fontSize, setFontSize] = useState(18);

  useEffect(() => {
    async function fetchChapter() {
      try {
        const res = await fetch(`/api/novels/${id}/chapters/${chapterId}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setChapter(data.chapter);
        setPrevChapter(data.prevChapter);
        setNextChapter(data.nextChapter);

        // Save reading progress
        if (session?.user) {
          fetch("/api/reading-progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chapterId }),
          }).catch(() => {});
        }
      } catch (error) {
        console.error("Error fetching chapter:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchChapter();
  }, [id, chapterId, session]);

  const handlePurchase = async () => {
    if (!session?.user) {
      window.location.href = "/auth/login";
      return;
    }
    setPurchaseLoading(true);
    try {
      const res = await fetch("/api/coins/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId }),
      });
      if (res.ok) {
        // Re-fetch chapter to get content
        const chapterRes = await fetch(`/api/novels/${id}/chapters/${chapterId}`);
        const data = await chapterRes.json();
        setChapter(data.chapter);
      } else {
        const err = await res.json();
        alert(err.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Purchase error:", error);
    } finally {
      setPurchaseLoading(false);
    }
  };

  const themeOptions: { value: ReaderTheme; label: string; icon: React.ReactNode }[] = [
    { value: "default", label: "ปกติ", icon: <Sun className="h-4 w-4" /> },
    { value: "sepia", label: "ซีเปีย", icon: <Coffee className="h-4 w-4" /> },
    { value: "night", label: "กลางคืน", icon: <Moon className="h-4 w-4" /> },
    { value: "dark", label: "มืด", icon: <Moon className="h-4 w-4" /> },
  ];

  const themeStyles: Record<ReaderTheme, { bg: string; text: string }> = {
    default: { bg: "bg-white", text: "text-brand-black" },
    sepia: { bg: "bg-[#F4ECD8]", text: "text-[#5B4636]" },
    night: { bg: "bg-[#1A1A2E]", text: "text-[#C8C8D0]" },
    dark: { bg: "bg-[#121212]", text: "text-[#B0B0B0]" },
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rosegold-dark" />
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <BookOpen className="h-16 w-16 text-rosegold/20" />
        <h2 className="text-xl font-bold text-brand-black">ไม่พบตอนนี้</h2>
        <Link
          href={`/novel/${id}`}
          className="text-sm text-rosegold-dark hover:underline"
        >
          กลับหน้านิยาย
        </Link>
      </div>
    );
  }

  const novelTitle = chapter.novel?.title || "";
  const novelIsAdult = Boolean(chapter.novel?.isAdult);

  // Locked chapter — need to purchase
  if (chapter.locked) {
    return (
      <div className={`min-h-screen ${themeStyles[theme].bg}`}>
        <AgeGateModal isAdult={novelIsAdult} />
        <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-sm">
          <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
            <Link
              href={`/novel/${id}`}
              className="flex items-center gap-2 text-sm font-medium text-brand-black/70 hover:text-brand-black"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="hidden sm:inline">{novelTitle}</span>
            </Link>
            <span className="text-sm font-medium text-brand-black">
              {chapter.title}
            </span>
            <div />
          </div>
        </header>

        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <Lock className="h-16 w-16 text-rosegold/30" />
          <h2 className="mt-4 text-xl font-bold text-brand-black">
            ตอนนี้ต้องใช้เหรียญ
          </h2>
          <p className="mt-2 text-muted-foreground">
            ตอนนี้มีราคา {chapter.coinPrice} เหรียญ
          </p>
          <Button
            size="lg"
            className="mt-6"
            onClick={handlePurchase}
            disabled={purchaseLoading}
          >
            {purchaseLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Coins className="h-5 w-5" />
            )}
            ซื้อตอนนี้ ({chapter.coinPrice} เหรียญ)
          </Button>
          {!session?.user && (
            <p className="mt-3 text-sm text-muted-foreground">
              <Link href="/auth/login" className="text-rosegold-dark hover:underline">
                เข้าสู่ระบบ
              </Link>{" "}
              เพื่อซื้อตอนนี้
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeStyles[theme].bg} transition-colors duration-300`}>
      <AgeGateModal isAdult={novelIsAdult} />
      {/* Reader Header */}
      <header
        className={`sticky top-0 z-50 border-b ${
          theme === "default"
            ? "border-border bg-white/95"
            : theme === "sepia"
            ? "border-[#D4C4A8] bg-[#F4ECD8]/95"
            : "border-gray-800 bg-[#1A1A2E]/95"
        } backdrop-blur-sm`}
      >
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link
            href={`/novel/${id}`}
            className={`flex items-center gap-2 text-sm font-medium ${themeStyles[theme].text} opacity-70 hover:opacity-100 transition-opacity`}
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="hidden sm:inline">{novelTitle}</span>
          </Link>
          <span className={`text-sm font-medium ${themeStyles[theme].text}`}>
            {chapter.title}
          </span>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`rounded-full p-2 ${themeStyles[theme].text} opacity-70 hover:opacity-100 transition-opacity`}
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div
          className={`sticky top-14 z-40 border-b ${
            theme === "default"
              ? "border-border bg-white"
              : theme === "sepia"
              ? "border-[#D4C4A8] bg-[#F4ECD8]"
              : "border-gray-800 bg-[#1A1A2E]"
          }`}
        >
          <div className="mx-auto max-w-3xl p-4 space-y-4">
            {/* Font Size */}
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${themeStyles[theme].text}`}>
                <Type className="inline h-4 w-4 mr-1" />
                ขนาดตัวอักษร
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                  className={`rounded-full p-1.5 ${themeStyles[theme].text} opacity-70 hover:opacity-100 border border-current/20`}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className={`text-sm font-medium ${themeStyles[theme].text} w-8 text-center`}>
                  {fontSize}
                </span>
                <button
                  onClick={() => setFontSize(Math.min(28, fontSize + 2))}
                  className={`rounded-full p-1.5 ${themeStyles[theme].text} opacity-70 hover:opacity-100 border border-current/20`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Theme */}
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${themeStyles[theme].text}`}>
                ธีมการอ่าน
              </span>
              <div className="flex gap-2">
                {themeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      theme === opt.value
                        ? "bg-rosegold text-white"
                        : `${themeStyles[theme].text} opacity-60 hover:opacity-100 border border-current/20`
                    }`}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div
          className={`prose max-w-none ${themeStyles[theme].text} leading-loose`}
          style={{ fontSize: `${fontSize}px`, lineHeight: "2" }}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(chapter.content) }}
        />

        {/* Comment Section */}
        <CommentSection chapterId={chapterId} theme={theme} />
      </article>

      {/* Navigation Footer */}
      <footer
        className={`sticky bottom-0 border-t ${
          theme === "default"
            ? "border-border bg-white/95"
            : theme === "sepia"
            ? "border-[#D4C4A8] bg-[#F4ECD8]/95"
            : "border-gray-800 bg-[#1A1A2E]/95"
        } backdrop-blur-sm`}
      >
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          {prevChapter ? (
            <Link
              href={`/novel/${id}/chapter/${prevChapter.id}`}
              className={`flex items-center gap-1 text-sm font-medium ${themeStyles[theme].text} opacity-70 hover:opacity-100`}
            >
              <ChevronLeft className="h-5 w-5" />
              ตอนก่อนหน้า
            </Link>
          ) : (
            <div />
          )}

          <Link
            href={`/novel/${id}`}
            className={`flex items-center gap-1 text-sm ${themeStyles[theme].text} opacity-60 hover:opacity-100`}
          >
            <BookOpen className="h-4 w-4" />
            สารบัญ
          </Link>

          {nextChapter ? (
            <Link
              href={`/novel/${id}/chapter/${nextChapter.id}`}
              className={`flex items-center gap-1 text-sm font-medium ${themeStyles[theme].text} opacity-70 hover:opacity-100`}
            >
              ตอนถัดไป
              <ChevronRight className="h-5 w-5" />
            </Link>
          ) : (
            <span className={`text-sm ${themeStyles[theme].text} opacity-40`}>
              ตอนสุดท้าย
            </span>
          )}
        </div>
      </footer>
    </div>
  );
}
