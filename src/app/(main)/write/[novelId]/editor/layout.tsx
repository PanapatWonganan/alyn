import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "แก้ไขนิยาย",
  description: "แก้ไขและจัดการตอนนิยายของคุณ",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
