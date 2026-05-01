"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, MessageSquare, Trash2, Loader2, User } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    penName: string | null;
    avatar: string | null;
    email: string;
  };
  chapter: {
    id: string;
    number: number;
    title: string;
    novel: {
      id: string;
      title: string;
    };
  };
}

interface ApiResponse {
  data: Comment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchComments();
  }, [search, page]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (search) params.append("search", search);

      const response = await fetch(`/api/admin/comments?${params}`);
      if (!response.ok) throw new Error("Failed to fetch comments");

      const data: ApiResponse = await response.json();
      setComments(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error("Error fetching comments:", error);
      alert("เกิดข้อผิดพลาดในการโหลดข้อมูลความคิดเห็น");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: string, userName: string) => {
    if (!window.confirm(`ยืนยันการลบความคิดเห็นของ ${userName}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/comments/${commentId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete comment");

      alert("ลบความคิดเห็นเรียบร้อยแล้ว");
      fetchComments();
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("เกิดข้อผิดพลาดในการลบความคิดเห็น");
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-black mb-2">
            จัดการความคิดเห็น
          </h1>
          <p className="text-muted-foreground">ทั้งหมด {total} ความคิดเห็น</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="ค้นหาจากเนื้อหาหรือชื่อผู้ใช้..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-rosegold-dark"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-rosegold-dark" />
          </div>
        ) : comments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-muted-foreground text-lg">ไม่พบความคิดเห็น</p>
          </div>
        ) : (
          <>
            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* User Avatar */}
                    <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                      {comment.user.avatar ? (
                        <img
                          src={comment.user.avatar}
                          alt={comment.user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium text-brand-black">
                            {comment.user.penName || comment.user.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {comment.user.email}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                          {new Date(comment.createdAt).toLocaleDateString(
                            "th-TH",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                      </div>

                      <p className="text-brand-black mb-3 leading-relaxed">
                        {truncateText(comment.content, 200)}
                      </p>

                      <div className="flex items-center justify-between">
                        <Link
                          href={`/novels/${comment.chapter.novel.id}`}
                          className="text-sm text-rosegold-dark hover:underline"
                        >
                          {comment.chapter.novel.title} - ตอนที่{" "}
                          {comment.chapter.number}: {comment.chapter.title}
                        </Link>

                        <button
                          onClick={() =>
                            handleDelete(
                              comment.id,
                              comment.user.penName || comment.user.name
                            )
                          }
                          className="flex items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="text-sm">ลบ</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
