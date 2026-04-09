"use client";

import { cn } from "@/lib/utils";
import { BookOpen, Eye } from "lucide-react";
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
              "rounded-full px-2 py-0.5 text-xs font-medium",
              status === "COMPLETED"
                ? "bg-rosegold-dark text-white"
                : "bg-white/90 text-rosegold-dark"
            )}
          >
            {statusLabel[status] || status}
          </span>
        </div>
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
