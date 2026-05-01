import { NextRequest, NextResponse } from "next/server";
import { isPaysolutionsMock } from "@/lib/payment/paysolutions";
import { fulfillPaymentOrder } from "@/lib/payment/fulfill";

/**
 * POST /api/payments/paysolutions/mock
 *
 * Mock-mode only. In real mode this endpoint does nothing and redirects
 * to /wallet/failed, because a real payment should never land here.
 *
 * When PAYSOLUTIONS_API_KEY is unset, the checkout form auto-submits here
 * instead of to thaiepay.com. We immediately mark the order as paid and
 * redirect the user to /wallet/success.
 */
async function handle(request: NextRequest) {
  const origin = request.nextUrl.origin;

  if (!isPaysolutionsMock()) {
    return NextResponse.redirect(`${origin}/wallet/failed`, 303);
  }

  let refNo = "";

  if (request.method === "POST") {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await request.text();
      const params = new URLSearchParams(text);
      refNo = params.get("refno") || "";
    } else if (contentType.includes("application/json")) {
      const json = await request.json().catch(() => ({}));
      refNo = String((json as Record<string, unknown>).refno || "");
    }
  } else {
    refNo = request.nextUrl.searchParams.get("refno") || "";
  }

  if (!refNo) {
    return NextResponse.redirect(`${origin}/wallet/failed`, 303);
  }

  const result = await fulfillPaymentOrder(refNo, `mock_${Date.now()}`, {
    mock: true,
  });

  if (!result.ok) {
    return NextResponse.redirect(
      `${origin}/wallet/failed?refno=${encodeURIComponent(refNo)}`,
      303
    );
  }

  return NextResponse.redirect(
    `${origin}/wallet/success?refno=${encodeURIComponent(refNo)}`,
    303
  );
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
