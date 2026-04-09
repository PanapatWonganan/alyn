import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    // Require admin authentication
    await requireAdmin();

    // Get total counts
    const [
      totalUsers,
      totalNovels,
      totalChapters,
      totalComments,
      totalDonations,
    ] = await Promise.all([
      db.user.count(),
      db.novel.count(),
      db.chapter.count(),
      db.comment.count(),
      db.donation.count(),
    ]);

    // Get total coins in system (sum of all TOPUP transactions)
    const topupTransactions = await db.coinTransaction.aggregate({
      where: {
        type: "TOPUP",
      },
      _sum: {
        amount: true,
      },
    });
    const totalCoins = topupTransactions._sum.amount || 0;

    // Get total donations amount
    const donationsSum = await db.donation.aggregate({
      _sum: {
        amount: true,
      },
    });
    const totalDonationAmount = donationsSum._sum.amount || 0;

    // Get recent users (last 5)
    const recentUsers = await db.user.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Get recent novels (last 5)
    const recentNovels = await db.novel.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        author: {
          select: {
            name: true,
            penName: true,
          },
        },
      },
    });

    // Get recent transactions (last 5)
    const recentTransactions = await db.coinTransaction.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        createdAt: true,
      },
    });

    // Format response
    const stats = {
      totalUsers,
      totalNovels,
      totalChapters,
      totalCoins,
      totalComments,
      totalDonations: totalDonationAmount,
      recentUsers: recentUsers.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      })),
      recentNovels: recentNovels.map((novel) => ({
        id: novel.id,
        title: novel.title,
        author: novel.author.penName || novel.author.name,
        status: novel.status,
        createdAt: novel.createdAt.toISOString(),
      })),
      recentTransactions: recentTransactions.map((transaction) => ({
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        createdAt: transaction.createdAt.toISOString(),
      })),
    };

    return apiSuccess(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
