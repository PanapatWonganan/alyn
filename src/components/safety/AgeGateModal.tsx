"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "alyn_age_verified";
// Re-verify after 30 days
const EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

interface StoredVerification {
  accepted: boolean;
  timestamp: number;
}

function hasValidVerification(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw) as StoredVerification;
    if (!data?.accepted || typeof data.timestamp !== "number") return false;
    if (Date.now() - data.timestamp > EXPIRY_MS) return false;
    return true;
  } catch {
    return false;
  }
}

interface AgeGateModalProps {
  isAdult: boolean;
}

export default function AgeGateModal({ isAdult }: AgeGateModalProps) {
  const router = useRouter();
  // `null` while we haven't yet read from localStorage (SSR / first paint).
  // Once resolved, we set it to `true` to show or `false` to skip.
  const [open, setOpen] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const shouldOpen = isAdult && !hasValidVerification();
    // Defer to next tick so we don't setState synchronously within the effect.
    const timer = window.setTimeout(() => {
      if (!cancelled) setOpen(shouldOpen);
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isAdult]);

  const handleAccept = () => {
    try {
      const payload: StoredVerification = {
        accepted: true,
        timestamp: Date.now(),
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage errors
    }
    setOpen(false);
  };

  const handleDecline = () => {
    router.push("/");
  };

  if (open !== true) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center p-4",
        "bg-brand-black/60 backdrop-blur-md"
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
    >
      <div
        className={cn(
          "w-full max-w-md rounded-2xl bg-white shadow-2xl",
          "border border-rosegold/20",
          "p-6 sm:p-8"
        )}
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rosegold/10">
            <AlertTriangle className="h-8 w-8 text-rosegold-dark" />
          </div>

          <h2
            id="age-gate-title"
            className="mt-5 text-xl font-bold text-brand-black sm:text-2xl"
          >
            เนื้อหาสำหรับผู้ใหญ่
          </h2>

          <p className="mt-3 text-base font-medium text-brand-black">
            คุณอายุ 18 ปีขึ้นไปใช่หรือไม่?
          </p>

          <p className="mt-2 text-sm leading-relaxed text-brand-black/60">
            นิยายเรื่องนี้มีเนื้อหาที่เหมาะสำหรับผู้อ่านอายุ 18 ปีขึ้นไป
            กรุณายืนยันอายุของคุณก่อนดำเนินการต่อ
          </p>

          <div className="mt-6 flex w-full flex-col gap-3">
            <button
              type="button"
              onClick={handleAccept}
              className={cn(
                "w-full rounded-xl bg-rosegold px-5 py-3",
                "text-sm font-semibold text-white",
                "transition-colors hover:bg-rosegold-dark",
                "focus:outline-none focus:ring-2 focus:ring-rosegold/50"
              )}
            >
              ใช่, ดำเนินการต่อ
            </button>
            <button
              type="button"
              onClick={handleDecline}
              className={cn(
                "w-full rounded-xl border border-rosegold/30 bg-white px-5 py-3",
                "text-sm font-semibold text-brand-black",
                "transition-colors hover:bg-cream",
                "focus:outline-none focus:ring-2 focus:ring-rosegold/30"
              )}
            >
              ไม่ใช่, กลับหน้าแรก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
