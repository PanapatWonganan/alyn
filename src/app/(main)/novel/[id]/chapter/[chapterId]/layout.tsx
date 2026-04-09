import type { Metadata } from "next";
import { db } from "@/lib/db";

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string; chapterId: string }>
}): Promise<Metadata> {
  const { id, chapterId } = await params;

  const chapter = await db.chapter.findUnique({
    where: { id: chapterId },
    select: {
      title: true,
      novel: {
        select: { title: true }
      }
    },
  });

  if (!chapter) {
    return { title: "ไม่พบตอน" };
  }

  return {
    title: `${chapter.title} - ${chapter.novel.title}`,
    description: `อ่าน ${chapter.title} จาก ${chapter.novel.title}`,
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
