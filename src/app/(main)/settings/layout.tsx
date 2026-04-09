import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ตั้งค่าโปรไฟล์",
  description: "แก้ไขข้อมูลส่วนตัวและการตั้งค่า",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
