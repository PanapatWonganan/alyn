"use client";

import { useState, useEffect } from "react";
import {
  Coins,
  TrendingUp,
  ShoppingCart,
  Gift,
  Loader2,
  User,
} from "lucide-react";

interface Transaction {
  id: string;
  type:
    | "TOPUP"
    | "PURCHASE"
    | "EARNING"
    | "DONATION_SENT"
    | "DONATION_RECEIVED";
  amount: number;
  description: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    penName: string | null;
    email: string;
    avatar: string | null;
  };
}

interface ApiResponse {
  data: Transaction[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: {
    totalTopups: number;
    totalPurchases: number;
    totalDonations: number;
    totalEarnings: number;
  };
}

const transactionTypeConfig = {
  TOPUP: {
    label: "เติมเหรียญ",
    bgClass: "bg-green-100",
    textClass: "text-green-700",
    icon: Coins,
  },
  PURCHASE: {
    label: "ซื้อตอน",
    bgClass: "bg-blue-100",
    textClass: "text-blue-700",
    icon: ShoppingCart,
  },
  EARNING: {
    label: "รายได้",
    bgClass: "bg-yellow-100",
    textClass: "text-yellow-700",
    icon: TrendingUp,
  },
  DONATION_SENT: {
    label: "ส่งของขวัญ",
    bgClass: "bg-orange-100",
    textClass: "text-orange-700",
    icon: Gift,
  },
  DONATION_RECEIVED: {
    label: "ได้รับของขวัญ",
    bgClass: "bg-purple-100",
    textClass: "text-purple-700",
    icon: Gift,
  },
};

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({
    totalTopups: 0,
    totalPurchases: 0,
    totalDonations: 0,
    totalEarnings: 0,
  });

  useEffect(() => {
    fetchTransactions();
  }, [type, page]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (type) params.append("type", type);

      const response = await fetch(`/api/admin/transactions?${params}`);
      if (!response.ok) throw new Error("Failed to fetch transactions");

      const data: ApiResponse = await response.json();
      setTransactions(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
      setSummary(data.summary);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      alert("เกิดข้อผิดพลาดในการโหลดข้อมูลธุรกรรม");
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (value: string) => {
    setType(value);
    setPage(1);
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-black mb-2">
            ธุรกรรมเหรียญ
          </h1>
          <p className="text-muted-foreground">ทั้งหมด {total} รายการ</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-sm p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-100">เติมเหรียญทั้งหมด</span>
              <Coins className="w-6 h-6 text-green-100" />
            </div>
            <div className="text-3xl font-bold">
              {formatAmount(summary.totalTopups)}
            </div>
            <div className="text-sm text-green-100 mt-1">เหรียญ</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-100">ซื้อตอนทั้งหมด</span>
              <ShoppingCart className="w-6 h-6 text-blue-100" />
            </div>
            <div className="text-3xl font-bold">
              {formatAmount(summary.totalPurchases)}
            </div>
            <div className="text-sm text-blue-100 mt-1">เหรียญ</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-sm p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-100">ของขวัญทั้งหมด</span>
              <Gift className="w-6 h-6 text-purple-100" />
            </div>
            <div className="text-3xl font-bold">
              {formatAmount(summary.totalDonations)}
            </div>
            <div className="text-sm text-purple-100 mt-1">เหรียญ</div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-sm p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-yellow-100">รายได้นักเขียน</span>
              <TrendingUp className="w-6 h-6 text-yellow-100" />
            </div>
            <div className="text-3xl font-bold">
              {formatAmount(summary.totalEarnings)}
            </div>
            <div className="text-sm text-yellow-100 mt-1">เหรียญ</div>
          </div>
        </div>

        {/* Type Filter */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleTypeChange("")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                type === ""
                  ? "bg-rosegold-dark text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              ทั้งหมด
            </button>
            {Object.entries(transactionTypeConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => handleTypeChange(key)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  type === key
                    ? "bg-rosegold-dark text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {config.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-rosegold-dark" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Coins className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-muted-foreground text-lg">ไม่พบธุรกรรม</p>
          </div>
        ) : (
          <>
            {/* Transactions Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-border">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-brand-black">
                        ผู้ใช้
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-brand-black">
                        ประเภท
                      </th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-brand-black">
                        จำนวน
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-brand-black">
                        รายละเอียด
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-brand-black">
                        วันที่
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {transactions.map((transaction) => {
                      const config = transactionTypeConfig[transaction.type];
                      const IconComponent = config.icon;
                      const isPositive = transaction.amount > 0;

                      return (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                                {transaction.user.avatar ? (
                                  <img
                                    src={transaction.user.avatar}
                                    alt={transaction.user.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-brand-black">
                                  {transaction.user.penName ||
                                    transaction.user.name}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {transaction.user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${config.bgClass} ${config.textClass}`}
                            >
                              <IconComponent className="w-3 h-3" />
                              {config.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span
                              className={`font-semibold ${
                                isPositive
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {isPositive ? "+" : ""}
                              {formatAmount(transaction.amount)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-muted-foreground max-w-md truncate">
                              {transaction.description}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-muted-foreground whitespace-nowrap">
                              {new Date(
                                transaction.createdAt
                              ).toLocaleDateString("th-TH", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  ก่อนหน้า
                </button>
                <span className="px-4 py-2 text-brand-black">
                  หน้า {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  ถัดไป
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
