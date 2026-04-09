import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "กระเป๋าเหรียญ",
  description: "จัดการเหรียญและดูประวัติธุรกรรม",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
