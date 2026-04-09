"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Eye,
  Bookmark,
  Calendar,
  Coins,
  Loader2,
  Save,
  Trash2,
  Lock,
  Unlock,
} from "lucide-react";

interface Chapter {
  id: string;
  number: number;
  title: string;
  wordCount: number;
  coinPrice: number;
  isFree: boolean;
  publishedAt: string | null;
  createdAt: string;
}

interface Novel {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  coverImage: string | null;
  status: "DRAFT" | "ONGOING" | "COMPLETED" | "HIATUS";
  isAdult: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    penName: string | null;
    email: string;
    avatar: string | null;
  };
  genre: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  };
  tags: Array<{
    id: string;
    name: string;
  }>;
  chapters: Chapter[];
  _count: {
    bookmarks: number;
    chapters: number;
  };
}

const statusConfig = {
  DRAFT: { label: "แบบร่าง", bgClass: "bg-gray-100", textClass: "text-gray-600" },
  ONGOING: {
    label: "กำลังเขียน",
    bgClass: "bg-green-100",
    textClass: "text-green-700",
  },
  COMPLETED: { label: "จบแล้ว", bgClass: "bg-blue-100", textClass: "text-blue-700" },
  HIATUS: {
    label: "พักเขียน",
    bgClass: "bg-yellow-100",
    textClass: "text-yellow-700",
  },
};

export default function AdminNovelDetailPage({
  params,
}: {
  params: Promise<{ novelId: string }>;
}) {
  const { novelId } = use(params);
  const router = useRouter();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isAdultToggle, setIsAdultToggle] = useState(false);

  useEffect(() => {
    fetchNovel();
  }, [novelId]);

  const fetchNovel = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/novels/${novelId}`);
      if (!response.ok) throw new Error("Failed to fetch novel");

      const data = await response.json();
      setNovel(data.novel);
      setSelectedStatus(data.novel.status);
      setIsAdultToggle(data.novel.isAdult);
    } catch (error) {
      console.error("Error fetching novel:", error);
      alert("เกิดข้อผิดพลาดในการโหลดข้อมูลนิยาย");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!novel) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/admin/novels/${novelId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: selectedStatus,
          isAdult: isAdultToggle,
        }),
      });

      if (!response.ok) throw new Error("Failed to update novel");

      alert("บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว");
      fetchNovel();
    } catch (error) {
      console.error("Error updating novel:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!novel) return;

    if (
      !window.confirm(
        `ยืนยันการลบนิยาย "${novel.title}"?\n\nการกระทำนี้จะลบนิยาย ตอนทั้งหมด และข้อมูลที่เกี่ยวข้องอย่างถาวร\n\nไม่สามารถย้อนกลับได้!`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/novels/${novelId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete novel");

      alert("ลบนิยายเรียบร้อยแล้ว");
      router.push("/admin/novels");
    } catch (error) {
      console.error("Error deleting novel:", error);
      alert("เกิดข้อผิดพลาดในการลบนิยาย");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rosegold-dark" />
      </div>
    );
  }

  if (!novel) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-muted-foreground mb-4">ไม่พบนิยาย</p>
          <Link
            href="/admin/novels"
            className="text-rosegold-dark hover:underline"
          >
            กลับไปหน้าจัดการนิยาย
          </Link>
        </div>
      </div>
    );
  }

  const hasChanges =
    selectedStatus !== novel.status || isAdultToggle !== novel.isAdult;

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/novels"
            className="inline-flex items-center gap-2 text-rosegold-dark hover:underline mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับไปหน้าจัดการนิยาย
          </Link>
          <h1 className="text-3xl font-bold text-brand-black">
            รายละเอียดนิยาย
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Novel Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <div className="aspect-[2/3] bg-gray-200 rounded-lg overflow-hidden mb-4">
                {novel.coverImage ? (
                  <img
                    src={novel.coverImage}
                    alt={novel.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>

              <h2 className="text-xl font-bold text-brand-black mb-2">
                {novel.title}
              </h2>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">นักเขียน:</span>
                  <span>{novel.author.penName || novel.author.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">หมวดหมู่:</span>
                  <span>
                    {novel.genre.icon} {novel.genre.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(novel.createdAt).toLocaleDateString("th-TH")}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-border">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-rosegold-dark mb-1">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="text-lg font-bold text-brand-black">
                    {novel._count.chapters}
                  </div>
                  <div className="text-xs text-muted-foreground">ตอน</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-rosegold-dark mb-1">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div className="text-lg font-bold text-brand-black">
                    {novel.viewCount.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">ยอดดู</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-rosegold-dark mb-1">
                    <Bookmark className="w-4 h-4" />
                  </div>
                  <div className="text-lg font-bold text-brand-black">
                    {novel._count.bookmarks}
                  </div>
                  <div className="text-xs text-muted-foreground">บุ๊กมาร์ก</div>
                </div>
              </div>

              {/* Tags */}
              {novel.tags.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-brand-black mb-2">
                    แท็ก
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {novel.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Status & Adult Controls */}
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brand-black mb-2">
                    สถานะนิยาย
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-rosegold-dark"
                  >
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAdultToggle}
                      onChange={(e) => setIsAdultToggle(e.target.checked)}
                      className="w-5 h-5 text-rosegold-dark focus:ring-rosegold-dark rounded"
                    />
                    <div className="flex items-center gap-2">
                      {isAdultToggle ? (
                        <Lock className="w-5 h-5 text-red-600" />
                      ) : (
                        <Unlock className="w-5 h-5 text-gray-400" />
                      )}
                      <span className="text-sm font-medium text-brand-black">
                        เนื้อหาสำหรับผู้ใหญ่ (18+)
                      </span>
                    </div>
                  </label>
                </div>

                {hasChanges && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 bg-rosegold-dark text-white px-4 py-2 rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    บันทึกการเปลี่ยนแปลง
                  </button>
                )}
              </div>

              {/* Delete Button */}
              <button
                onClick={handleDelete}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4" />
                ลบนิยาย
              </button>
            </div>
          </div>

          {/* Right Column - Synopsis & Chapters */}
          <div className="lg:col-span-2 space-y-6">
            {/* Synopsis */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-bold text-brand-black mb-4">
                เรื่องย่อ
              </h3>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {novel.synopsis}
              </p>
            </div>

            {/* Chapters */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-bold text-brand-black mb-4">
                รายการตอน ({novel.chapters.length})
              </h3>

              {novel.chapters.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  ยังไม่มีตอน
                </p>
              ) : (
                <div className="space-y-2">
                  {novel.chapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-sm font-medium text-rosegold-dark">
                            ตอนที่ {chapter.number}
                          </span>
                          {chapter.isFree ? (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                              ฟรี
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">
                              <Coins className="w-3 h-3" />
                              {chapter.coinPrice}
                            </span>
                          )}
                        </div>
                        <div className="font-medium text-brand-black mb-1">
                          {chapter.title}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{chapter.wordCount.toLocaleString()} คำ</span>
                          <span>
                            {chapter.publishedAt
                              ? new Date(chapter.publishedAt).toLocaleDateString(
                                  "th-TH"
                                )
                              : "ยังไม่เผยแพร่"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
