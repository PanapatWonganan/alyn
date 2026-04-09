"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import {
  Search,
  Compass,
  Filter,
  BookOpen,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import NovelCard from "@/components/ui/NovelCard";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Genre {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  _count?: { novels: number };
}

interface Novel {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  coverImage?: string | null;
  status: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string; penName?: string | null };
  genre: { id: string; name: string; slug: string };
  _count: { chapters: number; bookmarks: number };
}

function ExploreContent() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Novel[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"popular" | "latest" | "updated">("popular");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [novels, setNovels] = useState<Novel[]>([]);
  const [novelsLoading, setNovelsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Fetch genres on mount
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await fetch("/api/genres");
        const data = await res.json();
        setGenres(data.genres || []);
      } catch (error) {
        console.error("Failed to fetch genres:", error);
      }
    };
    fetchGenres();
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(searchQuery.trim())}&limit=10`
        );
        const data = await res.json();
        setSearchResults(data.novels || []);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Fetch novels based on filters
  const fetchNovels = useCallback(async () => {
    setNovelsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort: sortBy,
      });

      if (selectedGenre) {
        params.append("genre", selectedGenre);
      }

      if (statusFilter !== "ALL") {
        params.append("status", statusFilter);
      }

      const res = await fetch(`/api/novels?${params.toString()}`);
      const data = await res.json();
      setNovels(data.novels || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (error) {
      console.error("Failed to fetch novels:", error);
      setNovels([]);
    } finally {
      setNovelsLoading(false);
    }
  }, [page, sortBy, selectedGenre, statusFilter]);

  // Fetch novels when filters change (reset to page 1 for filter changes)
  useEffect(() => {
    setPage(1);
  }, [sortBy, selectedGenre, statusFilter]);

  useEffect(() => {
    fetchNovels();
  }, [fetchNovels]);

  // Initialize from URL params if present
  useEffect(() => {
    const genreParam = searchParams.get("genre");
    if (genreParam) {
      setSelectedGenre(genreParam);
    }
  }, [searchParams]);

  const handleGenreClick = (genreId: string) => {
    if (selectedGenre === genreId) {
      setSelectedGenre(null);
    } else {
      setSelectedGenre(genreId);
    }
  };

  const handleSearchClick = (novel: Novel) => {
    setSearchQuery("");
    setSearchResults([]);
  };

  // Get genre emoji/icon
  const getGenreIcon = (genre: Genre) => {
    // You can map genre names to Lucide icons or emojis
    const iconMap: Record<string, string> = {
      "โรมานซ์": "💕",
      "แฟนตาซี": "🔮",
      "ดราม่า": "🎭",
      "สยองขวัญ": "👻",
      "ตลก": "😂",
      "ลึกลับ": "🔍",
      "บู๊": "⚔️",
      "วาย": "💙",
      "แนวครอบครัว": "👨‍👩‍👧‍👦",
      "ผจญภัย": "🗺️",
    };
    return iconMap[genre.name] || "📚";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream/30 to-white">
      {/* Hero Section with Search */}
      <section className="bg-gradient-to-br from-rosegold-dark via-rosegold to-rosegold-light py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 flex items-center justify-center gap-2">
            <Compass className="h-12 w-12 text-white" />
            <h1 className="text-4xl font-bold text-white sm:text-5xl">
              สำรวจนิยาย
            </h1>
          </div>
          <p className="mb-8 text-lg text-white/90">
            ค้นพบนิยายใหม่ๆ จากทุกหมวดหมู่ ค้นหาเรื่องโปรดของคุณ
          </p>

          {/* Search Bar */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหานิยาย, นักเขียน, แท็ก..."
                className="w-full rounded-full border-0 bg-white py-4 pl-12 pr-4 text-base shadow-lg placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-white/30"
              />
            </div>

            {/* Search Results Dropdown */}
            {searchQuery.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-border bg-white shadow-xl">
                {searchLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-rosegold-dark" />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="max-h-[400px] overflow-y-auto py-2">
                    {searchResults.map((novel) => {
                      const authorName =
                        novel.author.penName || novel.author.name;
                      return (
                        <Link
                          key={novel.id}
                          href={`/novel/${novel.id}`}
                          onClick={() => handleSearchClick(novel)}
                          className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-cream/50"
                        >
                          <div className="h-14 w-10 shrink-0 overflow-hidden rounded bg-gradient-to-br from-rosegold/20 to-cream">
                            {novel.coverImage ? (
                              <img
                                src={novel.coverImage}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <BookOpen className="h-4 w-4 text-rosegold/30" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-brand-black">
                              {novel.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {authorName} • {novel.genre.name}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    ไม่พบนิยายที่ค้นหา
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Genre Browser */}
        <section className="mb-12">
          <div className="mb-6 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-rosegold-dark" />
            <h2 className="text-2xl font-bold text-brand-black">
              เลือกตามหมวดหมู่
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {genres.map((genre) => (
              <button
                key={genre.id}
                onClick={() => handleGenreClick(genre.id)}
                className={`group relative overflow-hidden rounded-xl border-2 p-4 text-center transition-all hover:scale-105 hover:shadow-lg ${
                  selectedGenre === genre.id
                    ? "border-rosegold-dark bg-rosegold-dark text-white shadow-lg"
                    : "border-border bg-white text-brand-black hover:border-rosegold-light"
                }`}
              >
                <div className="mb-2 text-3xl">{getGenreIcon(genre)}</div>
                <p className="text-sm font-semibold">{genre.name}</p>
                <p
                  className={`mt-1 text-xs ${
                    selectedGenre === genre.id
                      ? "text-white/80"
                      : "text-muted-foreground"
                  }`}
                >
                  {genre._count?.novels || 0} เรื่อง
                </p>
              </button>
            ))}
          </div>

          {selectedGenre && (
            <button
              onClick={() => setSelectedGenre(null)}
              className="mt-4 text-sm font-medium text-rosegold-dark hover:text-rosegold"
            >
              ล้างตัวกรอง ×
            </button>
          )}
        </section>

        {/* Filters Bar */}
        <section className="mb-8">
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-brand-black">
              <Filter className="h-4 w-4" />
              <span>เรียงตาม:</span>
            </div>

            {/* Sort Options */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSortBy("popular")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  sortBy === "popular"
                    ? "bg-rosegold-dark text-white"
                    : "bg-cream text-brand-black hover:bg-cream-dark"
                }`}
              >
                ยอดนิยม
              </button>
              <button
                onClick={() => setSortBy("latest")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  sortBy === "latest"
                    ? "bg-rosegold-dark text-white"
                    : "bg-cream text-brand-black hover:bg-cream-dark"
                }`}
              >
                ใหม่ล่าสุด
              </button>
              <button
                onClick={() => setSortBy("updated")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  sortBy === "updated"
                    ? "bg-rosegold-dark text-white"
                    : "bg-cream text-brand-black hover:bg-cream-dark"
                }`}
              >
                อัปเดตล่าสุด
              </button>
            </div>

            <div className="ml-auto h-6 w-px bg-border" />

            {/* Status Filter */}
            <div className="flex items-center gap-2 text-sm font-medium text-brand-black">
              <span>สถานะ:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  statusFilter === "ALL"
                    ? "bg-rosegold-dark text-white"
                    : "bg-cream text-brand-black hover:bg-cream-dark"
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setStatusFilter("ONGOING")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  statusFilter === "ONGOING"
                    ? "bg-rosegold-dark text-white"
                    : "bg-cream text-brand-black hover:bg-cream-dark"
                }`}
              >
                กำลังเขียน
              </button>
              <button
                onClick={() => setStatusFilter("COMPLETED")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  statusFilter === "COMPLETED"
                    ? "bg-rosegold-dark text-white"
                    : "bg-cream text-brand-black hover:bg-cream-dark"
                }`}
              >
                จบแล้ว
              </button>
            </div>
          </div>
        </section>

        {/* Novel Grid */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              แสดง {novels.length} จาก {total.toLocaleString("th-TH")} เรื่อง
            </p>
          </div>

          {novelsLoading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-rosegold-dark" />
                <p className="mt-4 text-sm text-muted-foreground">
                  กำลังโหลด...
                </p>
              </div>
            </div>
          ) : novels.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4">
                {novels.map((novel) => (
                  <NovelCard
                    key={novel.id}
                    id={novel.id}
                    title={novel.title}
                    author={novel.author}
                    genre={novel.genre}
                    viewCount={novel.viewCount}
                    coverImage={novel.coverImage}
                    status={novel.status}
                    _count={novel._count}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-brand-black transition-colors hover:bg-cream disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                            page === pageNum
                              ? "bg-rosegold-dark text-white"
                              : "bg-white text-brand-black hover:bg-cream"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-brand-black transition-colors hover:bg-cream disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <BookOpen className="mx-auto h-16 w-16 text-muted-foreground/40" />
                <p className="mt-4 text-lg font-medium text-brand-black">
                  ไม่พบนิยายที่ค้นหา
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  ลองปรับเปลี่ยนตัวกรองหรือค้นหาใหม่อีกครั้ง
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-rosegold-dark" />
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
