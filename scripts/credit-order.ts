/**
 * Manual credit for a PaymentOrder.
 *
 * Use when a payment went through on Pay Solutions but the callback did not
 * fulfill the order (e.g. during early integration testing).
 *
 * Usage:
 *   npx tsx scripts/credit-order.ts <refNo>
 *   npx tsx scripts/credit-order.ts 8383438203
 *
 * Uses the same fulfillment helper as the API routes, so it is idempotent —
 * running it twice on the same refNo does NOT double-credit.
 */

import { fulfillPaymentOrder } from "../src/lib/payment/fulfill";
import { db } from "../src/lib/db";

async function main() {
  const refNo = process.argv[2];
  if (!refNo) {
    console.error("Usage: npx tsx scripts/credit-order.ts <refNo>");
    process.exit(1);
  }

  const order = await db.paymentOrder.findUnique({
    where: { refNo },
    include: { user: { select: { email: true, coinBalance: true } } },
  });

  if (!order) {
    console.error(`Order not found: ${refNo}`);
    process.exit(1);
  }

  console.log("Before:");
  console.log(`  refNo:       ${order.refNo}`);
  console.log(`  user:        ${order.user.email}`);
  console.log(`  package:     ${order.packageId}`);
  console.log(`  coins:       ${order.coinAmount} + bonus ${order.bonusAmount}`);
  console.log(`  price:       ${order.priceThb} THB`);
  console.log(`  status:      ${order.status}`);
  console.log(`  balance:     ${order.user.coinBalance}`);
  console.log("");

  const result = await fulfillPaymentOrder(refNo, "manual_credit", {
    via: "manual_script",
    at: new Date().toISOString(),
  });

  if (!result.ok) {
    console.error(`Fulfillment failed: ${result.reason}`);
    process.exit(1);
  }

  if (result.alreadyPaid) {
    console.log("Order was already PAID — no changes made.");
  } else {
    console.log("Order credited successfully.");
  }

  const after = await db.user.findUnique({
    where: { id: order.userId },
    select: { coinBalance: true },
  });
  console.log(`New balance: ${after?.coinBalance}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
