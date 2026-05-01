"use client";

import { formatDate } from "@/lib/utils";
import {
  Banknote,
  Coins,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface PayoutRequest {
  id: string;
  amountCoins: number;
  amountThb: number;
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAID" | string;
  adminNote: string | null;
  requestedAt: string;
  processedAt: string | null;
}

const statusMeta: Record<
  string,
  { label: string; bg: string; text: string; icon: React.ElementType }
> = {
  PENDING: {
    label: "รอดำเนินการ",
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    icon: Clock,
  },
  APPROVED: {
    label: "อนุมัติแล้ว",
    bg: "bg-blue-100",
    text: "text-blue-700",
    icon: CheckCircle2,
  },
  PAID: {
    label: "จ่ายแล้ว",
    bg: "bg-green-100",
    text: "text-green-700",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "ถูกปฏิเสธ",
    bg: "bg-red-100",
    text: "text-red-700",
    icon: XCircle,
  },
};

export default function WithdrawPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [balance, setBalance] = useState(0);
  const [minPayout, setMinPayout] = useState(500);
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    amountCoins: "",
    bankName: "",
    bankAccount: "",
    bankAccountName: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/writer/withdraw");
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "เกิดข้อผิดพลาด");
        return;
      }
      const data = await res.json();
      setBalance(data.balance ?? 0);
      setMinPayout(data.minPayout ?? 500);
      setRequests(data.requests ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!session?.user) return;
    load();
  }, [session]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const amountCoins = parseInt(form.amountCoins, 10);
    if (!amountCoins || amountCoins < minPayout) {
      setError(`จำนวนเหรียญต้องไม่น้อยกว่า ${minPayout} เหรียญ`);
      return;
    }
    if (amountCoins > balance) {
      setError("ยอดเหรียญไม่เพียงพอ");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/writer/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCoins,
          bankName: form.bankName,
          bankAccount: form.bankAccount,
          bankAccountName: form.bankAccountName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "เกิดข้อผิดพลาด");
        return;
      }
      setMessage(data.message || "ส่งคำขอเรียบร้อย");
      setForm({
        amountCoins: "",
        bankName: "",
        bankAccount: "",
        bankAccountName: "",
      });
      await load();
    } catch (e) {
      console.error(e);
      setError("เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  }

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
        <Banknote className="h-16 w-16 text-rosegold/20" />
        <h2 className="text-xl font-bold text-brand-black">กรุณาเข้าสู่ระบบ</h2>
        <Link
          href="/auth/login"
          className="rounded-full bg-rosegold-dark px-6 py-2 text-sm font-medium text-white hover:bg-rosegold"
        >
          เข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  const pendingTotal = requests
    .filter((r) => r.status === "PENDING")
    .reduce((s, r) => s + r.amountCoins, 0);

  return (
    <div className="min-h-screen bg-cream/20">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/write/analytics"
          className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-rosegold-dark"
        >
          <ArrowLeft className="h-3 w-3" /> กลับไปสถิตินักเขียน
        </Link>
        <h1 className="mb-1 text-2xl font-bold text-brand-black">ถอนเงิน</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          ขอรับเงินจากรายได้ของคุณเข้าบัญชีธนาคาร
        </p>

        {/* Balance card */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-rosegold-dark to-rosegold p-8 text-white shadow-lg">
          <div className="flex items-center gap-3 text-white/80">
            <Coins className="h-6 w-6" />
            <span className="text-sm font-medium">ยอดเหรียญที่ถอนได้</span>
          </div>
          <p className="mt-2 text-4xl font-bold">
            {balance.toLocaleString("th-TH")}
            <span className="ml-2 text-lg font-normal text-white/70">
              เหรียญ
            </span>
          </p>
          <p className="mt-1 text-sm text-white/70">
            ประมาณ {balance.toLocaleString("th-TH")} บาท (1 เหรียญ = 1 บาท)
          </p>
          {pendingTotal > 0 && (
            <p className="mt-3 text-xs text-white/80">
              มีคำขอที่รอดำเนินการ {pendingTotal.toLocaleString("th-TH")} เหรียญ
            </p>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Form */}
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-brand-black">
              <Banknote className="h-5 w-5 text-rosegold-dark" />
              สร้างคำขอถอนเงิน
            </h2>
            <form
              onSubmit={handleSubmit}
              className="space-y-4 rounded-xl border border-border bg-white p-5"
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-brand-black">
                  จำนวนเหรียญ (ขั้นต่ำ {minPayout})
                </label>
                <input
                  type="number"
                  min={minPayout}
                  step={1}
                  value={form.amountCoins}
                  onChange={(e) =>
                    setForm({ ...form, amountCoins: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-cream/30 px-3 py-2 text-sm text-brand-black focus:border-rosegold focus:outline-none"
                  placeholder="500"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-brand-black">
                  ธนาคาร
                </label>
                <input
                  type="text"
                  value={form.bankName}
                  onChange={(e) =>
                    setForm({ ...form, bankName: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-cream/30 px-3 py-2 text-sm text-brand-black focus:border-rosegold focus:outline-none"
                  placeholder="ไทยพาณิชย์"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-brand-black">
                  เลขบัญชี
                </label>
                <input
                  type="text"
                  value={form.bankAccount}
                  onChange={(e) =>
                    setForm({ ...form, bankAccount: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-cream/30 px-3 py-2 text-sm text-brand-black focus:border-rosegold focus:outline-none"
                  placeholder="123-4-56789-0"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-brand-black">
                  ชื่อเจ้าของบัญชี
                </label>
                <input
                  type="text"
                  value={form.bankAccountName}
                  onChange={(e) =>
                    setForm({ ...form, bankAccountName: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-cream/30 px-3 py-2 text-sm text-brand-black focus:border-rosegold focus:outline-none"
                  placeholder="นามสกุล ชื่อ"
                  required
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 p-2 text-xs text-red-600">
                  {error}
                </p>
              )}
              {message && (
                <p className="rounded-lg bg-green-50 p-2 text-xs text-green-700">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-rosegold-dark px-4 py-2 text-sm font-medium text-white hover:bg-rosegold disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                ส่งคำขอ
              </button>

              <p className="text-[11px] text-muted-foreground">
                หมายเหตุ: เหรียญจะถูกหักจากยอดทันทีที่ส่งคำขอ
                หากถูกปฏิเสธระบบจะคืนเหรียญให้อัตโนมัติ
              </p>
            </form>
          </div>

          {/* History */}
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-brand-black">
              <Clock className="h-5 w-5 text-rosegold-dark" />
              ประวัติการถอนเงิน
            </h2>
            <div className="space-y-3">
              {requests.length === 0 ? (
                <div className="rounded-xl border border-border bg-white p-8 text-center text-sm text-muted-foreground">
                  ยังไม่มีคำขอถอนเงิน
                </div>
              ) : (
                requests.map((r) => {
                  const meta = statusMeta[r.status] ?? statusMeta.PENDING;
                  const Icon = meta.icon;
                  return (
                    <div
                      key={r.id}
                      className="rounded-xl border border-border bg-white p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-brand-black">
                            {r.amountCoins.toLocaleString("th-TH")} เหรียญ
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {r.bankName} · {r.bankAccount}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatDate(r.requestedAt)}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${meta.bg} ${meta.text}`}
                        >
                          <Icon className="h-3 w-3" />
                          {meta.label}
                        </span>
                      </div>
                      {r.adminNote && (
                        <p className="mt-2 rounded bg-cream/40 p-2 text-xs text-muted-foreground">
                          {r.adminNote}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
