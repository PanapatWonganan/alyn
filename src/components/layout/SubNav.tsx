"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Compass,
  BookOpen,
  CheckCircle2,
  Heart,
  Flame,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const tabs: Tab[] = [
  { href: "/explore", label: "ทั้งหมด", icon: Compass },
  { href: "/explore?sort=latest", label: "มาใหม่", icon: Flame },
  { href: "/explore?status=COMPLETED", label: "จบแล้ว", icon: CheckCircle2 },
  { href: "/explore?genre=yaoi", label: "วาย", icon: Heart },
  { href: "/explore?adult=true", label: "18+", icon: BookOpen },
];

function SubNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function isActive(tabHref: string) {
    const url = new URL(tabHref, "http://x");
    if (pathname !== url.pathname) return false;
    for (const [k, v] of url.searchParams.entries()) {
      if (searchParams.get(k) !== v) return false;
    }
    // Ignore "page" in current params so pagination doesn't break active state
    const currentKeys = Array.from(searchParams.keys()).filter(
      (k) => k !== "page"
    );
    const tabKeys = Array.from(url.searchParams.keys());
    if (tabKeys.length === 0 && currentKeys.length > 0) return false;
    return true;
  }

  // NOTE: This SubNav is sticky at top-16 (below the main Navbar).
  // Any other sticky element below it (e.g. the homepage genre strip)
  // should use top-[104px] (Navbar 64px + SubNav ~40px) and a lower z-index
  // (z-30) so this SubNav stays on top.
  return (
    <div className="sticky top-16 z-40 border-b border-border bg-white/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="flex gap-2 overflow-x-auto scrollbar-hide py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? "bg-rosegold-dark text-white"
                    : "text-brand-black/70 hover:bg-cream hover:text-rosegold-dark"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export default function SubNav() {
  return (
    <Suspense
      fallback={
        <div className="sticky top-16 z-40 h-11 border-b border-border bg-white" />
      }
    >
      <SubNavInner />
    </Suspense>
  );
}
