import type { Metadata } from "next";
import { db } from "@/lib/db";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const novel = await db.novel.findUnique({
    where: { id },
    select: { title: true, synopsis: true, coverImage: true },
  });

  if (!novel) {
    return { title: "ไม่พบนิยาย" };
  }

  return {
    title: novel.title,
    description: novel.synopsis?.substring(0, 160),
    openGraph: {
      title: novel.title,
      description: novel.synopsis?.substring(0, 160),
      ...(novel.coverImage && { images: [novel.coverImage] }),
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
