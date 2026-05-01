"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  MessageSquare,
  Coins,
  Banknote,
  Settings,
  Menu,
  X,
  Flag,
} from "lucide-react";
import { useState } from "react";

const navigation = [
  { name: "ภาพรวม", href: "/admin", icon: LayoutDashboard },
  { name: "จัดการผู้ใช้", href: "/admin/users", icon: Users },
  { name: "จัดการนิยาย", href: "/admin/novels", icon: BookOpen },
  { name: "คอมเมนต์", href: "/admin/comments", icon: MessageSquare },
  { name: "รายงานเนื้อหา", href: "/admin/reports", icon: Flag },
  { name: "ธุรกรรม", href: "/admin/transactions", icon: Coins },
  { name: "การจ่ายเงิน", href: "/admin/payouts", icon: Banknote },
  { name: "ตั้งค่า", href: "/admin/settings", icon: Settings },
];

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-cream">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-brand-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-border transition-transform duration-300 ease-in-out z-50 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Admin Header */}
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-bold text-rosegold-dark">
              Admin Panel
            </h2>
            <p className="text-sm text-muted-foreground mt-1">อลิน</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-rosegold-dark text-white"
                      : "text-brand-black hover:bg-cream"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          {session?.user && (
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rosegold-dark text-white flex items-center justify-center font-semibold">
                  {session.user.name?.charAt(0).toUpperCase() || "A"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-black truncate">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {session.user.email}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <div className="sticky top-16 bg-white border-b border-border z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 text-brand-black hover:bg-cream rounded-lg"
              >
                {sidebarOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
              <h1 className="text-lg font-semibold text-brand-black">
                {navigation.find((item) => item.href === pathname)?.name ||
                  "Admin Panel"}
              </h1>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
