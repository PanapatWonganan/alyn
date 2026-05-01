"use client";

import { formatDate } from "@/lib/utils";
import {
  Coins,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  History,
  CreditCard,
  Loader2,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface CoinPackage {
  id: string;
  coins: number;
  bonus: number;
  price: number;
}

export default function WalletPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [coinBalance, setCoinBalance] = useState(0);
  const [coinPackages, setCoinPackages] = useState<CoinPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [topupLoading, setTopupLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) return;

    let cancelled = false;

    async function fetchData() {
      try {
        const [meRes, txRes, pkgRes] = await Promise.all([
          fetch("/api/users/me", { cache: "no-store" }),
          fetch("/api/coins/transactions?limit=20", { cache: "no-store" }),
          fetch("/api/payments/packages", { cache: "no-store" }),
        ]);
        const meData = await meRes.json();
        const txData = await txRes.json();
        const pkgData = await pkgRes.json();

        if (cancelled) return;
        setCoinBalance(meData.user?.coinBalance || 0);
        setTransactions(txData.transactions || []);
        setCoinPackages(pkgData.packages || []);
      } catch (error) {
        console.error("Error fetching wallet data:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();

    // Re-fetch whenever the tab becomes visible again — e.g. after returning
    // from Pay Solutions' hosted page, or after the success redirect.
    function onVisibility() {
      if (document.visibilityState === "visible") {
        fetchData();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", fetchData);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", fetchData);
    };
  }, [session]);

  const handleTopup = (pkg: CoinPackage) => {
    setTopupLoading(pkg.id);
    router.push(`/wallet/checkout?package=${encodeURIComponent(pkg.id)}`);
  };

  const typeIcon: Record<string, React.ReactNode> = {
    TOPUP: <Plus className="h-4 w-4 text-green-600" />,
    PURCHASE: <ArrowUpRight className="h-4 w-4 text-red-500" />,
    EARNING: <ArrowDownLeft className="h-4 w-4 text-blue-600" />,
    DONATION_SENT: <Gift className="h-4 w-4 text-orange-500" />,
    DONATION_RECEIVED: <Gift className="h-4 w-4 text-purple-600" />,
  };

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rosegold-dark" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Wallet className="h-16 w-16 text-rosegold/20" />
        <h2 className="text-xl font-bold text-brand-black">
          กรุณาเข้าสู่ระบบ
        </h2>
        <Link
          href="/auth/login"
          className="rounded-full bg-rosegold-dark px-6 py-2 text-sm font-medium text-white hover:bg-rosegold"
        >
          เข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream/20">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Coin Balance Card */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-rosegold-dark to-rosegold p-8 text-white shadow-lg">
          <div className="flex items-center gap-3 text-white/80">
            <Coins className="h-6 w-6" />
            <span className="text-sm font-medium">ยอดเหรียญของฉัน</span>
          </div>
          <p className="mt-2 text-4xl font-bold">
            {coinBalance.toLocaleString("th-TH")}
            <span className="ml-2 text-lg font-normal text-white/70">
              เหรียญ
            </span>
          </p>
          <p className="mt-1 text-sm text-white/60">1 เหรียญ = 1 บาท</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Top Up Section */}
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-brand-black">
              <CreditCard className="h-5 w-5 text-rosegold-dark" />
              เติมเหรียญ
            </h2>
            <div className="space-y-3">
              {coinPackages.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => handleTopup(pkg)}
                  disabled={topupLoading !== null}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-white p-4 transition-all hover:border-rosegold/30 hover:shadow-sm disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-coin-light">
                      {topupLoading === pkg.id ? (
                        <Loader2 className="h-5 w-5 animate-spin text-coin" />
                      ) : (
                        <Coins className="h-5 w-5 text-coin" />
                      )}
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-semibold text-brand-black">
                        {pkg.coins.toLocaleString("th-TH")} เหรียญ
                      </span>
                      {pkg.bonus > 0 && (
                        <span className="ml-2 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600">
                          +{pkg.bonus} โบนัส
                        </span>
                      )}
                      {pkg.id.startsWith("test_") && (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          ทดสอบ
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-rosegold-dark">
                    {pkg.price.toLocaleString("th-TH")} บาท
                  </span>
                </button>
              ))}
              <p className="px-1 pt-1 text-[11px] text-muted-foreground">
                ชำระเงินผ่าน Pay Solutions รองรับบัตรเครดิต/เดบิต, พร้อมเพย์ และธนาคารออนไลน์
              </p>
            </div>
          </div>

          {/* Transaction History */}
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-brand-black">
              <History className="h-5 w-5 text-rosegold-dark" />
              ประวัติการทำรายการ
            </h2>
            <div className="space-y-2">
              {transactions.length === 0 ? (
                <div className="rounded-xl border border-border bg-white p-8 text-center text-muted-foreground">
                  ยังไม่มีประวัติการทำรายการ
                </div>
              ) : (
                transactions.map((tx: any) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-white p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cream">
                        {typeIcon[tx.type] || (
                          <Coins className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-brand-black">
                          {tx.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(tx.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        tx.amount > 0 ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {tx.amount > 0 ? "+" : ""}
                      {tx.amount.toLocaleString("th-TH")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
