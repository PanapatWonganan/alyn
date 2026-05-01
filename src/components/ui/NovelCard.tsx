"use client";

import { cn } from "@/lib/utils";
import { BookOpen, Eye, Star, Coins } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface NovelCardProps {
  id: string;
  title: string;
  author: { id: string; name: string; penName?: string | null } | string;
  coverImage?: string | null;
  genre: { id: string; name: string; slug: string } | string;
  viewCount: number;
  chapterCount?: number;
  _count?: { chapters: number; bookmarks: number };
  status: string;
  averageRating?: number;
  reviewCount?: number;
  minCoinPrice?: number;
  rank?: number;
  className?: string;
}

export default function NovelCard({
  id,
  title,
  author,
  coverImage,
  genre,
  viewCount,
  chapterCount,
  _count,
  status,
  averageRating,
  minCoinPrice,
  rank,
  className,
}: NovelCardProps) {
  const statusLabel: Record<string, string> = {
    ONGOING: "กำลังเขียน",
    COMPLETED: "จบแล้ว",
    HIATUS: "พักเรื่อง",
    DRAFT: "แบบร่าง",
  };

  const authorName =
    typeof author === "string"
      ? author
      : author.penName || author.name;

  const genreName =
    typeof genre === "string" ? genre : genre.name;

  const chapters = chapterCount ?? _count?.chapters ?? 0;
  const isPaid = typeof minCoinPrice === "number" && minCoinPrice > 0;
  const showRating = typeof averageRating === "number" && averageRating > 0;

  return (
    <Link href={`/novel/${id}`} className={cn("group block", className)}>
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-cream shadow-sm transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rosegold/20 to-cream">
            <BookOpen className="h-12 w-12 text-rosegold/40" />
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-2 left-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium backdrop-blur-sm ring-1 ring-black/5",
              status === "COMPLETED"
                ? "bg-rosegold-dark text-white"
                : "bg-white/90 text-rosegold-dark"
            )}
          >
            {statusLabel[status] || status}
          </span>
        </div>

        {/* Price badge */}
        <div className="absolute top-2 right-2">
          {isPaid ? (
            <span className="flex items-center gap-1 rounded-full bg-coin/90 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
              <Coins className="h-3 w-3" />
              เริ่ม {minCoinPrice}
            </span>
          ) : (
            <span className="rounded-full bg-green-500/90 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
              ฟรี
            </span>
          )}
        </div>

        {/* Rank overlay */}
        {typeof rank === "number" && (
          <div
            className="absolute bottom-2 left-2 text-5xl font-black text-white leading-none"
            style={{
              textShadow:
                "0 2px 8px rgba(0,0,0,0.6), 0 0 2px rgba(0,0,0,0.8)",
            }}
          >
            #{rank}
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1">
        <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-brand-black group-hover:text-rosegold-dark transition-colors">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground">{authorName}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="rounded-full bg-cream px-2 py-0.5 text-rosegold-dark">
            {genreName}
          </span>
          {showRating && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-coin text-coin" />
              {averageRating!.toFixed(1)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {viewCount.toLocaleString("th-TH")}
          </span>
          <span>{chapters} ตอน</span>
        </div>
      </div>
    </Link>
  );
}
