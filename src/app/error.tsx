"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-red-600" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold text-brand-black mb-4">
          เกิดข้อผิดพลาด
        </h1>

        {/* Description */}
        <p className="text-lg text-muted-foreground mb-8">
          ขออภัย เกิดข้อผิดพลาดบางอย่าง กรุณาลองใหม่อีกครั้ง
        </p>

        {/* Error Details (development only) */}
        {process.env.NODE_ENV === "development" && error.message && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
            <p className="text-sm font-mono text-red-800 break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-red-600 mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-rosegold-dark text-white font-medium hover:bg-rosegold-dark/90 transition-colors"
          >
            ลองใหม่
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-8 py-3 rounded-lg border-2 border-rosegold-dark text-rosegold-dark font-medium hover:bg-rosegold-dark/5 transition-colors"
          >
            กลับหน้าแรก
          </Link>
        </div>
      </div>
    </div>
  );
}
