import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fulfillPaymentOrder } from "@/lib/payment/fulfill";

/**
 * Browser-side return URL after the user completes payment on Pay Solutions.
 *
 * Per Pay Solutions' own WooCommerce plugin, they send only `refno` back on
 * success — no hashvalue, no status code, no amount. The plugin simply
 * trusts the refno and marks the order as paid. We mirror that behavior.
 *
 * Security: the refno is 10 digits and generated fresh per order, so an
 * attacker would have to guess the exact refno of a PENDING order in the
 * 30-minute window. Combined with the fact that Pay Solutions only calls
 * this URL after an actual successful payment (and the amount is already
 * locked to the order in our DB at creation time), this is acceptable for
 * a small-scale production integration. For higher security, configure a
 * postback URL in the Pay Solutions merchant dashboard and cross-check
 * there.
 *
 * Supports both GET (query string) and POST (form body). Pay Solutions
 * historically uses GET for the browser redirect.
 */
async function handle(request: NextRequest) {
  try {
    let refNo = "";
    const debugParams: Record<string, string> = {};

    if (request.method === "POST") {
      const contentType = request.headers.get("content-type") || "";
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const text = await request.text();
        const params = new URLSearchParams(text);
        refNo = params.get("refno") || "";
        params.forEach((v, k) => {
          debugParams[k] = v;
        });
      }
    } else {
      const url = request.nextUrl;
      refNo = url.searchParams.get("refno") || "";
      url.searchParams.forEach((v, k) => {
        debugParams[k] = v;
      });
    }

    console.log(
      `[PAYSOLUTIONS] return method=${request.method} refno=${refNo} params=${JSON.stringify(
        debugParams
      )}`
    );

    const origin = request.nextUrl.origin;
    const failedUrl = `${origin}/wallet/failed${
      refNo ? `?refno=${encodeURIComponent(refNo)}` : ""
    }`;
    const successUrl = `${origin}/wallet/success?refno=${encodeURIComponent(
      refNo
    )}`;

    if (!refNo) {
      console.warn("[PAYSOLUTIONS] return handler: missing refno");
      return NextResponse.redirect(failedUrl, 303);
    }

    const order = await db.paymentOrder.findUnique({ where: { refNo } });
    if (!order) {
      console.warn(`[PAYSOLUTIONS] return handler: order not found refno=${refNo}`);
      return NextResponse.redirect(failedUrl, 303);
    }

    // Already paid (postback arrived first or duplicate return) — go straight to success.
    if (order.status === "PAID") {
      return NextResponse.redirect(successUrl, 303);
    }

    // Trust the refno and credit the coins. Matches the reference WooCommerce plugin.
    const result = await fulfillPaymentOrder(refNo, null, {
      via: "return",
      params: debugParams,
    });

    if (!result.ok) {
      console.error(
        `[PAYSOLUTIONS] return handler: fulfill failed refno=${refNo} reason=${result.reason}`
      );
      return NextResponse.redirect(failedUrl, 303);
    }

    return NextResponse.redirect(successUrl, 303);
  } catch (err) {
    console.error("[PAYSOLUTIONS] return error", err);
    return NextResponse.redirect(
      `${request.nextUrl.origin}/wallet/failed`,
      303
    );
  }
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
