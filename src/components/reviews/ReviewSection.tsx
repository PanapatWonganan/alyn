"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Star, Loader2, Trash2, MessageSquare } from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";

interface ReviewUser {
  id: string;
  name: string;
  penName: string | null;
  avatar: string | null;
}

interface Review {
  id: string;
  rating: number;
  content: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user: ReviewUser;
}

interface Props {
  novelId: string;
  authorId?: string;
}

function StarRow({
  value,
  size = 20,
  onChange,
  readOnly = false,
}: {
  value: number;
  size?: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(null)}
          onClick={() => !readOnly && onChange?.(n)}
          className={cn(
            "transition-transform",
            !readOnly && "hover:scale-110 cursor-pointer"
          )}
          aria-label={`ให้คะแนน ${n} ดาว`}
        >
          <Star
            style={{ width: size, height: size }}
            className={cn(
              "transition-colors",
              n <= display
                ? "fill-coin text-coin"
                : "fill-transparent text-brand-black/20"
            )}
          />
        </button>
      ))}
    </div>
  );
}

export default function ReviewSection({ novelId, authorId }: Props) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id as string | undefined;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [myRating, setMyRating] = useState(0);
  const [myContent, setMyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const isAuthor = Boolean(currentUserId && authorId && currentUserId === authorId);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/novels/${novelId}/reviews?limit=20`);
      if (res.ok) {
        const json = await res.json();
        setReviews(json.data || []);
        setAverageRating(json.averageRating || 0);
        setReviewCount(json.reviewCount || 0);

        if (currentUserId) {
          const mine = (json.data || []).find(
            (r: Review) => r.userId === currentUserId
          );
          if (mine) {
            setMyRating(mine.rating);
            setMyContent(mine.content || "");
          }
        }
      }
    } catch (err) {
      console.error("Fetch reviews error:", err);
    } finally {
      setLoading(false);
    }
  }, [novelId, currentUserId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const myReview = reviews.find((r) => r.userId === currentUserId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (myRating < 1 || myRating > 5) {
      setFormError("กรุณาเลือกคะแนน 1-5 ดาว");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/novels/${novelId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: myRating, content: myContent }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setFormError(json.error || "ไม่สามารถส่งรีวิวได้");
        return;
      }
      setShowForm(false);
      await fetchReviews();
    } catch (err) {
      console.error(err);
      setFormError("เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!myReview) return;
    if (!confirm("ต้องการลบรีวิวนี้ใช่หรือไม่?")) return;
    try {
      const res = await fetch(
        `/api/novels/${novelId}/reviews/${myReview.id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setMyRating(0);
        setMyContent("");
        await fetchReviews();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const averageDisplay = averageRating.toFixed(1);

  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-brand-black">
              รีวิวและคะแนน
            </h2>
            <div className="mt-2 flex items-center gap-3">
              <StarRow value={Math.round(averageRating)} readOnly size={20} />
              <span className="text-xl font-bold text-brand-black">
                {averageDisplay}
              </span>
              <span className="text-sm text-muted-foreground">
                ({reviewCount.toLocaleString("th-TH")} รีวิว)
              </span>
            </div>
          </div>

          {currentUserId && !isAuthor && (
            <Button
              variant={myReview ? "outline" : "primary"}
              onClick={() => setShowForm((s) => !s)}
            >
              <MessageSquare className="h-4 w-4" />
              {myReview ? "แก้ไขรีวิวของฉัน" : "เขียนรีวิว"}
            </Button>
          )}
        </div>

        {showForm && currentUserId && !isAuthor && (
          <form
            onSubmit={handleSubmit}
            className="mb-6 rounded-xl border border-border bg-cream/30 p-5"
          >
            <div className="mb-3">
              <label className="mb-2 block text-sm font-semibold text-brand-black">
                คะแนนของคุณ
              </label>
              <StarRow value={myRating} onChange={setMyRating} size={28} />
            </div>

            <div className="mb-3">
              <label
                htmlFor="review-content"
                className="mb-2 block text-sm font-semibold text-brand-black"
              >
                ความคิดเห็น (ไม่บังคับ)
              </label>
              <textarea
                id="review-content"
                value={myContent}
                onChange={(e) => setMyContent(e.target.value)}
                rows={4}
                maxLength={1000}
                placeholder="เขียนรีวิวของคุณ..."
                className="w-full rounded-lg border border-border bg-white p-3 text-sm text-brand-black focus:border-rosegold focus:outline-none focus:ring-1 focus:ring-rosegold"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {myContent.length}/1000
              </p>
            </div>

            {formError && (
              <p className="mb-3 text-sm text-red-600">{formError}</p>
            )}

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {myReview ? "บันทึกการแก้ไข" : "ส่งรีวิว"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowForm(false)}
              >
                ยกเลิก
              </Button>
              {myReview && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleDelete}
                  className="ml-auto text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                  ลบรีวิว
                </Button>
              )}
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-rosegold-dark" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            ยังไม่มีรีวิว เป็นคนแรกที่รีวิวนิยายเรื่องนี้
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => {
              const displayName =
                review.user.penName || review.user.name || "ผู้ใช้";
              const initial = displayName.charAt(0).toUpperCase();
              return (
                <div
                  key={review.id}
                  className="rounded-xl border border-border bg-white p-4"
                >
                  <div className="mb-2 flex items-center gap-3">
                    {review.user.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={review.user.avatar}
                        alt={displayName}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rosegold/20 to-cream text-sm font-bold text-rosegold-dark">
                        {initial}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-brand-black">
                        {displayName}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <StarRow value={review.rating} readOnly size={14} />
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(review.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {review.content && (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-brand-black/80">
                      {review.content}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
