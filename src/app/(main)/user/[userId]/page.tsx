"use client";

import { use, useEffect, useState } from "react";
import NovelCard from "@/components/ui/NovelCard";
import Button from "@/components/ui/Button";
import {
  User,
  BookOpen,
  Eye,
  Coins,
  Calendar,
  Loader2,
  Crown,
  PenTool,
} from "lucide-react";
import Link from "next/link";
import DonationButton from "@/components/donations/DonationButton";
import DonationList from "@/components/donations/DonationList";
import { useSession } from "next-auth/react";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface UserData {
  user: {
    id: string;
    name: string;
    penName: string | null;
    avatar: string | null;
    bio: string | null;
    role: string;
    createdAt: string;
    _count: {
      novels: number;
      donationsReceived: number;
    };
  };
  novels: Array<{
    id: string;
    title: string;
    coverImage: string | null;
    status: string;
    viewCount: number;
    genre: {
      id: string;
      name: string;
      slug: string;
    };
    _count: {
      chapters: number;
      bookmarks: number;
    };
  }>;
  stats: {
    totalNovels: number;
    totalViews: number;
    totalDonations: number;
  };
}

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);
  const { data: session } = useSession();
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const res = await fetch(`/api/users/${userId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("ไม่พบผู้ใช้");
          } else {
            setError("เกิดข้อผิดพลาด");
          }
          return;
        }
        const userData = await res.json();
        setData(userData);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    }
    fetchUserData();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rosegold-dark" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <User className="h-16 w-16 text-rosegold/20" />
        <h2 className="text-xl font-bold text-brand-black">
          {error || "ไม่พบผู้ใช้"}
        </h2>
        <Link href="/ranking">
          <Button>กลับไปหน้าหลัก</Button>
        </Link>
      </div>
    );
  }

  const { user, novels, stats } = data;

  const roleLabels: Record<string, { label: string; color: string; bg: string; icon?: any }> = {
    READER: { label: "นักอ่าน", color: "text-blue-600", bg: "bg-blue-50" },
    WRITER: { label: "นักเขียน", color: "text-rosegold-dark", bg: "bg-rosegold/10", icon: PenTool },
    ADMIN: { label: "แอดมิน", color: "text-purple-600", bg: "bg-purple-50", icon: Crown },
  };

  const roleInfo = roleLabels[user.role] || roleLabels.READER;
  const RoleIcon = roleInfo.icon;

  const displayName = user.penName || user.name;
  const memberSince = new Date(user.createdAt).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Get initial letter for avatar fallback
  const initialLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-cream/20">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="mb-8 rounded-xl border border-border bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div className="shrink-0">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={displayName}
                  className="h-24 w-24 rounded-full object-cover ring-4 ring-rosegold/20"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-rosegold/20 to-cream ring-4 ring-rosegold/20">
                  <span className="text-3xl font-bold text-rosegold-dark">
                    {initialLetter}
                  </span>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-brand-black">
                  {displayName}
                </h1>
                <div
                  className={`flex items-center gap-1.5 rounded-full ${roleInfo.bg} px-3 py-1`}
                >
                  {RoleIcon && <RoleIcon className={`h-4 w-4 ${roleInfo.color}`} />}
                  <span className={`text-sm font-medium ${roleInfo.color}`}>
                    {roleInfo.label}
                  </span>
                </div>
              </div>

              {user.penName && user.penName !== user.name && (
                <p className="mb-2 text-sm text-muted-foreground">
                  ชื่อจริง: {user.name}
                </p>
              )}

              {user.bio && (
                <p className="mb-4 text-sm text-brand-black/80">{user.bio}</p>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>เป็นสมาชิกตั้งแต่ {memberSince}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Donation Button - Only show if not viewing own profile */}
        {session?.user?.id && session.user.id !== userId && (
          <div className="mb-8">
            <DonationButton receiverId={userId} receiverName={displayName} />
          </div>
        )}

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              label: "นิยายทั้งหมด",
              value: stats.totalNovels.toLocaleString("th-TH"),
              icon: BookOpen,
              color: "text-rosegold-dark",
              bg: "bg-rosegold/10",
            },
            {
              label: "ยอดวิวรวม",
              value: stats.totalViews.toLocaleString("th-TH"),
              icon: Eye,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              label: "รายได้ที่ได้รับ",
              value: stats.totalDonations.toLocaleString("th-TH"),
              icon: Coins,
              color: "text-coin",
              bg: "bg-coin-light",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-white p-5"
            >
              <div className={`mb-3 inline-flex rounded-full ${stat.bg} p-2`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-brand-black">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Novels Section */}
        <div>
          <h2 className="mb-4 text-xl font-bold text-brand-black">
            นิยายของ {displayName}
          </h2>

          {novels.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-6">
              {novels.map((novel) => (
                <NovelCard
                  key={novel.id}
                  id={novel.id}
                  title={novel.title}
                  author={displayName}
                  coverImage={novel.coverImage}
                  genre={novel.genre}
                  viewCount={novel.viewCount}
                  _count={novel._count}
                  status={novel.status}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-white py-20 text-center">
              <BookOpen className="h-16 w-16 text-rosegold/20" />
              <h3 className="mt-4 text-lg font-semibold text-brand-black">
                ยังไม่มีนิยายที่เผยแพร่
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {displayName} ยังไม่ได้เผยแพร่นิยายใดๆ
              </p>
              <Link href="/ranking" className="mt-4">
                <Button variant="outline">สำรวจนิยายอื่นๆ</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Donation List */}
        <div className="mt-8">
          <DonationList receiverId={userId} />
        </div>
      </div>
    </div>
  );
}
