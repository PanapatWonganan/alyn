import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ชั้นหนังสือ",
  description: "นิยายที่บันทึกไว้และประวัติการอ่าน",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
