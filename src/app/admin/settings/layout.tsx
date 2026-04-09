import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ตั้งค่าระบบ",
  description: "ตั้งค่าและจัดการระบบอลิน",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
