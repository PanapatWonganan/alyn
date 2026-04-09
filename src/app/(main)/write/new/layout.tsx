import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "สร้างนิยายใหม่",
  description: "เริ่มต้นเขียนนิยายเรื่องใหม่",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
