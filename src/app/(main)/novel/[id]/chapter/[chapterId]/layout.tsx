import type { Metadata } from "next";
import { db } from "@/lib/db";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; chapterId: string }>;
}): Promise<Metadata> {
  const { chapterId } = await params;

  const chapter = await db.chapter.findUnique({
    where: { id: chapterId },
    select: {
      title: true,
      number: true,
      novel: {
        select: {
          title: true,
          synopsis: true,
          coverImage: true,
          author: { select: { name: true, penName: true } },
        },
      },
    },
  });

  if (!chapter) {
    return { title: "ไม่พบตอน" };
  }

  const fullTitle = `ตอนที่ ${chapter.number} ${chapter.title} - ${chapter.novel.title}`;
  const description =
    chapter.novel.synopsis?.substring(0, 160) ||
    `อ่าน ${chapter.title} จาก ${chapter.novel.title}`;
  const authorName =
    chapter.novel.author?.penName || chapter.novel.author?.name || "Alyn";
  const images = chapter.novel.coverImage ? [chapter.novel.coverImage] : undefined;

  return {
    title: fullTitle,
    description,
    authors: [{ name: authorName }],
    openGraph: {
      type: "article",
      title: fullTitle,
      description,
      ...(images && { images }),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      ...(images && { images }),
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
