"use client";

import NovelCard from "@/components/ui/NovelCard";
import { Trophy, TrendingUp, Crown, Medal, Loader2 } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

/* eslint-disable @typescript-eslint/no-explicit-any */

function RankingContent() {
  const searchParams = useSearchParams();
  const initialGenre = searchParams.get("genre") || "all";

  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [genres, setGenres] = useState<any[]>([]);
  const [novels, setNovels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/genres")
      .then((res) => res.json())
      .then((data) => setGenres(data.genres || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    const genreParam =
      selectedGenre !== "all"
        ? genres.find((g: any) => g.slug === selectedGenre)?.id
        : undefined;

    const url = genreParam
      ? `/api/novels?sort=popular&limit=20&genre=${genreParam}`
      : "/api/novels?sort=popular&limit=20";

    const fetchNovels = async () => {
      setLoading(true);
      try {
        const res = await fetch(url);
        const data = await res.json();
        if (!cancelled) {
          setNovels(data.data || []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchNovels();
    return () => { cancelled = true; };
  }, [selectedGenre, genres]);

  const rankedNovels = [...novels].sort(
    (a, b) => b.viewCount - a.viewCount
  );

  return (
    <div className="min-h-screen bg-cream/20">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-full bg-rosegold/10 p-3">
            <Trophy className="h-6 w-6 text-rosegold-dark" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-brand-black">
              อันดับนิยาย
            </h1>
            <p className="text-sm text-muted-foreground">
              จัดอันดับตามยอดวิวสูงสุด
            </p>
          </div>
        </div>

        {/* Genre Filter */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedGenre("all")}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              selectedGenre === "all"
                ? "bg-rosegold-dark text-white"
                : "bg-white text-muted-foreground border border-border hover:border-rosegold"
            }`}
          >
            ทั้งหมด
          </button>
          {genres.map((genre: any) => (
            <button
              key={genre.id}
              onClick={() => setSelectedGenre(genre.slug)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                selectedGenre === genre.slug
                  ? "bg-rosegold-dark text-white"
                  : "bg-white text-muted-foreground border border-border hover:border-rosegold"
              }`}
            >
              {genre.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-rosegold-dark" />
          </div>
        ) : rankedNovels.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            ยังไม่มีนิยายในหมวดนี้
          </div>
        ) : (
          <>
            {/* Top 3 */}
            <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {rankedNovels.slice(0, 3).map((novel: any, index: number) => {
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
                    className={`relative rounded-2xl border p-5 ${
                      index === 0
                        ? "border-yellow-300 bg-gradient-to-br from-yellow-50 to-white"
                        : index === 1
                        ? "border-gray-300 bg-gradient-to-br from-gray-50 to-white"
                        : "border-orange-200 bg-gradient-to-br from-orange-50 to-white"
                    }`}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      {index === 0 ? (
                        <Crown className="h-6 w-6 text-yellow-500" />
                      ) : (
                        <Medal
                          className={`h-6 w-6 ${
                            index === 1 ? "text-gray-400" : "text-orange-400"
                          }`}
                        />
                      )}
                      <span
                        className={`text-2xl font-black ${
                          index === 0
                            ? "text-yellow-500"
                            : index === 1
                            ? "text-gray-400"
                            : "text-orange-400"
                        }`}
                      >
                        #{index + 1}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-brand-black">
                      {novel.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      โดย {authorName}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="rounded-full bg-cream px-2 py-0.5 font-medium text-rosegold-dark">
                        {genreName}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-brand-black">
                        <TrendingUp className="h-3 w-3" />
                        {novel.viewCount.toLocaleString("th-TH")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rest of ranking */}
            {rankedNovels.length > 3 && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
                {rankedNovels.slice(3).map((novel: any) => (
                  <NovelCard key={novel.id} {...novel} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function RankingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-rosegold-dark" />
        </div>
      }
    >
      <RankingContent />
    </Suspense>
  );
}
