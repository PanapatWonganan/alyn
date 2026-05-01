import type { Metadata } from "next";
import { db } from "@/lib/db";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const novel = await db.novel.findUnique({
    where: { id },
    select: {
      title: true,
      synopsis: true,
      coverImage: true,
      author: { select: { name: true, penName: true } },
    },
  });

  if (!novel) {
    return { title: "ไม่พบนิยาย" };
  }

  const description = novel.synopsis?.substring(0, 160) || "อ่านนิยายบน Alyn";
  const authorName = novel.author?.penName || novel.author?.name || "Alyn";
  const images = novel.coverImage ? [novel.coverImage] : undefined;

  return {
    title: novel.title,
    description,
    authors: [{ name: authorName }],
    openGraph: {
      type: "book",
      title: novel.title,
      description,
      ...(images && { images }),
    },
    twitter: {
      card: "summary_large_image",
      title: novel.title,
      description,
      ...(images && { images }),
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
