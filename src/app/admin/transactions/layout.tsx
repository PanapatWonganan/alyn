import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ธุรกรรม",
  description: "จัดการธุรกรรมและรายการเหรียญในระบบอลิน",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
