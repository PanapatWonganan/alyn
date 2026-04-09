import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "จัดการผู้ใช้",
  description: "จัดการผู้ใช้งานในระบบอลิน",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
