import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "จัดการนิยาย",
  description: "จัดการนิยายในระบบอลิน",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
