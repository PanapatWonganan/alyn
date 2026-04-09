import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "สมัครสมาชิก",
  description: "สร้างบัญชีอลิน",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
