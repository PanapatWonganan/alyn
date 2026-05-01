"use client";

import { formatDate } from "@/lib/utils";
import {
  TrendingUp,
  Eye,
  Coins,
  BookOpen,
  Bookmark,
  ShoppingCart,
  ArrowLeft,
  Loader2,
  Banknote,
  BarChart3,
  Gift,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface NovelPerf {
  id: string;
  title: string;
  status: string;
  coverImage: string | null;
  viewCount: number;
  chapterCount: number;
  bookmarkCount: number;
  purchaseCount: number;
  purchaseCoin: number;
  earningCoin: number;
}

interface AnalyticsData {
  totals: {
    totalViews: number;
    totalBookmarks: number;
    totalChapters: number;
    totalNovels: number;
    totalPurchaseCount: number;
    totalPurchaseCoin: number;
    totalEarningCoin: number;
    totalEarningThb: number;
    totalDonationCoin: number;
  };
  novels: NovelPerf[];
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    description: string;
    createdAt: string;
  }>;
}

const statusLabel: Record<string, string> = {
  ONGOING: "กำลังเขียน",
  COMPLETED: "จบแล้ว",
  HIATUS: "พักเรื่อง",
  DRAFT: "แบบร่าง",
};

const typeLabel: Record<string, string> = {
  EARNING: "รายได้จากการซื้อตอน",
  DONATION_RECEIVED: "ของขวัญจากผู้อ่าน",
};

