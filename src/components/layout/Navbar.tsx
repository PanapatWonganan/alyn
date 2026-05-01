"use client";

import {
  Search,
  BookOpen,
  PenTool,
  Library,
  Trophy,
  Coins,
  User,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Loader2,
  Bell,
  MessageSquare,
  Gift,
  Shield,
  Settings,
  Compass,
  Sun,
  Moon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatRelativeTime } from "@/lib/utils";
import { useTheme } from "@/lib/theme";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Notification {
  id: string;
  type: "NEW_CHAPTER" | "COMMENT" | "DONATION" | "SYSTEM";
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

export default function Navbar() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [liveCoinBalance, setLiveCoinBalance] = useState<number | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const _notificationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { data: session } = useSession();
  const { resolvedTheme, toggleTheme, mounted: themeMounted } = useTheme();

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close notification dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setNotificationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(searchQuery.trim())}&limit=5`
        );
        const data = await res.json();
        setSearchResults(data.novels || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    if (!session?.user) return;

    const fetchNotifs = async () => {
      try {
        setNotificationsLoading(true);
        const res = await fetch("/api/notifications?limit=10");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setNotificationsLoading(false);
      }
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  // Fetch live coin balance from DB. The JWT session only has the balance
  // that was snapshot at login — after top-ups, chapter purchases, or
  // donations we need the fresh value. Refresh on mount, on tab visibility
  // change, and on window focus so the navbar number is never stale.
  useEffect(() => {
    if (!session?.user) {
      setLiveCoinBalance(null);
      return;
    }

    let cancelled = false;
    async function fetchBalance() {
      try {
        const res = await fetch("/api/users/me", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const balance = data.user?.coinBalance;
        if (typeof balance === "number") {
          setLiveCoinBalance(balance);
        }
      } catch (error) {
        console.error("Failed to fetch coin balance:", error);
      }
    }

    fetchBalance();

    function onVisibility() {
      if (document.visibilityState === "visible") fetchBalance();
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", fetchBalance);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", fetchBalance);
    };
  }, [session?.user?.id]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    setNotificationOpen(false);
    router.push(notification.link);
  };

  // Get notification icon
  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "NEW_CHAPTER":
        return BookOpen;
      case "COMMENT":
        return MessageSquare;
      case "DONATION":
        return Gift;
      case "SYSTEM":
        return Bell;
      default:
        return Bell;
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchOpen(false);
      setSearchQuery("");
      router.push(`/ranking?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLinks = [
    { href: "/", label: "หน้าแรก", icon: BookOpen },
    { href: "/explore", label: "สำรวจ", icon: Compass },
    { href: "/ranking", label: "อันดับ", icon: Trophy },
    { href: "/library", label: "ชั้นหนังสือ", icon: Library },
    { href: "/write", label: "เขียน", icon: PenTool },
  ];

  const userRole = (session?.user as unknown as Record<string, unknown>)?.role as string | undefined;
  const sessionCoinBalance = (session?.user as unknown as Record<string, unknown>)?.coinBalance as number | undefined;
  // Prefer the freshly fetched balance over the JWT snapshot.
  const userCoinBalance = liveCoinBalance ?? sessionCoinBalance;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo/Logo_Primary.svg"
            alt="Alyn"
            width={120}
            height={40}
            className="h-9 w-auto"
            style={{ width: "auto" }}
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-brand-black/70 transition-colors hover:bg-cream hover:text-rosegold-dark"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={resolvedTheme === "dark" ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"}
            className="rounded-full p-2.5 text-brand-black/60 transition-colors hover:bg-cream hover:text-rosegold-dark"
          >
            {themeMounted && resolvedTheme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          {/* Search */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="rounded-full p-2.5 text-brand-black/60 transition-colors hover:bg-cream hover:text-rosegold-dark"
          >
            <Search className="h-5 w-5" />
          </button>

          {session?.user ? (
            <>
              {/* Notification bell */}
              <div ref={notificationRef} className="relative hidden sm:block">
                <button
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  className="relative rounded-full p-2.5 text-brand-black/60 transition-colors hover:bg-cream hover:text-rosegold-dark"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {notificationOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-background shadow-lg">
                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                      <h3 className="text-sm font-semibold text-brand-black">
                        การแจ้งเตือน
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs font-medium text-rosegold-dark hover:text-rosegold"
                        >
                          อ่านทั้งหมด
                        </button>
                      )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                      {notificationsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-5 w-5 animate-spin text-rosegold-dark" />
                        </div>
                      ) : notifications.length > 0 ? (
                        <div className="py-1">
                          {notifications.map((notification) => {
                            const Icon = getNotificationIcon(notification.type);
                            return (
                              <button
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-cream/50 ${
                                  !notification.isRead ? "bg-cream/30" : ""
                                }`}
                              >
                                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rosegold-light">
                                  <Icon className="h-4 w-4 text-rosegold-dark" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-medium text-brand-black">
                                      {notification.title}
                                    </p>
                                    {!notification.isRead && (
                                      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rosegold-dark" />
                                    )}
                                  </div>
                                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                    {notification.message}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {formatRelativeTime(notification.createdAt)}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                          ไม่มีแจ้งเตือน
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Coin balance */}
              <Link
                href="/wallet"
                className="hidden sm:flex items-center gap-1.5 rounded-full bg-coin-light px-3 py-1.5 text-sm font-semibold text-coin transition-colors hover:bg-coin/10"
              >
                <Coins className="h-4 w-4" />
                <span>{(userCoinBalance ?? 0).toLocaleString("th-TH")}</span>
              </Link>

              {/* Profile dropdown */}
              <div ref={profileRef} className="relative hidden sm:block">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 rounded-full bg-cream px-3 py-1.5 text-sm font-medium text-brand-black transition-colors hover:bg-cream-dark"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rosegold-dark text-xs font-bold text-white">
                    {session.user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[100px] truncate">
                    {session.user.name}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-background py-2 shadow-lg">
                    <div className="border-b border-border px-4 py-2">
                      <p className="text-sm font-medium text-brand-black">
                        {session.user.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.user.email}
                      </p>
                      <span className="mt-1 inline-block rounded-full bg-cream px-2 py-0.5 text-xs font-medium text-rosegold-dark">
                        {userRole === "ADMIN"
                          ? "แอดมิน"
                          : userRole === "WRITER"
                            ? "นักเขียน"
                            : "นักอ่าน"}
                      </span>
                    </div>
                    <Link
                      href="/library"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-brand-black/70 hover:bg-cream"
                    >
                      <Library className="h-4 w-4" />
                      ชั้นหนังสือ
                    </Link>
                    {(userRole === "WRITER" || userRole === "ADMIN") && (
                      <Link
                        href="/write"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-brand-black/70 hover:bg-cream"
                      >
                        <PenTool className="h-4 w-4" />
                        จัดการผลงาน
                      </Link>
                    )}
                    <Link
                      href="/wallet"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-brand-black/70 hover:bg-cream"
                    >
                      <Coins className="h-4 w-4" />
                      กระเป๋าเหรียญ
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-brand-black/70 hover:bg-cream"
                    >
                      <Settings className="h-4 w-4" />
                      ตั้งค่าโปรไฟล์
                    </Link>
                    {userRole === "ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50"
                      >
                        <Shield className="h-4 w-4" />
                        Admin Panel
                      </Link>
                    )}
                    <hr className="my-1 border-border" />
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      ออกจากระบบ
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="hidden sm:flex items-center gap-1.5 rounded-full bg-rosegold-dark px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rosegold"
            >
              <User className="h-4 w-4" />
              <span>เข้าสู่ระบบ</span>
            </Link>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-full p-2.5 text-brand-black/60 transition-colors hover:bg-cream md:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="border-t border-border bg-background px-4 py-3">
          <div className="mx-auto max-w-2xl">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหานิยาย, นักเขียน, แท็ก..."
                className="w-full rounded-full border border-border bg-cream/50 py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-rosegold focus:outline-none focus:ring-2 focus:ring-rosegold/20"
              />
            </form>

            {/* Search results dropdown */}
            {searchQuery.trim().length >= 2 && (
              <div className="mt-2 rounded-xl border border-border bg-background shadow-lg">
                {searchLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-rosegold-dark" />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((novel: any) => {
                      const authorName =
                        typeof novel.author === "object"
                          ? novel.author.penName || novel.author.name
                          : novel.author;
                      return (
                        <Link
                          key={novel.id}
                          href={`/novel/${novel.id}`}
                          onClick={() => {
                            setSearchOpen(false);
                            setSearchQuery("");
                          }}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-cream/50 transition-colors"
                        >
                          <div className="h-10 w-7 shrink-0 overflow-hidden rounded bg-gradient-to-br from-rosegold/20 to-cream">
                            {novel.coverImage ? (
                              <img
                                src={novel.coverImage}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <BookOpen className="h-3 w-3 text-rosegold/30" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-brand-black">
                              {novel.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {authorName}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    ไม่พบผลลัพธ์
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="flex flex-col p-4 gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-brand-black/70 transition-colors hover:bg-cream hover:text-rosegold-dark"
              >
                <link.icon className="h-5 w-5" />
                {link.label}
              </Link>
            ))}
            <hr className="my-2 border-border" />
            {session?.user ? (
              <>
                <div className="flex items-center gap-3 px-4 py-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rosegold-dark text-sm font-bold text-white">
                    {session.user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-brand-black">
                      {session.user.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                </div>
                <Link
                  href="/wallet"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-coin"
                >
                  <Coins className="h-5 w-5" />
                  กระเป๋าเหรียญ ({(userCoinBalance ?? 0).toLocaleString("th-TH")})
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    // Show notifications in mobile view
                    router.push("#notifications");
                  }}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-brand-black/70 relative"
                >
                  <Bell className="h-5 w-5" />
                  การแจ้งเตือน
                  {unreadCount > 0 && (
                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-500"
                >
                  <LogOut className="h-5 w-5" />
                  ออกจากระบบ
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-full bg-rosegold-dark px-4 py-3 text-sm font-medium text-white"
              >
                <User className="h-5 w-5" />
                เข้าสู่ระบบ
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
