"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Eye,
  BookOpen,
  Calendar,
  Edit,
  Trash2,
  Loader2,
  Star,
} from "lucide-react";

interface Novel {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  status: "DRAFT" | "ONGOING" | "COMPLETED" | "HIATUS";
  isAdult: boolean;
  isFeatured: boolean;
  viewCount: number;
  createdAt: string;
  author: {
    id: string;
    name: string;
    penName: string | null;
  };
  genre: {
    id: string;
    name: string;
    icon: string | null;
  };
  _count: {
    chapters: number;
    bookmarks: number;
  };
}

interface ApiResponse {
  data: Novel[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
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

export default function AdminNovelsPage() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchNovels();
  }, [search, status, page]);

  const fetchNovels = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (search) params.append("search", search);
      if (status) params.append("status", status);

      const response = await fetch(`/api/admin/novels?${params}`);
      if (!response.ok) throw new Error("Failed to fetch novels");

      const data: ApiResponse = await response.json();
      setNovels(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error("Error fetching novels:", error);
      alert("เกิดข้อผิดพลาดในการโหลดข้อมูลนิยาย");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeature = async (novelId: string) => {
    try {
      const response = await fetch(`/api/admin/novels/${novelId}/feature`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to toggle feature");
      fetchNovels();
    } catch (error) {
      console.error("Error toggling featured:", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตสถานะแนะนำ");
    }
  };

  const handleDelete = async (novelId: string, title: string) => {
    if (!window.confirm(`ยืนยันการลบนิยาย "${title}"?\n\nการกระทำนี้ไม่สามารถย้อนกลับได้`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/novels/${novelId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete novel");

      alert("ลบนิยายเรียบร้อยแล้ว");
      fetchNovels();
    } catch (error) {
      console.error("Error deleting novel:", error);
      alert("เกิดข้อผิดพลาดในการลบนิยาย");
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-black mb-2">
            จัดการนิยาย
          </h1>
          <p className="text-muted-foreground">
            ทั้งหมด {total} เรื่อง
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="ค้นหาจากชื่อนิยาย..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-rosegold-dark"
              />
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleStatusChange("")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                status === ""
                  ? "bg-rosegold-dark text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              ทั้งหมด
            </button>
            {Object.entries(statusConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => handleStatusChange(key)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  status === key
                    ? "bg-rosegold-dark text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {config.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-rosegold-dark" />
          </div>
        ) : novels.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-muted-foreground text-lg">ไม่พบนิยาย</p>
          </div>
        ) : (
          <>
            {/* Novels Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-border">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-brand-black">
                        นิยาย
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-brand-black">
                        นักเขียน
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-brand-black">
                        หมวดหมู่
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-brand-black">
                        สถานะ
                      </th>
                      <th className="text-center px-6 py-4 text-sm font-semibold text-brand-black">
                        ตอน
                      </th>
                      <th className="text-center px-6 py-4 text-sm font-semibold text-brand-black">
                        ยอดดู
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-brand-black">
                        วันที่สร้าง
                      </th>
                      <th className="text-center px-6 py-4 text-sm font-semibold text-brand-black">
                        จัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {novels.map((novel) => (
                      <tr key={novel.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                              {novel.coverImage ? (
                                <img
                                  src={novel.coverImage}
                                  alt={novel.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <BookOpen className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/admin/novels/${novel.id}`}
                                className="font-medium text-brand-black hover:text-rosegold-dark line-clamp-1"
                              >
                                {novel.title}
                              </Link>
                              {novel.isAdult && (
                                <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                                  18+
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-brand-black">
                            {novel.author.penName || novel.author.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-muted-foreground">
                            {novel.genre.icon} {novel.genre.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                              statusConfig[novel.status].bgClass
                            } ${statusConfig[novel.status].textClass}`}
                          >
                            {statusConfig[novel.status].label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-brand-black">
                          {novel._count.chapters}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                            <Eye className="w-4 h-4" />
                            {novel.viewCount.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {new Date(novel.createdAt).toLocaleDateString("th-TH")}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleToggleFeature(novel.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                novel.isFeatured
                                  ? "text-coin bg-coin/10 hover:bg-coin/20"
                                  : "text-gray-400 hover:bg-gray-100"
                              }`}
                              title={
                                novel.isFeatured
                                  ? "ยกเลิกนิยายแนะนำ"
                                  : "ตั้งเป็นนิยายแนะนำ"
                              }
                            >
                              <Star
                                className="w-4 h-4"
                                fill={novel.isFeatured ? "currentColor" : "none"}
                              />
                            </button>
                            <Link
                              href={`/admin/novels/${novel.id}`}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="ดูรายละเอียด"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(novel.id, novel.title)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="ลบ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  ก่อนหน้า
                </button>
                <span className="px-4 py-2 text-brand-black">
                  หน้า {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  ถัดไป
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
