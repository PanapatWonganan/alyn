"use client";

import { useState } from "react";
import { Flag, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type TargetType = "COMMENT" | "NOVEL" | "CHAPTER";

interface ReportButtonProps {
  targetType: TargetType;
  targetId: string;
  className?: string;
  label?: string;
  variant?: "inline" | "button";
}

const targetTypeLabel: Record<TargetType, string> = {
  COMMENT: "ความคิดเห็น",
  NOVEL: "นิยาย",
  CHAPTER: "ตอน",
};

export default function ReportButton({
  targetType,
  targetId,
  className,
  label = "รายงาน",
  variant = "inline",
}: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert("กรุณาระบุเหตุผล");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          reason: reason.trim(),
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          alert("กรุณาเข้าสู่ระบบก่อนรายงาน");
          setOpen(false);
          return;
        }
        throw new Error(data.error || "Failed");
      }
      setSuccess(true);
      setReason("");
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 1500);
    } catch (err) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          variant === "button"
            ? "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-brand-black/70 hover:bg-cream hover:text-rosegold-dark transition-colors text-sm"
            : "inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-rosegold-dark transition-colors",
          className
        )}
        aria-label={label}
      >
        <Flag className={variant === "button" ? "w-4 h-4" : "w-3.5 h-3.5"} />
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-brand-black/50 z-[100] flex items-center justify-center p-4"
          onClick={() => !submitting && setOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-brand-black">
                  รายงาน{targetTypeLabel[targetType]}
                </h2>
                <p className="text-sm text-muted-foreground">
                  แจ้งให้ผู้ดูแลระบบตรวจสอบเนื้อหานี้
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={submitting}
                className="p-1 text-muted-foreground hover:text-brand-black rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {success ? (
              <div className="py-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-3">
                  <Flag className="w-6 h-6" />
                </div>
                <p className="text-brand-black font-medium">
                  ส่งรายงานเรียบร้อยแล้ว
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  ขอบคุณที่ช่วยให้ชุมชนอลินปลอดภัย
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <label className="block text-sm font-medium text-brand-black mb-2">
                  เหตุผล
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="เช่น เนื้อหาไม่เหมาะสม, ลอกเลียน, สแปม..."
                  rows={4}
                  maxLength={1000}
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-rosegold-dark resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  {reason.length}/1,000 ตัวอักษร
                </p>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg text-brand-black hover:bg-cream transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !reason.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-rosegold-dark text-white rounded-lg hover:bg-rosegold-dark/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    ส่งรายงาน
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
