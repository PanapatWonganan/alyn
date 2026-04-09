import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "อันดับนิยาย",
  description: "จัดอันดับนิยายยอดนิยมสูงสุด",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
