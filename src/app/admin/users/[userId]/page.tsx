"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  Shield,
  PenTool,
  BookOpen,
  Loader2,
  ChevronLeft,
  Save,
  Coins,
  MessageSquare,
  Bookmark,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from "lucide-react";

type UserRole = "READER" | "WRITER" | "ADMIN";

type NovelData = {
  id: string;
  title: string;
  status: string;
  viewCount: number;
  createdAt: string;
};

type CommentData = {
  id: string;
  content: string;
  createdAt: string;
  chapter: {
    title: string;
    novel: {
      title: string;
    };
  };
};

type TransactionData = {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
};

type UserDetailData = {
  id: string;
  email: string;
  name: string;
  penName: string | null;
  avatar: string | null;
  bio: string | null;
  role: UserRole;
  coinBalance: number;
  createdAt: string;
  updatedAt: string;
  novels: NovelData[];
  comments: CommentData[];
  transactions: TransactionData[];
  _count: {
    novels: number;
    comments: number;
    bookmarks: number;
    transactions: number;
  };
};

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);
  const [user, setUser] = useState<UserDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("READER");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchUser = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }

      const data = await response.json();
      setUser(data.user);
      setSelectedRole(data.user.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const handleSaveRole = async () => {
    if (!user) return;

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: selectedRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update user");
      }

      const data = await response.json();
      setUser(data.user);
      setSuccessMessage("บันทึกข้อมูลสำเร็จ");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadgeClass = (role: UserRole) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-700";
      case "WRITER":
        return "bg-rosegold-dark/10 text-rosegold-dark";
      case "READER":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "ADMIN":
        return <Shield className="w-4 h-4" />;
      case "WRITER":
        return <PenTool className="w-4 h-4" />;
      case "READER":
        return <BookOpen className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case "ADMIN":
        return "ผู้ดูแลระบบ";
      case "WRITER":
        return "นักเขียน";
      case "READER":
        return "ผู้อ่าน";
      default:
        return role;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "ONGOING":
        return "bg-green-100 text-green-700";
      case "COMPLETED":
        return "bg-blue-100 text-blue-700";
      case "HIATUS":
        return "bg-yellow-100 text-yellow-700";
      case "DRAFT":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ONGOING":
        return "กำลังเขียน";
      case "COMPLETED":
        return "จบแล้ว";
      case "HIATUS":
        return "พักเขียน";
      case "DRAFT":
        return "แบบร่าง";
      default:
        return status;
    }
  };

  const getTransactionIcon = (type: string) => {
    if (type === "TOPUP" || type === "EARNING" || type === "DONATION_RECEIVED") {
      return <ArrowDownRight className="w-4 h-4 text-green-600" />;
    }
    return <ArrowUpRight className="w-4 h-4 text-red-600" />;
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case "TOPUP":
        return "เติมเหรียญ";
      case "PURCHASE":
        return "ซื้อตอน";
      case "EARNING":
        return "รายได้";
      case "DONATION_SENT":
        return "ส่งของขวัญ";
      case "DONATION_RECEIVED":
        return "ได้รับของขวัญ";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-rosegold-dark" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || "ไม่พบข้อมูลผู้ใช้"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-brand-black mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          กลับไปรายการผู้ใช้งาน
        </Link>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* User Profile Card */}
        <div className="bg-white rounded-lg border border-border p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-rosegold-dark/10 flex items-center justify-center flex-shrink-0">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-rosegold-dark" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-brand-black mb-1">
                    {user.name}
                  </h1>
                  <p className="text-muted-foreground mb-2">{user.email}</p>
                  {user.penName && (
                    <p className="text-sm text-muted-foreground">
                      ปากกา: {user.penName}
                    </p>
                  )}
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeClass(
                    user.role
                  )}`}
                >
                  {getRoleIcon(user.role)}
                  {getRoleLabel(user.role)}
                </span>
              </div>
              {user.bio && (
                <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                  {user.bio}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  สมัครเมื่อ {new Date(user.createdAt).toLocaleDateString("th-TH")}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Role Change Section */}
        <div className="bg-white rounded-lg border border-border p-6 mb-6">
          <h2 className="text-lg font-semibold text-brand-black mb-4">
            เปลี่ยนสิทธิ์ผู้ใช้งาน
          </h2>
          <div className="flex items-center gap-4">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="flex-1 max-w-xs px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-rosegold-dark"
            >
              <option value="READER">ผู้อ่าน (READER)</option>
              <option value="WRITER">นักเขียน (WRITER)</option>
              <option value="ADMIN">ผู้ดูแลระบบ (ADMIN)</option>
            </select>
            <button
              onClick={handleSaveRole}
              disabled={saving || selectedRole === user.role}
              className="px-6 py-2 bg-rosegold-dark text-white rounded-lg hover:bg-rosegold-dark/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              บันทึก
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-brand-black">
                  {user._count.novels}
                </div>
                <div className="text-sm text-muted-foreground">นิยาย</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-brand-black">
                  {user._count.comments}
                </div>
                <div className="text-sm text-muted-foreground">ความคิดเห็น</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Coins className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-brand-black">
                  {user.coinBalance.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">เหรียญ</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Bookmark className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-brand-black">
                  {user._count.bookmarks}
                </div>
                <div className="text-sm text-muted-foreground">คั่นหน้า</div>
              </div>
            </div>
          </div>
        </div>

        {/* User's Novels */}
        {user.novels.length > 0 && (
          <div className="bg-white rounded-lg border border-border p-6 mb-6">
            <h2 className="text-lg font-semibold text-brand-black mb-4">
              นิยายของผู้ใช้ ({user.novels.length})
            </h2>
            <div className="space-y-3">
              {user.novels.map((novel) => (
                <div
                  key={novel.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-brand-black mb-1">
                      {novel.title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeClass(
                          novel.status
                        )}`}
                      >
                        {getStatusLabel(novel.status)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {novel.viewCount.toLocaleString()} ครั้ง
                      </span>
                      <span>
                        {new Date(novel.createdAt).toLocaleDateString("th-TH")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        {user.transactions.length > 0 && (
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-brand-black mb-4">
              ประวัติการทำรายการล่าสุด ({user._count.transactions})
            </h2>
            <div className="space-y-2">
              {user.transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <div className="font-medium text-brand-black text-sm">
                        {getTransactionLabel(transaction.type)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {transaction.description}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-semibold ${
                        transaction.type === "TOPUP" ||
                        transaction.type === "EARNING" ||
                        transaction.type === "DONATION_RECEIVED"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.type === "TOPUP" ||
                      transaction.type === "EARNING" ||
                      transaction.type === "DONATION_RECEIVED"
                        ? "+"
                        : "-"}
                      {Math.abs(transaction.amount).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(transaction.createdAt).toLocaleDateString(
                        "th-TH"
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
