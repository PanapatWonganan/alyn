import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { apiSuccess, handleApiError, apiError } from "@/lib/api-response";

// GET /api/writer/analytics - Writer analytics dashboard data
export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id as string;
    const role = (session.user as unknown as Record<string, unknown>)
      .role as string;

    if (role !== "WRITER" && role !== "ADMIN") {
      return apiError("ไม่มีสิทธิ์เข้าถึง", 403, "FORBIDDEN");
    }

    // Novels owned by user with counts
    const novels = await db.novel.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        title: true,
        status: true,
        viewCount: true,
        coverImage: true,
        createdAt: true,
        _count: {
          select: {
            chapters: true,
            bookmarks: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const novelIds = novels.map((n) => n.id);

    // Aggregate purchases per novel and total
    const purchaseAgg = novelIds.length
      ? await db.chapterPurchase.findMany({
          where: { chapter: { novelId: { in: novelIds } } },
          select: {
            coinSpent: true,
            chapter: { select: { novelId: true } },
          },
        })
      : [];

    const purchasesByNovel = new Map<
      string,
      { count: number; coin: number }
    >();
    let totalPurchaseCount = 0;
    let totalPurchaseCoin = 0;
    for (const p of purchaseAgg) {
      const nid = p.chapter.novelId;
      const entry = purchasesByNovel.get(nid) ?? { count: 0, coin: 0 };
      entry.count += 1;
      entry.coin += p.coinSpent;
      purchasesByNovel.set(nid, entry);
      totalPurchaseCount += 1;
      totalPurchaseCoin += p.coinSpent;
    }

    // Total earnings: sum of EARNING transactions for this user (already 70% share recorded)
    const earningAgg = await db.coinTransaction.aggregate({
      where: { userId, type: "EARNING" },
      _sum: { amount: true },
    });
    const totalEarningCoin = earningAgg._sum.amount ?? 0;

    // Donation receipts (90% to writer, already recorded as DONATION_RECEIVED)
    const donationAgg = await db.coinTransaction.aggregate({
      where: { userId, type: "DONATION_RECEIVED" },
      _sum: { amount: true },
    });
    const totalDonationCoin = donationAgg._sum.amount ?? 0;

    // Totals
    const totalViews = novels.reduce((s, n) => s + (n.viewCount ?? 0), 0);
    const totalBookmarks = novels.reduce(
      (s, n) => s + (n._count?.bookmarks ?? 0),
      0
    );
    const totalChapters = novels.reduce(
      (s, n) => s + (n._count?.chapters ?? 0),
      0
    );

    // Per-novel performance: derive writer earnings from purchases (70% split)
    const novelPerformance = novels.map((n) => {
      const p = purchasesByNovel.get(n.id) ?? { count: 0, coin: 0 };
      const earnings = Math.floor(p.coin * 0.7);
      return {
        id: n.id,
        title: n.title,
        status: n.status,
        coverImage: n.coverImage,
        viewCount: n.viewCount,
        chapterCount: n._count?.chapters ?? 0,
        bookmarkCount: n._count?.bookmarks ?? 0,
        purchaseCount: p.count,
        purchaseCoin: p.coin,
        earningCoin: earnings,
      };
    });

    // Recent transactions (incoming only by default, last 10)
    const recentTransactions = await db.coinTransaction.findMany({
      where: {
        userId,
        type: { in: ["EARNING", "DONATION_RECEIVED"] },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        createdAt: true,
      },
    });

    // THB equivalent at 1 coin = 1 THB (earnings already after 70% split)
    const totalEarningThb = totalEarningCoin;

    return apiSuccess({
      totals: {
        totalViews,
        totalBookmarks,
        totalChapters,
        totalNovels: novels.length,
        totalPurchaseCount,
        totalPurchaseCoin,
        totalEarningCoin,
        totalEarningThb,
        totalDonationCoin,
      },
      novels: novelPerformance,
      recentTransactions,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
