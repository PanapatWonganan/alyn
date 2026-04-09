import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "สำรวจนิยาย",
  description: "สำรวจและค้นหานิยายออนไลน์หลากหลายแนว",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
