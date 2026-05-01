"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { MessageSquare, Send, Trash2, User, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import Button from "@/components/ui/Button";
import ReportButton from "@/components/safety/ReportButton";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    penName: string | null;
    avatar: string | null;
  };
}

interface CommentSectionProps {
  chapterId: string;
  theme?: "default" | "sepia" | "night" | "dark";
}

const themeStyles = {
  default: {
    bg: "bg-white",
    text: "text-brand-black",
    border: "border-border",
    secondary: "bg-gray-50",
    mutedText: "text-muted-foreground",
  },
  sepia: {
    bg: "bg-[#F4ECD8]",
    text: "text-[#5B4636]",
    border: "border-[#D4C4A8]",
    secondary: "bg-[#EAE0C8]",
    mutedText: "text-[#8B7355]",
  },
  night: {
    bg: "bg-[#1A1A2E]",
    text: "text-[#C8C8D0]",
    border: "border-gray-800",
    secondary: "bg-[#16213E]",
    mutedText: "text-gray-400",
  },
  dark: {
    bg: "bg-[#121212]",
    text: "text-[#B0B0B0]",
    border: "border-gray-800",
    secondary: "bg-[#1E1E1E]",
    mutedText: "text-gray-500",
  },
};

export default function CommentSection({ chapterId, theme = "default" }: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const styles = themeStyles[theme];
  const MAX_CHARS = 2000;

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await fetch(`/api/comments?chapterId=${chapterId}`);
        if (res.ok) {
          const data = await res.json();
          setComments(data.comments || []);
          setTotal(data.total || 0);
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [chapterId]);

  async function fetchComments() {
    try {
      const res = await fetch(`/api/comments?chapterId=${chapterId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || content.length > MAX_CHARS || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId, content: content.trim() }),
      });

      if (res.ok) {
        setContent("");
        await fetchComments();
      } else {
        const error = await res.json();
        alert(error.error || "เกิดข้อผิดพลาดในการส่งความคิดเห็น");
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
      alert("เกิดข้อผิดพลาดในการส่งความคิดเห็น");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    if (!confirm("คุณแน่ใจว่าต้องการลบความคิดเห็นนี้?")) return;

    setDeletingId(commentId);
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchComments();
      } else {
        const error = await res.json();
        alert(error.error || "ไม่สามารถลบความคิดเห็นได้");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("เกิดข้อผิดพลาดในการลบความคิดเห็น");
    } finally {
      setDeletingId(null);
    }
  }

  function getUserDisplayName(user: Comment["user"]) {
    return user.penName || user.name || "ผู้ใช้งาน";
  }

  if (loading) {
    return (
      <div className={`py-8 border-t ${styles.border}`}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className={`h-8 w-8 animate-spin ${styles.mutedText}`} />
        </div>
      </div>
    );
  }

  return (
    <div className={`py-8 border-t ${styles.border}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <MessageSquare className={`h-5 w-5 ${styles.text}`} />
          <h3 className={`text-lg font-bold ${styles.text}`}>
            ความคิดเห็น ({total})
          </h3>
        </div>

        {/* Comment Form */}
        {session?.user ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="เขียนความคิดเห็น..."
                className={`w-full rounded-xl border ${styles.border} ${styles.bg} ${styles.text} px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rosegold/50 resize-none transition-all`}
                rows={3}
                maxLength={MAX_CHARS}
                disabled={submitting}
              />
              <div className={`absolute bottom-2 right-2 text-xs ${styles.mutedText}`}>
                {content.length}/{MAX_CHARS}
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={!content.trim() || content.length > MAX_CHARS || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังส่ง...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    ส่งความคิดเห็น
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className={`rounded-xl border ${styles.border} ${styles.secondary} px-4 py-3 text-center`}>
            <p className={styles.mutedText}>
              <Link href="/auth/login" className="text-rosegold-dark hover:underline font-medium">
                เข้าสู่ระบบ
              </Link>
              {" "}เพื่อแสดงความคิดเห็น
            </p>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className={`text-center py-12 ${styles.mutedText}`}>
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>ยังไม่มีความคิดเห็น เป็นคนแรกที่แสดงความเห็น!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className={`rounded-xl border ${styles.border} ${styles.bg} p-4 space-y-3 transition-all hover:shadow-sm`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {comment.user.avatar ? (
                        <img
                          src={comment.user.avatar}
                          alt={getUserDisplayName(comment.user)}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-rosegold/20 flex items-center justify-center">
                          <User className="h-5 w-5 text-rosegold-dark" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className={`font-semibold ${styles.text}`}>
                          {getUserDisplayName(comment.user)}
                        </span>
                        <span className={`text-xs ${styles.mutedText}`}>
                          {formatRelativeTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className={`mt-1 ${styles.text} whitespace-pre-wrap break-words`}>
                        {comment.content}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex items-center gap-1">
                    {session?.user && session.user.id !== comment.user.id && (
                      <ReportButton
                        targetType="COMMENT"
                        targetId={comment.id}
                      />
                    )}
                    {session?.user?.id === comment.user.id && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        disabled={deletingId === comment.id}
                        className={`p-2 rounded-lg ${styles.mutedText} hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50`}
                        title="ลบความคิดเห็น"
                      >
                        {deletingId === comment.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
