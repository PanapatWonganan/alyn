"use client";

import { useEffect, useState } from "react";
import {
  Banknote,
  Loader2,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

interface PayoutRequest {
  id: string;
  amountCoins: number;
  amountThb: number;
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
  status: string;
  adminNote: string | null;
  requestedAt: string;
  processedAt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    penName: string | null;
    avatar: string | null;
    coinBalance: number;
  };
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

export default function AdminPayoutsPage() {
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [actingId, setActingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      const res = await fetch(`/api/admin/payouts?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setRequests(data.data || []);
    } catch (e) {
      console.error(e);
      alert("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function handleAction(id: string, action: "approve" | "reject") {
    const adminNote =
      action === "reject"
        ? prompt("เหตุผลการปฏิเสธ (ไม่บังคับ)") || undefined
        : prompt("หมายเหตุ (ไม่บังคับ)") || undefined;

    if (
      !confirm(
        action === "approve"
          ? "ยืนยันอนุมัติคำขอถอนเงินนี้?"
          : "ยืนยันปฏิเสธคำขอถอนเงินนี้? ระบบจะคืนเหรียญให้ผู้ใช้"
      )
    ) {
      return;
    }

    setActingId(id);
    try {
      const res = await fetch(`/api/admin/payouts/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNote }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "เกิดข้อผิดพลาด");
        return;
      }
      await load();
    } catch (e) {
      console.error(e);
      alert("เกิดข้อผิดพลาด");
    } finally {
      setActingId(null);
    }
  }

  const statusOptions = [
    { value: "PENDING", label: "รอดำเนินการ" },
    { value: "APPROVED", label: "อนุมัติแล้ว" },
    { value: "PAID", label: "จ่ายแล้ว" },
    { value: "REJECTED", label: "ถูกปฏิเสธ" },
    { value: "", label: "ทั้งหมด" },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="mb-1 text-2xl font-bold text-brand-black">
            การจ่ายเงินให้นักเขียน
          </h1>
          <p className="text-sm text-muted-foreground">
            จัดการคำขอถอนเงินของนักเขียน
          </p>
        </div>

        {/* Status filter */}
        <div className="mb-6 rounded-lg border border-border bg-white p-4">
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  statusFilter === opt.value
                    ? "bg-rosegold-dark text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-rosegold-dark" />
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-lg border border-border bg-white p-12 text-center">
            <Banknote className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p className="text-muted-foreground">ไม่พบคำขอถอนเงิน</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((r) => {
              const meta = statusMeta[r.status] ?? statusMeta.PENDING;
              const Icon = meta.icon;
              return (
                <div
                  key={r.id}
                  className="rounded-lg border border-border bg-white p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-1 items-start gap-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200">
                        {r.user.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={r.user.avatar}
                            alt={r.user.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-brand-black">
                            {r.user.penName || r.user.name}
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.bg} ${meta.text}`}
                          >
                            <Icon className="h-3 w-3" />
                            {meta.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {r.user.email}
                        </p>
                        <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                          <div>
                            <p className="text-[11px] text-muted-foreground">
                              จำนวน
                            </p>
                            <p className="font-semibold text-brand-black">
                              {r.amountCoins.toLocaleString("th-TH")} เหรียญ (~
                              {r.amountThb.toLocaleString("th-TH")} บาท)
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-muted-foreground">
                              ธนาคาร
                            </p>
                            <p className="text-brand-black">
                              {r.bankName} · {r.bankAccount}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {r.bankAccountName}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-muted-foreground">
                              ยื่นเมื่อ
                            </p>
                            <p className="text-brand-black">
                              {new Date(r.requestedAt).toLocaleString("th-TH")}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-muted-foreground">
                              ยอดเหรียญคงเหลือของผู้ใช้
                            </p>
                            <p className="text-brand-black">
                              {r.user.coinBalance.toLocaleString("th-TH")}{" "}
                              เหรียญ
                            </p>
                          </div>
                        </div>
                        {r.adminNote && (
                          <p className="mt-3 rounded bg-cream/60 p-2 text-xs text-muted-foreground">
                            หมายเหตุ: {r.adminNote}
                          </p>
                        )}
                      </div>
                    </div>

                    {r.status === "PENDING" && (
                      <div className="flex gap-2 sm:flex-col">
                        <button
                          onClick={() => handleAction(r.id, "approve")}
                          disabled={actingId === r.id}
                          className="inline-flex items-center justify-center gap-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          อนุมัติ
                        </button>
                        <button
                          onClick={() => handleAction(r.id, "reject")}
                          disabled={actingId === r.id}
                          className="inline-flex items-center justify-center gap-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" />
                          ปฏิเสธ
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
