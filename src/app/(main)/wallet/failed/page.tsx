"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle, Loader2 } from "lucide-react";

function FailedInner() {
  const searchParams = useSearchParams();
  const refNo = searchParams.get("refno");

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream/20 px-4 py-12">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-white shadow-lg">
        <div className="flex flex-col items-center gap-3 bg-gradient-to-br from-red-50 to-rose-50 p-8 text-center">
          <div className="rounded-full bg-white p-3 shadow-sm">
            <XCircle className="h-12 w-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-brand-black">
            การชำระเงินไม่สำเร็จ
          </h1>
          <p className="text-sm text-muted-foreground">
            รายการถูกยกเลิกหรือเกิดข้อผิดพลาดระหว่างชำระเงิน
          </p>
        </div>

        <div className="space-y-4 p-6">
          <p className="text-sm text-muted-foreground">
            ยอดเหรียญของคุณยังคงเท่าเดิม ไม่มีการหักเงินจากบัญชี หากคุณคิดว่ามี
            การเรียกเก็บเงินที่ผิดปกติ กรุณาติดต่อทีมงาน Alyn พร้อมรหัสรายการ
            ด้านล่าง
          </p>

          {refNo && (
            <div className="rounded-lg bg-cream/60 p-3 text-center">
              <p className="text-[11px] text-muted-foreground">รหัสรายการ</p>
              <p className="font-mono text-sm text-brand-black">{refNo}</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Link
              href="/wallet"
              className="flex-1 rounded-full border border-border bg-white px-4 py-2.5 text-center text-sm font-medium text-brand-black hover:bg-cream/40"
            >
              กลับหน้ากระเป๋าเงิน
            </Link>
            <Link
              href="/wallet"
              className="flex-1 rounded-full bg-rosegold-dark px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-rosegold"
            >
              ลองอีกครั้ง
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FailedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-rosegold-dark" />
        </div>
      }
    >
      <FailedInner />
    </Suspense>
  );
}
