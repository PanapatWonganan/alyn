"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Coins, Loader2, Wallet } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

function SuccessInner() {
  const searchParams = useSearchParams();
  const refNo = searchParams.get("refno");
  const [order, setOrder] = useState<any>(null);
  const [coinBalance, setCoinBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!refNo) {
      setError("ไม่พบรหัสรายการ");
      setLoading(false);
      return;
    }

    let attempts = 0;
    let cancelled = false;

    async function poll() {
      while (!cancelled && attempts < 8) {
        attempts++;
        try {
          const res = await fetch(
            `/api/payments/orders/${encodeURIComponent(refNo!)}/status`
          );
          const data = await res.json();
          if (!res.ok) {
            setError(data.error || "ไม่สามารถตรวจสอบรายการได้");
            break;
          }
          if (data.order?.status === "PAID") {
            setOrder(data.order);
            setCoinBalance(data.coinBalance);
            break;
          }
          if (data.order?.status === "FAILED") {
            setError("การชำระเงินล้มเหลว");
            break;
          }
          // Still pending — wait and retry
          await new Promise((r) => setTimeout(r, 1500));
        } catch (err) {
          console.error(err);
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
      if (!cancelled) setLoading(false);
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [refNo]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream/20 px-4">
        <Loader2 className="h-10 w-10 animate-spin text-rosegold-dark" />
        <p className="text-sm text-muted-foreground">
          กำลังยืนยันการชำระเงิน...
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream/20 px-4">
        <Wallet className="h-16 w-16 text-rosegold/30" />
        <h1 className="text-xl font-bold text-brand-black">
          {error || "ไม่พบข้อมูลการชำระเงิน"}
        </h1>
        <Link
          href="/wallet"
          className="rounded-full bg-rosegold-dark px-6 py-2 text-sm font-medium text-white hover:bg-rosegold"
        >
          กลับไปหน้ากระเป๋าเงิน
        </Link>
      </div>
    );
  }

  const totalCoins = order.coinAmount + order.bonusAmount;

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream/20 px-4 py-12">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-white shadow-lg">
        <div className="flex flex-col items-center gap-3 bg-gradient-to-br from-green-50 to-emerald-50 p-8 text-center">
          <div className="rounded-full bg-white p-3 shadow-sm">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-brand-black">
            เติมเหรียญสำเร็จ!
          </h1>
          <p className="text-sm text-muted-foreground">
            ขอบคุณที่สนับสนุนนักเขียนไทยกับ Alyn
          </p>
        </div>

        <div className="space-y-4 p-6">
          <div className="rounded-xl bg-cream/60 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">เหรียญที่ได้รับ</span>
              <div className="flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-coin" />
                <span className="text-lg font-bold text-brand-black">
                  {totalCoins.toLocaleString("th-TH")}
                </span>
              </div>
            </div>
            {order.bonusAmount > 0 && (
              <p className="mt-1 text-right text-[11px] text-green-600">
                (รวมโบนัส +{order.bonusAmount})
              </p>
            )}
          </div>

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">ยอดชำระ</dt>
              <dd className="font-medium text-brand-black">
                {order.priceThb.toLocaleString("th-TH")} บาท
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">รหัสรายการ</dt>
              <dd className="font-mono text-xs text-brand-black">
                {order.refNo}
              </dd>
            </div>
            {coinBalance !== null && (
              <div className="flex justify-between border-t border-border pt-2">
                <dt className="text-muted-foreground">ยอดเหรียญคงเหลือ</dt>
                <dd className="font-bold text-rosegold-dark">
                  {coinBalance.toLocaleString("th-TH")} เหรียญ
                </dd>
              </div>
            )}
          </dl>

          <div className="flex gap-2 pt-2">
            <Link
              href="/wallet"
              className="flex-1 rounded-full border border-border bg-white px-4 py-2.5 text-center text-sm font-medium text-brand-black hover:bg-cream/40"
            >
              กระเป๋าเงิน
            </Link>
            <Link
              href="/explore"
              className="flex-1 rounded-full bg-rosegold-dark px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-rosegold"
            >
              เริ่มอ่านนิยาย
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-rosegold-dark" />
        </div>
      }
    >
      <SuccessInner />
    </Suspense>
  );
}
