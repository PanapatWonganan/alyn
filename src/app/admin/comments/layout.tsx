import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "จัดการคอมเมนต์",
  description: "จัดการคอมเมนต์ในระบบอลิน",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
