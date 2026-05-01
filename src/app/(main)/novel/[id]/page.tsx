"use client";

import Button from "@/components/ui/Button";
import { formatRelativeTime } from "@/lib/utils";
import {
  BookOpen,
  Eye,
  Clock,
  Bookmark,
  Share2,
  Coins,
  Lock,
  ChevronRight,
  User,
  Loader2,
  Star,
} from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import DonationButton from "@/components/donations/DonationButton";
import AgeGateModal from "@/components/safety/AgeGateModal";
import ReviewSection from "@/components/reviews/ReviewSection";
import ReportButton from "@/components/safety/ReportButton";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function NovelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session } = useSession();
  const [novel, setNovel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  useEffect(() => {
    async function fetchNovel() {
      try {
        const res = await fetch(`/api/novels/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setNovel(data.novel);

        // Check if user has bookmarked this novel
        if (session?.user) {
          try {
            const bookmarkRes = await fetch(`/api/bookmarks?novelId=${id}`);
            if (bookmarkRes.ok) {
              const bookmarkData = await bookmarkRes.json();
              setBookmarked(bookmarkData.bookmarked || false);
            }
          } catch (error) {
            console.error("Error checking bookmark status:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching novel:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchNovel();
  }, [id, session?.user]);

  const handleBookmark = async () => {
    if (!session?.user) {
      window.location.href = "/auth/login";
      return;
    }
    setBookmarkLoading(true);
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ novelId: id }),
      });
      if (res.ok) {
        const data = await res.json();
        setBookmarked(data.bookmarked);
      }
    } catch (error) {
      console.error("Bookmark error:", error);
    } finally {
      setBookmarkLoading(false);
    }
  };

  const statusLabel: Record<string, string> = {
    ONGOING: "กำลังเขียน",
    COMPLETED: "จบแล้ว",
    HIATUS: "พักเรื่อง",
    DRAFT: "แบบร่าง",
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rosegold-dark" />
      </div>
    );
  }

  if (!novel) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <BookOpen className="h-16 w-16 text-rosegold/20" />
        <h2 className="text-xl font-bold text-brand-black">ไม่พบนิยาย</h2>
        <Link href="/" className="text-sm text-rosegold-dark hover:underline">
          กลับหน้าแรก
        </Link>
      </div>
    );
  }

  const authorName = novel.author?.penName || novel.author?.name || "";
  const genreName =
    typeof novel.genre === "object" ? novel.genre.name : novel.genre;
  const chapters = novel.chapters || [];
  const firstChapter = chapters[0];

  return (
    <div className="min-h-screen bg-white">
      <AgeGateModal isAdult={Boolean(novel.isAdult)} />
      {/* Novel Header */}
      <section className="bg-gradient-to-b from-cream to-white">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <div className="flex flex-col gap-8 sm:flex-row">
            {/* Cover */}
            <div className="shrink-0">
              <div className="mx-auto aspect-[3/4] w-48 overflow-hidden rounded-xl bg-gradient-to-br from-rosegold/20 to-cream shadow-lg sm:w-56">
                {novel.coverImage ? (
                  <img
                    src={novel.coverImage}
                    alt={novel.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <BookOpen className="h-16 w-16 text-rosegold/30" />
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-rosegold/10 px-3 py-1 text-sm font-medium text-rosegold-dark">
                  {genreName}
                </span>
                <span className="rounded-full bg-cream px-3 py-1 text-sm font-medium text-brand-black/60">
                  {statusLabel[novel.status]}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-brand-black sm:text-3xl">
                {novel.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/user/${novel.author?.id}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-rosegold-dark hover:underline"
                >
                  <User className="h-4 w-4" />
                  {authorName}
                </Link>
                {session?.user?.id && session.user.id !== novel.author?.id && (
                  <DonationButton
                    receiverId={novel.author?.id}
                    receiverName={authorName}
                  />
                )}
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                {novel.synopsis}
              </p>

              {/* Tags */}
              {novel.tags && novel.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {novel.tags.map((tag: any) => (
                    <span
                      key={tag.id}
                      className="rounded-full bg-cream px-2.5 py-0.5 text-xs font-medium text-brand-black/60"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-coin text-coin" />
                  <span className="font-semibold text-brand-black">
                    {(novel.averageRating || 0).toFixed(1)}
                  </span>
                  <span className="text-xs">
                    ({(novel.reviewCount || 0).toLocaleString("th-TH")})
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {novel.viewCount.toLocaleString("th-TH")} วิว
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {chapters.length} ตอน
                </span>
                <span className="flex items-center gap-1">
                  <Bookmark className="h-4 w-4" />
                  {novel._count?.bookmarks ?? 0} คนบันทึก
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  อัปเดต {formatRelativeTime(novel.updatedAt)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-2">
                {firstChapter && (
                  <Link href={`/novel/${id}/chapter/${firstChapter.id}`}>
                    <Button size="lg">
                      <BookOpen className="h-5 w-5" />
                      เริ่มอ่าน
                    </Button>
                  </Link>
                )}
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleBookmark}
                  disabled={bookmarkLoading}
                  className={bookmarked ? "border-rosegold text-rosegold-dark" : ""}
                >
                  <Bookmark className={`h-5 w-5 ${bookmarked ? "fill-current" : ""}`} />
                  {bookmarked ? "บันทึกแล้ว" : "เพิ่มในชั้นหนังสือ"}
                </Button>
                <Button variant="ghost" size="lg">
                  <Share2 className="h-5 w-5" />
                </Button>
                <ReportButton
                  targetType="NOVEL"
                  targetId={novel.id}
                  variant="button"
                  label="รายงาน"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter List */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-brand-black">
              สารบัญ ({chapters.length} ตอน)
            </h2>
          </div>

          {chapters.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              ยังไม่มีตอนที่เผยแพร่
            </div>
          ) : (
            <div className="space-y-2">
              {chapters.map((chapter: any) => (
                <Link
                  key={chapter.id}
                  href={`/novel/${id}/chapter/${chapter.id}`}
                  className="group flex items-center justify-between rounded-xl border border-border p-4 transition-all hover:border-rosegold/30 hover:bg-cream/50"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream text-sm font-bold text-rosegold-dark">
                      {chapter.number}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-brand-black group-hover:text-rosegold-dark transition-colors">
                        {chapter.title}
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {chapter.wordCount.toLocaleString("th-TH")} ตัวอักษร
                        &middot;{" "}
                        {chapter.publishedAt
                          ? formatRelativeTime(chapter.publishedAt)
                          : formatRelativeTime(chapter.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {!chapter.isFree && (
                      <span className="flex items-center gap-1 rounded-full bg-coin-light px-2.5 py-1 text-xs font-semibold text-coin">
                        <Coins className="h-3 w-3" />
                        {chapter.coinPrice}
                      </span>
                    )}
                    {chapter.isFree ? (
                      <span className="text-xs font-medium text-green-600">
                        ฟรี
                      </span>
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-rosegold-dark transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Reviews */}
      <ReviewSection novelId={id} authorId={novel.author?.id} />

      {/* Structured data: Book schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Book",
            name: novel.title,
            description: novel.synopsis,
            image: novel.coverImage || undefined,
            genre: genreName,
            author: {
              "@type": "Person",
              name: authorName,
            },
            aggregateRating:
              (novel.reviewCount || 0) > 0
                ? {
                    "@type": "AggregateRating",
                    ratingValue: Number(
                      (novel.averageRating || 0).toFixed(1)
                    ),
                    reviewCount: novel.reviewCount,
                    bestRating: 5,
                    worstRating: 1,
                  }
                : undefined,
          }),
        }}
      />
    </div>
  );
}
