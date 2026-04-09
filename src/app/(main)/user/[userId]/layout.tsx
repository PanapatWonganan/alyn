import type { Metadata } from "next";
import { db } from "@/lib/db";

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }): Promise<Metadata> {
  const { userId } = await params;
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, penName: true, bio: true },
  });

  if (!user) {
    return { title: "ไม่พบผู้ใช้" };
  }

  const displayName = user.penName || user.name;
  return {
    title: `${displayName} — โปรไฟล์`,
    description: user.bio || `โปรไฟล์ของ ${displayName} บนอลิน`,
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
