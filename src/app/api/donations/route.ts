import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { apiPaginated, apiMessage, apiError, handleApiError, parsePagination, calculatePagination } from "@/lib/api-response";

// POST /api/donations - Send donation to a writer
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { receiverId, amount, message } = await request.json();

    if (!receiverId || !amount || amount < 1) {
      return apiError("กรุณาระบุผู้รับและจำนวนเหรียญ", 400);
    }

    if (receiverId === session.user.id) {
      return apiError("ไม่สามารถโดเนทให้ตัวเองได้", 400);
    }

    // Check receiver exists and is a writer (done outside transaction for early validation)
    const receiver = await db.user.findUnique({
      where: { id: receiverId },
      select: { id: true, name: true, role: true },
    });

    if (!receiver) {
      return apiError("ไม่พบผู้รับ", 404);
    }

    // Donation split: 90% to writer, 10% platform fee
    const writerReceives = Math.floor(amount * 0.9);

    // Execute donation in transaction to prevent race conditions
    const updatedSender = await db.$transaction(async (tx) => {
      // Check sender balance (inside transaction to prevent TOCTOU)
      const sender = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { coinBalance: true },
      });

      if (!sender || sender.coinBalance < amount) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      // Deduct sender
      await tx.user.update({
        where: { id: session.user.id },
        data: { coinBalance: { decrement: amount } },
      });

      // Add to receiver
      await tx.user.update({
        where: { id: receiverId },
        data: { coinBalance: { increment: writerReceives } },
      });

      // Create donation record
      await tx.donation.create({
        data: {
          amount,
          message: message?.trim() || null,
          senderId: session.user.id,
          receiverId,
        },
      });

      // Sender transaction
      await tx.coinTransaction.create({
        data: {
          type: "DONATION_SENT",
          amount: -amount,
          description: `โดเนทให้ ${receiver.name}`,
          userId: session.user.id,
        },
      });

      // Receiver transaction
      await tx.coinTransaction.create({
        data: {
          type: "DONATION_RECEIVED",
          amount: writerReceives,
          description: `ได้รับโดเนท`,
          userId: receiverId,
        },
      });

      // Return updated balance
      const updatedSender = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { coinBalance: true },
      });

      return updatedSender;
    });

    return apiMessage(
      `โดเนท ${amount} เหรียญสำเร็จ`,
      { coinBalance: updatedSender?.coinBalance }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_BALANCE") {
      return apiError("เหรียญไม่พอ กรุณาเติมเหรียญ", 400);
    }
    return handleApiError(error);
  }
}

// GET /api/donations?receiverId=xxx - Get donations received by a writer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const receiverId = searchParams.get("receiverId");
    const { page, limit } = parsePagination(searchParams);

    if (!receiverId) {
      return apiError("กรุณาระบุผู้รับ", 400);
    }

    const [donations, total] = await Promise.all([
      db.donation.findMany({
        where: { receiverId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          sender: { select: { id: true, name: true, avatar: true } },
        },
      }),
      db.donation.count({ where: { receiverId } }),
    ]);

    return apiPaginated(donations, calculatePagination(total, page, limit));
  } catch (error) {
    return handleApiError(error);
  }
}
