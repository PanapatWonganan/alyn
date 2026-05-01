"use client";

import NovelCard from "@/components/ui/NovelCard";
import Button from "@/components/ui/Button";
import {
  Heart,
  Sparkles,
  Drama,
  Search,
  Skull,
  Scroll,
  BookOpen,
  BookCheck,
  TrendingUp,
  Star,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

const genreIcons: Record<string, React.ReactNode> = {
  heart: <Heart className="h-5 w-5" />,
  sparkles: <Sparkles className="h-5 w-5" />,
  theater: <Drama className="h-5 w-5" />,
  search: <Search className="h-5 w-5" />,
  skull: <Skull className="h-5 w-5" />,
  "heart-handshake": <Heart className="h-5 w-5" />,
  flower: <Sparkles className="h-5 w-5" />,
  rocket: <Star className="h-5 w-5" />,
  sun: <Sparkles className="h-5 w-5" />,
  scroll: <Scroll className="h-5 w-5" />,
};

export default function HomePage() {
  const [genres, setGenres] = useState<any[]>([]);
  const [trendingNovels, setTrendingNovels] = useState<any[]>([]);
  const [latestNovels, setLatestNovels] = useState<any[]>([]);
  const [completedNovels, setCompletedNovels] = useState<any[]>([]);
  const [featuredNovel, setFeaturedNovel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [genresRes, trendingRes, latestRes, completedRes, featuredRes] =
          await Promise.all([
            fetch("/api/genres"),
            fetch("/api/novels?sort=popular&limit=8"),
            fetch("/api/novels?sort=latest&limit=8"),
            fetch("/api/novels?status=COMPLETED&sort=popular&limit=8"),
            fetch("/api/novels?featured=true&limit=1"),
          ]);

        const genresData = await genresRes.json();
        const trendingData = await trendingRes.json();
        const latestData = await latestRes.json();
        const completedData = await completedRes.json();
        const featuredData = await featuredRes.json();

        setGenres(genresData.genres || []);
        setTrendingNovels(trendingData.novels || trendingData.data || []);
        setLatestNovels(latestData.novels || latestData.data || []);
        setCompletedNovels(completedData.novels || completedData.data || []);

        // Featured = admin-featured novel if exists, otherwise most viewed
        const featuredList =
          featuredData.novels || featuredData.data || [];
        const trending = trendingData.novels || trendingData.data || [];
        if (featuredList.length > 0) {
          setFeaturedNovel(featuredList[0]);
        } else if (trending.length > 0) {
          setFeaturedNovel(trending[0]);
        }
      } catch (error) {
        console.error("Error fetching homepage data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rosegold-dark" />
      </div>
    );
  }

  const featuredAuthor =
    featuredNovel?.author?.penName || featuredNovel?.author?.name || "";
  const featuredGenre =
    typeof featuredNovel?.genre === "object"
      ? featuredNovel.genre.name
      : featuredNovel?.genre || "";

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cream via-white to-cream">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 h-72 w-72 rounded-full bg-rosegold blur-3xl" />
          <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-rosegold-dark blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-rosegold/10 px-4 py-1.5 text-sm font-medium text-rosegold-dark">
                <Sparkles className="h-4 w-4" />
                แพลตฟอร์มนิยายคุณภาพ
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-brand-black sm:text-5xl lg:text-6xl">
                พื้นที่แห่งปัญญา
                <br />
                <span className="text-rosegold-dark">และความสุขจากการอ่าน</span>
              </h1>
              <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
                อลิน คัดสรรนิยายคุณภาพหลากหลายแนว
                ให้คุณดื่มด่ำกับเรื่องราวที่ดีที่สุด
                พร้อมชุมชนนักอ่านนักเขียนที่อบอุ่น
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/ranking">
                  <Button size="lg">
                    <BookOpen className="h-5 w-5" />
                    เริ่มอ่านเลย
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="outline" size="lg">
                    เขียนนิยายของคุณ
                  </Button>
                </Link>
              </div>
            </div>

            {/* Featured novel card */}
            {featuredNovel && (
              <div className="relative">
                <Link href={`/novel/${featuredNovel.id}`}>
                  <div className="mx-auto max-w-sm rounded-2xl bg-background p-6 shadow-xl shadow-rosegold/5 transition-transform hover:scale-[1.02]">
                    <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-rosegold-dark">
                      <Star className="h-4 w-4 fill-rosegold" />
                      แนะนำวันนี้
                    </div>
                    <div className="aspect-[3/4] overflow-hidden rounded-xl bg-gradient-to-br from-rosegold/20 to-cream">
                      {featuredNovel.coverImage ? (
                        <img
                          src={featuredNovel.coverImage}
                          alt={featuredNovel.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <BookOpen className="h-20 w-20 text-rosegold/30" />
                        </div>
                      )}
                    </div>
                    <div className="mt-4 space-y-2">
                      <h3 className="text-lg font-bold text-brand-black">
                        {featuredNovel.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        โดย {featuredAuthor}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {featuredNovel.synopsis}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="rounded-full bg-cream px-2 py-0.5 font-medium text-rosegold-dark">
                          {featuredGenre}
                        </span>
                        <span>
                          {featuredNovel.viewCount.toLocaleString("th-TH")} วิว
                        </span>
                        <span>
                          {featuredNovel._count?.chapters ?? 0} ตอน
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Genre Section */}
      <section className="sticky top-[104px] z-30 border-y border-border bg-background py-8 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {genres.map((genre: any) => (
              <Link
                key={genre.id}
                href={`/ranking?genre=${genre.slug}`}
                className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-brand-black/70 transition-all hover:border-rosegold hover:bg-cream hover:text-rosegold-dark"
              >
                {genreIcons[genre.icon || ""] || (
                  <BookOpen className="h-4 w-4" />
                )}
                {genre.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Section */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-rosegold/10 p-2">
                <TrendingUp className="h-5 w-5 text-rosegold-dark" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-brand-black sm:text-2xl">
                  กำลังมาแรง
                </h2>
                <p className="text-sm text-muted-foreground">
                  นิยายยอดนิยมที่ทุกคนกำลังอ่าน
                </p>
              </div>
            </div>
            <Link
              href="/ranking"
              className="flex items-center gap-1 text-sm font-medium text-rosegold-dark hover:underline"
            >
              ดูทั้งหมด
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
            {trendingNovels.map((novel: any, index: number) => (
              <NovelCard key={novel.id} rank={index + 1} {...novel} />
            ))}
          </div>

          {trendingNovels.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              ยังไม่มีนิยาย เริ่มสร้างเรื่องราวแรกของคุณ!
            </div>
          )}
        </div>
      </section>

      {/* Latest Section */}
      <section className="bg-cream/30 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-rosegold/10 p-2">
                <Sparkles className="h-5 w-5 text-rosegold-dark" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-brand-black sm:text-2xl">
                  อัปเดตล่าสุด
                </h2>
                <p className="text-sm text-muted-foreground">
                  นิยายที่เพิ่งอัปเดตตอนใหม่
                </p>
              </div>
            </div>
            <Link
              href="/ranking"
              className="flex items-center gap-1 text-sm font-medium text-rosegold-dark hover:underline"
            >
              ดูทั้งหมด
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
            {latestNovels.map((novel: any) => (
              <NovelCard key={novel.id} {...novel} />
            ))}
          </div>

          {latestNovels.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              ยังไม่มีนิยาย เริ่มสร้างเรื่องราวแรกของคุณ!
            </div>
          )}
        </div>
      </section>

      {/* Completed Section */}
      {completedNovels.length > 0 && (
        <section className="bg-background py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-rosegold/10 p-2">
                  <BookCheck className="h-5 w-5 text-rosegold-dark" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-brand-black sm:text-2xl">
                    นิยายจบแล้ว
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    เรื่องราวที่เดินทางมาถึงปลายทางแล้ว
                  </p>
                </div>
              </div>
              <Link
                href="/ranking?status=COMPLETED"
                className="flex items-center gap-1 text-sm font-medium text-rosegold-dark hover:underline"
              >
                ดูทั้งหมด
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
              {completedNovels.map((novel: any) => (
                <NovelCard key={novel.id} {...novel} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-rosegold-dark to-rosegold py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            พร้อมเริ่มเขียนนิยายของคุณหรือยัง?
          </h2>
          <p className="mt-3 text-lg text-white/80">
            เข้าร่วมชุมชนนักเขียนอลิน สร้างรายได้จากงานเขียน
            และเข้าถึงผู้อ่านหลายพันคน
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/auth/register">
              <Button
                variant="secondary"
                size="lg"
                className="bg-white text-rosegold-dark hover:bg-cream"
              >
                สมัครเป็นนักเขียน
              </Button>
            </Link>
            <Link href="/ranking">
              <Button
                variant="ghost"
                size="lg"
                className="text-white hover:bg-white/10"
              >
                สำรวจนิยาย
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
