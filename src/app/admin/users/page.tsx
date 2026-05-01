"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  Search,
  Shield,
  PenTool,
  BookOpen,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Ban,
  CheckCircle2,
} from "lucide-react";

type UserRole = "READER" | "WRITER" | "ADMIN";

type UserData = {
  id: string;
  email: string;
  name: string;
  penName: string | null;
  avatar: string | null;
  role: UserRole;
  isBanned: boolean;
  coinBalance: number;
  createdAt: string;
  _count: {
    novels: number;
    comments: number;
    bookmarks: number;
  };
};

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (roleFilter) params.append("role", roleFilter);
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, pagination.page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleRoleFilter = (role: string) => {
    setRoleFilter(role);
    setPagination((prev) => ({ ...prev, page: 1 }));
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

  const handleToggleBan = async (user: UserData) => {
    const action = user.isBanned ? "unban" : "ban";
    const label = user.isBanned ? "ยกเลิกการแบน" : "แบน";
    if (
      !window.confirm(
        `ยืนยัน${label}ผู้ใช้ ${user.penName || user.name}?`
      )
    ) {
      return;
    }
    try {
      const response = await fetch(`/api/admin/users/${user.id}/${action}`, {
        method: "POST",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed");
      }
      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
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

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-black mb-2">
            จัดการผู้ใช้งาน
          </h1>
          <p className="text-muted-foreground">
            จัดการข้อมูลและสิทธิ์ของผู้ใช้งานในระบบ
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg border border-border p-6 mb-6">
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="ค้นหาด้วยชื่อหรืออีเมล..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-rosegold-dark"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-rosegold-dark text-white rounded-lg hover:bg-rosegold-dark/90 transition-colors"
              >
                ค้นหา
              </button>
            </div>
          </form>

          {/* Role Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleRoleFilter("")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                roleFilter === ""
                  ? "bg-rosegold-dark text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => handleRoleFilter("READER")}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                roleFilter === "READER"
                  ? "bg-blue-600 text-white"
                  : "bg-blue-100 text-blue-700 hover:bg-blue-200"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              ผู้อ่าน
            </button>
            <button
              onClick={() => handleRoleFilter("WRITER")}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                roleFilter === "WRITER"
                  ? "bg-rosegold-dark text-white"
                  : "bg-rosegold-dark/10 text-rosegold-dark hover:bg-rosegold-dark/20"
              }`}
            >
              <PenTool className="w-4 h-4" />
              นักเขียน
            </button>
            <button
              onClick={() => handleRoleFilter("ADMIN")}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                roleFilter === "ADMIN"
                  ? "bg-purple-600 text-white"
                  : "bg-purple-100 text-purple-700 hover:bg-purple-200"
              }`}
            >
              <Shield className="w-4 h-4" />
              ผู้ดูแลระบบ
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-rosegold-dark" />
          </div>
        ) : (
          <>
            {/* User Table */}
            <div className="bg-white rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ผู้ใช้งาน
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        สิทธิ์
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        นิยาย
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        เหรียญ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        วันที่สมัคร
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        การจัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <User className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                          <p className="text-gray-500">ไม่พบผู้ใช้งาน</p>
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr
                          key={user.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-rosegold-dark/10 flex items-center justify-center flex-shrink-0">
                                {user.avatar ? (
                                  <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <User className="w-5 h-5 text-rosegold-dark" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-brand-black">
                                  {user.name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeClass(
                                  user.role
                                )}`}
                              >
                                {getRoleIcon(user.role)}
                                {getRoleLabel(user.role)}
                              </span>
                              {user.isBanned && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                  <Ban className="w-3 h-3" />
                                  ถูกแบน
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {user._count.novels}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {user.coinBalance.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString(
                              "th-TH"
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-3">
                              {user.role !== "ADMIN" && (
                                <button
                                  onClick={() => handleToggleBan(user)}
                                  className={`inline-flex items-center gap-1 text-sm font-medium ${
                                    user.isBanned
                                      ? "text-green-600 hover:text-green-700"
                                      : "text-red-600 hover:text-red-700"
                                  }`}
                                  title={user.isBanned ? "ยกเลิกการแบน" : "แบนผู้ใช้"}
                                >
                                  {user.isBanned ? (
                                    <>
                                      <CheckCircle2 className="w-4 h-4" />
                                      ยกเลิกแบน
                                    </>
                                  ) : (
                                    <>
                                      <Ban className="w-4 h-4" />
                                      แบน
                                    </>
                                  )}
                                </button>
                              )}
                              <Link
                                href={`/admin/users/${user.id}`}
                                className="text-rosegold-dark hover:text-rosegold-dark/80 font-medium text-sm"
                              >
                                ดูรายละเอียด
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  แสดง {(pagination.page - 1) * pagination.limit + 1} ถึง{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  จาก {pagination.total} รายการ
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page - 1,
                      }))
                    }
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    ก่อนหน้า
                  </button>
                  <div className="flex items-center gap-2">
                    {Array.from(
                      { length: pagination.totalPages },
                      (_, i) => i + 1
                    )
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === pagination.totalPages ||
                          Math.abs(p - pagination.page) <= 2
                      )
                      .map((p, i, arr) => {
                        if (i > 0 && p - arr[i - 1] > 1) {
                          return (
                            <span key={`ellipsis-${p}`} className="px-2">
                              ...
                            </span>
                          );
                        }
                        return (
                          <button
                            key={p}
                            onClick={() =>
                              setPagination((prev) => ({ ...prev, page: p }))
                            }
                            className={`px-4 py-2 rounded-lg transition-colors ${
                              p === pagination.page
                                ? "bg-rosegold-dark text-white"
                                : "border border-border hover:bg-gray-50"
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                  </div>
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page + 1,
                      }))
                    }
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    ถัดไป
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
