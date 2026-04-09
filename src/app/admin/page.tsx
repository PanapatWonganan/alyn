"use client";

import { useEffect, useState } from "react";
import {
  Users,
  BookOpen,
  FileText,
  Coins,
  MessageSquare,
  Heart,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  totalNovels: number;
  totalChapters: number;
  totalCoins: number;
  totalComments: number;
  totalDonations: number;
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }>;
  recentNovels: Array<{
    id: string;
    title: string;
    author: string;
    status: string;
    createdAt: string;
  }>;
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    description: string;
    createdAt: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rosegold-dark mx-auto"></div>
          <p className="mt-4 text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-600">เกิดข้อผิดพลาด: {error}</p>
          <button
            onClick={fetchStats}
            className="mt-4 px-4 py-2 bg-rosegold-dark text-white rounded-lg hover:bg-rosegold"
          >
            ลองอีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: "ผู้ใช้ทั้งหมด",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "นิยายทั้งหมด",
      value: stats.totalNovels.toLocaleString(),
      icon: BookOpen,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "ตอนทั้งหมด",
      value: stats.totalChapters.toLocaleString(),
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "เหรียญในระบบ",
      value: stats.totalCoins.toLocaleString(),
      icon: Coins,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "คอมเมนต์",
      value: stats.totalComments.toLocaleString(),
      icon: MessageSquare,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "ยอดโดเนท",
      value: stats.totalDonations.toLocaleString(),
      icon: Heart,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      DRAFT: { label: "แบบร่าง", className: "bg-gray-100 text-gray-800" },
      ONGOING: { label: "กำลังเขียน", className: "bg-blue-100 text-blue-800" },
      COMPLETED: {
        label: "จบแล้ว",
        className: "bg-green-100 text-green-800",
      },
      HIATUS: { label: "พักเขียน", className: "bg-yellow-100 text-yellow-800" },
    };
    const badge = statusMap[status] || { label: status, className: "" };
    return (
      <span
        className={`px-2 py-1 text-xs rounded-full ${badge.className}`}
      >
        {badge.label}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string; className: string }> = {
      READER: { label: "ผู้อ่าน", className: "bg-blue-100 text-blue-800" },
      WRITER: { label: "นักเขียน", className: "bg-purple-100 text-purple-800" },
      ADMIN: { label: "แอดมิน", className: "bg-red-100 text-red-800" },
    };
    const badge = roleMap[role] || { label: role, className: "" };
    return (
      <span
        className={`px-2 py-1 text-xs rounded-full ${badge.className}`}
      >
        {badge.label}
      </span>
    );
  };

  const getTransactionTypeBadge = (type: string) => {
    const typeMap: Record<string, { label: string; className: string }> = {
      TOPUP: { label: "เติมเงิน", className: "bg-green-100 text-green-800" },
      PURCHASE: { label: "ซื้อตอน", className: "bg-blue-100 text-blue-800" },
      EARNING: { label: "รายได้", className: "bg-purple-100 text-purple-800" },
      DONATION_SENT: {
        label: "โดเนทออก",
        className: "bg-pink-100 text-pink-800",
      },
      DONATION_RECEIVED: {
        label: "รับโดเนท",
        className: "bg-yellow-100 text-yellow-800",
      },
    };
    const badge = typeMap[type] || { label: type, className: "" };
    return (
      <span
        className={`px-2 py-1 text-xs rounded-full ${badge.className}`}
      >
        {badge.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-lg border border-border p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-3xl font-bold text-brand-black mt-2">
                    {card.value}
                  </p>
                </div>
                <div className={`${card.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-brand-black mb-4">
            ผู้ใช้ล่าสุด
          </h3>
          <div className="space-y-3">
            {stats.recentUsers.length > 0 ? (
              stats.recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-cream rounded-lg"
                >
                  <div>
                    <p className="font-medium text-brand-black">{user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <div className="text-right">
                    {getRoleBadge(user.role)}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(user.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                ยังไม่มีข้อมูล
              </p>
            )}
          </div>
        </div>

        {/* Recent Novels */}
        <div className="bg-white rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-brand-black mb-4">
            นิยายล่าสุด
          </h3>
          <div className="space-y-3">
            {stats.recentNovels.length > 0 ? (
              stats.recentNovels.map((novel) => (
                <div
                  key={novel.id}
                  className="flex items-center justify-between p-3 bg-cream rounded-lg"
                >
                  <div>
                    <p className="font-medium text-brand-black">
                      {novel.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      โดย {novel.author}
                    </p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(novel.status)}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(novel.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                ยังไม่มีข้อมูล
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-brand-black mb-4">
          ธุรกรรมล่าสุด
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-semibold text-brand-black">
                  ประเภท
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-brand-black">
                  รายละเอียด
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-brand-black">
                  จำนวน
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-brand-black">
                  วันที่
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.recentTransactions.length > 0 ? (
                stats.recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-border">
                    <td className="py-3 px-4">
                      {getTransactionTypeBadge(transaction.type)}
                    </td>
                    <td className="py-3 px-4 text-sm text-brand-black">
                      {transaction.description}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-brand-black">
                      {transaction.amount.toLocaleString()} เหรียญ
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-muted-foreground">
                      {formatDate(transaction.createdAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="py-4 text-center text-sm text-muted-foreground"
                  >
                    ยังไม่มีข้อมูล
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