export default function WriterAnalyticsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    async function load() {
      try {
        const res = await fetch("/api/writer/analytics");
        if (!res.ok) {
          const err = await res.json();
          setError(err.error || "เกิดข้อผิดพลาด");
          return;
        }
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [session]);

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
        <BarChart3 className="h-16 w-16 text-rosegold/20" />
        <h2 className="text-xl font-bold text-brand-black">กรุณาเข้าสู่ระบบ</h2>
        <Link
          href="/auth/login"
          className="rounded-full bg-rosegold-dark px-6 py-2 text-sm font-medium text-white hover:bg-rosegold"
        >
          เข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <BarChart3 className="h-16 w-16 text-rosegold/20" />
        <p className="text-brand-black">{error ?? "ไม่พบข้อมูล"}</p>
        <Link
          href="/write"
          className="rounded-full bg-rosegold-dark px-6 py-2 text-sm font-medium text-white hover:bg-rosegold"
        >
          กลับไปหน้าโต๊ะเขียน
        </Link>
      </div>
    );
  }

  const { totals, novels, recentTransactions } = data;

  // For chart bars, scale relative to max view count
  const maxViews = Math.max(1, ...novels.map((n) => n.viewCount));
  const maxEarnings = Math.max(1, ...novels.map((n) => n.earningCoin));

  const cards = [
    {
      label: "รายได้สะสม (เหรียญ)",
      value: totals.totalEarningCoin.toLocaleString("th-TH"),
      sub: `ประมาณ ${totals.totalEarningThb.toLocaleString("th-TH")} บาท`,
      icon: Coins,
      color: "text-coin",
      bg: "bg-coin-light",
    },
    {
      label: "ยอดวิวรวม",
      value: totals.totalViews.toLocaleString("th-TH"),
      sub: `${totals.totalNovels} นิยาย`,
      icon: Eye,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "การซื้อตอนรวม",
      value: totals.totalPurchaseCount.toLocaleString("th-TH"),
      sub: `${totals.totalPurchaseCoin.toLocaleString("th-TH")} เหรียญ`,
      icon: ShoppingCart,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "ผู้ติดตาม (บุ๊กมาร์ก)",
      value: totals.totalBookmarks.toLocaleString("th-TH"),
      sub: `${totals.totalChapters} ตอนทั้งหมด`,
      icon: Bookmark,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="min-h-screen bg-cream/20">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/write"
              className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-rosegold-dark"
            >
              <ArrowLeft className="h-3 w-3" /> กลับไปโต๊ะเขียน
            </Link>
            <h1 className="text-2xl font-bold text-brand-black">
              สถิตินักเขียน
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              ภาพรวมผลงานและรายได้ของคุณ
            </p>
          </div>
          <Link
            href="/write/withdraw"
            className="inline-flex items-center gap-2 rounded-full bg-rosegold-dark px-4 py-2 text-sm font-medium text-white hover:bg-rosegold"
          >
            <Banknote className="h-4 w-4" /> ถอนเงิน
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {cards.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-white p-4 sm:p-5"
            >
              <div className={`mb-3 inline-flex rounded-full ${stat.bg} p-2`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-brand-black">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-[11px] text-muted-foreground/80">
                {stat.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Donations summary */}
        {totals.totalDonationCoin > 0 && (
          <div className="mb-8 flex items-center gap-3 rounded-xl border border-rosegold/20 bg-rosegold/5 p-4">
            <Gift className="h-5 w-5 text-rosegold-dark" />
            <p className="text-sm text-brand-black">
              ได้รับของขวัญจากผู้อ่านรวม{" "}
              <span className="font-bold text-rosegold-dark">
                {totals.totalDonationCoin.toLocaleString("th-TH")}
              </span>{" "}
              เหรียญ
            </p>
          </div>
        )}

        {/* View chart (CSS bars) */}
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-brand-black">
            <TrendingUp className="h-5 w-5 text-rosegold-dark" />
            ยอดวิวต่อเรื่อง
          </h2>
          <div className="rounded-xl border border-border bg-white p-5">
            {novels.length === 0 ? (
              <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูล</p>
            ) : (
              <div className="space-y-3">
                {novels.map((n) => {
                  const pct = Math.round((n.viewCount / maxViews) * 100);
                  return (
                    <div key={n.id}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="truncate font-medium text-brand-black">
                          {n.title}
                        </span>
                        <span className="text-muted-foreground">
                          {n.viewCount.toLocaleString("th-TH")} วิว
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-cream">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-rosegold to-rosegold-dark"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Earnings chart */}
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-brand-black">
            <Coins className="h-5 w-5 text-coin" />
            รายได้ต่อเรื่อง (70% ส่วนแบ่งนักเขียน)
          </h2>
          <div className="rounded-xl border border-border bg-white p-5">
            {novels.length === 0 ? (
              <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูล</p>
            ) : (
              <div className="space-y-3">
                {novels.map((n) => {
                  const pct = Math.round((n.earningCoin / maxEarnings) * 100);
                  return (
                    <div key={n.id}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="truncate font-medium text-brand-black">
                          {n.title}
                        </span>
                        <span className="font-semibold text-coin">
                          {n.earningCoin.toLocaleString("th-TH")} เหรียญ
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-cream">
                        <div
                          className="h-full rounded-full bg-coin"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Novel performance table */}
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-brand-black">
            <BookOpen className="h-5 w-5 text-rosegold-dark" />
            ผลงานของฉัน
          </h2>
          <div className="overflow-hidden rounded-xl border border-border bg-white">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-cream/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-brand-black">
                      นิยาย
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-brand-black">
                      สถานะ
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-brand-black">
                      ยอดวิว
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-brand-black">
                      ซื้อตอน
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-brand-black">
                      รายได้
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {novels.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-sm text-muted-foreground"
                      >
                        ยังไม่มีนิยาย
                      </td>
                    </tr>
                  ) : (
                    novels.map((n) => (
                      <tr key={n.id} className="hover:bg-cream/20">
                        <td className="px-4 py-3">
                          <Link
                            href={`/novel/${n.id}`}
                            className="text-sm font-medium text-brand-black hover:text-rosegold-dark"
                          >
                            {n.title}
                          </Link>
                          <p className="text-[11px] text-muted-foreground">
                            {n.chapterCount} ตอน
                          </p>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {statusLabel[n.status] ?? n.status}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-brand-black">
                          {n.viewCount.toLocaleString("th-TH")}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-brand-black">
                          {n.purchaseCount.toLocaleString("th-TH")}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-coin">
                          {n.earningCoin.toLocaleString("th-TH")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Recent transactions */}
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-brand-black">
            <TrendingUp className="h-5 w-5 text-rosegold-dark" />
            รายการเข้าล่าสุด
          </h2>
          <div className="rounded-xl border border-border bg-white">
            {recentTransactions.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">
                ยังไม่มีรายการเข้า
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {recentTransactions.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-brand-black">
                        {typeLabel[t.type] ?? t.type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t.description}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground/80">
                        {formatDate(t.createdAt)}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-green-600">
                      +{t.amount.toLocaleString("th-TH")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
