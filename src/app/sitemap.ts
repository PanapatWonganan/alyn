import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || "https://alyn.co";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/ranking`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/auth/login`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/auth/register`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  let novelRoutes: MetadataRoute.Sitemap = [];
  let userRoutes: MetadataRoute.Sitemap = [];

  try {
    const novels = await db.novel.findMany({
      where: { status: { not: "DRAFT" } },
      select: { id: true, updatedAt: true, authorId: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    });

    novelRoutes = novels.map((n) => ({
      url: `${baseUrl}/novel/${n.id}`,
      lastModified: n.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    const authorIds = Array.from(new Set(novels.map((n) => n.authorId)));
    if (authorIds.length > 0) {
      const users = await db.user.findMany({
        where: { id: { in: authorIds } },
        select: { id: true, updatedAt: true },
      });
      userRoutes = users.map((u) => ({
        url: `${baseUrl}/user/${u.id}`,
        lastModified: u.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));
    }
  } catch (err) {
    console.error("Sitemap build failed to load dynamic routes:", err);
  }

  return [...staticRoutes, ...novelRoutes, ...userRoutes];
}
