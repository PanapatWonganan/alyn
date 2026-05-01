import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/v1/iap/rtdn-webhook
 *
 * Google Play Real-Time Developer Notifications endpoint. No auth — Google
 * calls this directly via Pub/Sub push.
 *
 * Pub/Sub envelope shape:
 *   {
 *     "message": {
 *       "data": "<base64-encoded JSON>",
 *       "messageId": "...",
 *       "publishTime": "..."
 *     },
 *     "subscription": "..."
 *   }
 *
 * Decoded data carries `oneTimeProductNotification`, `subscriptionNotification`,
 * `voidedPurchaseNotification`, etc. We currently log and ack with 200 so
 * Google does not retry. Real handling (refunds, subscription state changes)
 * is the next iteration.
 *
 * TODO: handle SUBSCRIPTION_RECOVERED, REFUND, VOIDED_PURCHASE, etc. — when
 * a refund arrives, look up the IapPurchase by purchaseToken/orderId and
 * reverse the grant (insert a negative CoinTransaction and decrement
 * user.coinBalance) inside a $transaction.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      console.warn("[IAP RTDN] empty or non-JSON body");
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const message = (body as { message?: { data?: string } }).message;
    const dataB64 = message?.data;

    if (typeof dataB64 === "string" && dataB64.length > 0) {
      try {
        const decoded = Buffer.from(dataB64, "base64").toString("utf8");
        const payload = JSON.parse(decoded);
        console.log(
          "[IAP RTDN] received notification:",
          JSON.stringify(payload)
        );
      } catch (err) {
        console.error("[IAP RTDN] failed to decode message.data", err);
      }
    } else {
      console.log("[IAP RTDN] received envelope without message.data");
    }

    // Always 200 so Google Pub/Sub stops retrying — the actual work is
    // queued for a future iteration.
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("[IAP RTDN] handler error", err);
    // Still 200 — RTDN retries are aggressive and we don't want a noisy
    // queue while we're still scaffolding handlers.
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
