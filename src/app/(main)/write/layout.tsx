import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "จัดการผลงาน",
  description: "แดชบอร์ดนักเขียน จัดการนิยายของคุณ",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
