import { NextRequest, NextResponse } from "next/server";
import { fulfillPaymentOrder } from "@/lib/payment/fulfill";

/**
 * POST /api/payments/paysolutions/postback
 *
 * Optional server-to-server callback. Pay Solutions' own WooCommerce plugin
 * does not use a separate postback URL (it uses the return URL for both),
 * so this endpoint is only active if Pay Solutions is configured to send
 * postbacks for your merchant account via the merchant dashboard.
 *
 * Like the return handler, we trust `refno` alone — matching the reference
 * plugin's behavior.
 *
 * Pay Solutions expects a plain "OK" response on success.
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let params: URLSearchParams;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await request.text();
      params = new URLSearchParams(text);
    } else if (contentType.includes("application/json")) {
      const json = await request.json();
      params = new URLSearchParams(
        Object.entries(json as Record<string, unknown>).map(([k, v]) => [
          k,
          String(v),
        ])
      );
    } else {
      const text = await request.text();
      params = new URLSearchParams(text);
    }

    const refNo = params.get("refno") || "";
    const raw: Record<string, string> = {};
    params.forEach((v, k) => {
      raw[k] = v;
    });

    console.log(
      `[PAYSOLUTIONS] postback refno=${refNo} params=${JSON.stringify(raw)}`
    );

    if (!refNo) {
      return new NextResponse("MISSING_REFNO", { status: 400 });
    }

    const result = await fulfillPaymentOrder(refNo, raw.tranid || null, raw);
    if (!result.ok) {
      console.error(
        `[PAYSOLUTIONS] postback fulfill failed refno=${refNo} reason=${result.reason}`
      );
      return new NextResponse(result.reason || "ERROR", { status: 400 });
    }

    return new NextResponse("OK", { status: 200 });
  } catch (err) {
    console.error("[PAYSOLUTIONS] postback error", err);
    return new NextResponse("ERROR", { status: 500 });
  }
}

// Some gateways probe GET to validate the URL.
export async function GET() {
  return new NextResponse("OK", { status: 200 });
}
