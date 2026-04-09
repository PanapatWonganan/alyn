import type { Metadata } from "next";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "แดชบอร์ดผู้ดูแลระบบ",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
