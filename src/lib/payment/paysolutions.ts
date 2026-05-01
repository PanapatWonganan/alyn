/**
 * Pay Solutions (thaiepay) payment gateway integration.
 *
 * Pay Solutions uses a form-POST redirect flow:
 *  1. Backend creates a PaymentOrder with a unique refno (padded to 10 digits).
 *  2. Frontend auto-submits a form to the thaiepay payment page with the
 *     required fields (merchantid, refno, total, ...).
 *  3. User pays on the Pay Solutions hosted page.
 *  4. Pay Solutions POSTs back to our `postback` URL and also redirects the
 *     user to our `returnurl`. Both carry a `hashvalue` that we must verify.
 *
 * If PAYSOLUTIONS_API_KEY is not set we run in MOCK MODE: the form submits to
 * our own mock page which instantly marks the order as paid. This lets the
 * whole wallet flow work end-to-end without a real merchant account.
 *
 * Spec reference: Pay Solutions' own WooCommerce plugin
 * (github.com/Pay-Solutions/woocommerce3.9.x) documents these exact fields.
 */

import crypto from "crypto";

export interface CoinPackage {
  id: string;
  coins: number;
  bonus: number;
  price: number; // THB
}

/**
 * Canonical coin packages for wallet top-ups.
 * Kept here so both the API and the UI pull from the same source.
 */
export const COIN_PACKAGES: CoinPackage[] = [
  { id: "coin_50", coins: 50, bonus: 0, price: 50 },
  { id: "coin_100", coins: 100, bonus: 5, price: 100 },
  { id: "coin_300", coins: 300, bonus: 20, price: 300 },
  { id: "coin_500", coins: 500, bonus: 50, price: 500 },
  { id: "coin_1000", coins: 1000, bonus: 150, price: 1000 },
  { id: "coin_2000", coins: 2000, bonus: 400, price: 2000 },
];

/**
 * Test-only packages. Exposed only when PAYSOLUTIONS_TEST_PACKAGES=1 is set.
 * Used during real-gateway smoke tests to avoid wasting money on minimum
 * 50-baht charges. Never expose these in production.
 */
export const TEST_COIN_PACKAGES: CoinPackage[] = [
  { id: "test_1", coins: 1, bonus: 0, price: 1 },
];

export function isTestPackagesEnabled(): boolean {
  return process.env.PAYSOLUTIONS_TEST_PACKAGES === "1";
}

export function getVisiblePackages(): CoinPackage[] {
  return isTestPackagesEnabled()
    ? [...TEST_COIN_PACKAGES, ...COIN_PACKAGES]
    : COIN_PACKAGES;
}

export function findPackage(id: string): CoinPackage | undefined {
  // Always look up test packages too — if an API key is present, we still
  // want the backend to honor a test_* package id if the caller has one.
  const all = [...COIN_PACKAGES, ...TEST_COIN_PACKAGES];
  return all.find((p) => p.id === id);
}

/** Default merchant id — can be overridden via env. */
const DEFAULT_MERCHANT_ID = "14051504";

function getMerchantId(): string {
  return process.env.PAYSOLUTIONS_MERCHANT_ID || DEFAULT_MERCHANT_ID;
}

function getApiKey(): string | undefined {
  return process.env.PAYSOLUTIONS_API_KEY;
}

export function isPaysolutionsMock(): boolean {
  return !getApiKey();
}

/**
 * Returns the Pay Solutions hosted payment URL.
 *
 * Pay Solutions does NOT operate a separate sandbox subdomain — testing is
 * done against the production host (`www.thaiepay.com`) using a test merchant
 * account + test cards provided by their support team. The sandbox flag is
 * kept for future use or if Pay Solutions changes their setup.
 *
 * Override with PAYSOLUTIONS_PAYMENT_URL if your account uses a different host.
 */
export function getPaymentUrl(): string {
  if (process.env.PAYSOLUTIONS_PAYMENT_URL) {
    return process.env.PAYSOLUTIONS_PAYMENT_URL;
  }
  return "https://www.thaiepay.com/epaylink/payment.aspx?lang=t";
}

/**
 * Generate a 10-digit refno (zero-padded). Pay Solutions requires exactly
 * 10 characters. We use a time-based prefix + random suffix to avoid
 * collisions while keeping it sortable.
 */
export function generateRefNo(): string {
  // 6 digits from time (seconds mod 1,000,000) + 4 random digits
  const timePart = (Math.floor(Date.now() / 1000) % 1_000_000)
    .toString()
    .padStart(6, "0");
  const randPart = Math.floor(Math.random() * 10_000)
    .toString()
    .padStart(4, "0");
  return `${timePart}${randPart}`;
}

/**
 * Compute the HMAC-SHA512 hash used by Pay Solutions to sign requests.
 * Formula (from their plugin): base64( hmac_sha512( merchantId + refno + amount, apiKey ) )
 *
 * `amount` must be the same string that is sent in the `total` field
 * (typically 2 decimal places, e.g. "100.00").
 */
export function computeHash(
  merchantId: string,
  refNo: string,
  amount: string,
  apiKey: string
): string {
  const payload = `${merchantId}${refNo}${amount}`;
  return crypto
    .createHmac("sha512", apiKey)
    .update(payload)
    .digest("base64");
}

/**
 * Verify a hash received in a return/postback callback.
 * In mock mode (no API key) the hash is always considered valid so that
 * the mock flow can run locally.
 */
export function verifyHash(
  refNo: string,
  amount: string,
  receivedHash: string | null | undefined
): boolean {
  const apiKey = getApiKey();
  if (!apiKey) return true; // mock mode
  if (!receivedHash) return false;
  const expected = computeHash(getMerchantId(), refNo, amount, apiKey);
  // Constant-time compare
  const a = Buffer.from(expected);
  const b = Buffer.from(receivedHash);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export interface CreateFormInput {
  refNo: string;
  amountThb: number;
  productDetail: string;
  customerEmail: string;
  returnUrl: string;
  postbackUrl?: string;
}

export interface PaymentFormData {
  action: string;
  fields: Record<string, string>;
  mock: boolean;
}

/**
 * Build the form fields for the auto-submit payment form.
 *
 * In MOCK mode the action points to our own `/api/payments/paysolutions/mock`
 * endpoint which instantly marks the order as paid.
 */
export function createPaymentFormData(input: CreateFormInput): PaymentFormData {
  const { refNo, amountThb, productDetail, customerEmail, returnUrl, postbackUrl } =
    input;

  const amount = amountThb.toFixed(2); // "100.00"
  const merchantId = getMerchantId();

  if (isPaysolutionsMock()) {
    return {
      action: "/api/payments/paysolutions/mock",
      fields: {
        refno: refNo,
        total: amount,
        productdetail: productDetail,
        customeremail: customerEmail,
        returnurl: returnUrl,
      },
      mock: true,
    };
  }

  // Per Pay Solutions' own WooCommerce plugin, the form POST does NOT include
  // a hashvalue field — only the 7 fields below. Adding extra fields can
  // cause the gateway to behave unexpectedly.
  const fields: Record<string, string> = {
    merchantid: merchantId,
    refno: refNo,
    customeremail: customerEmail,
    productdetail: productDetail,
    total: amount,
    cc: "00", // THB
    returnurl: returnUrl,
  };
  // postbackUrl intentionally omitted — Pay Solutions' plugin doesn't use it
  // and configures the notify URL via merchant dashboard instead.
  void postbackUrl;

  return {
    action: getPaymentUrl(),
    fields,
    mock: false,
  };
}

/**
 * Double-verify a transaction by querying Pay Solutions' merchant API.
 *
 * Pay Solutions exposes a verify endpoint that returns the authoritative
 * status of a transaction. We use this as a safety net in addition to the
 * hash check on the postback, so an attacker cannot fake a "PAID" callback
 * even if they somehow reach our postback URL.
 *
 * Returns `null` in mock mode or when the API key isn't configured.
 */
export async function verifyOrderWithMerchantApi(
  refNo: string
): Promise<{ status: string; raw: unknown } | null> {
  if (isPaysolutionsMock()) return null;

  const apiKey = getApiKey()!;
  const merchantId = getMerchantId();
  const endpoint =
    process.env.PAYSOLUTIONS_VERIFY_URL ||
    "https://www.thaiepay.com/epaylink/checkpayment.aspx";

  try {
    const body = new URLSearchParams({
      merchantid: merchantId,
      refno: refNo,
      apikey: apiKey,
    });
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const text = await res.text();
    // Pay Solutions returns status strings like "PAID", "PENDING", "FAILED"
    const upper = text.toUpperCase();
    let status = "UNKNOWN";
    if (upper.includes("PAID") || upper.includes("SUCCESS")) status = "PAID";
    else if (upper.includes("PENDING")) status = "PENDING";
    else if (upper.includes("FAIL")) status = "FAILED";
    return { status, raw: text };
  } catch (err) {
    console.error("[PAYSOLUTIONS] verify API error", err);
    return { status: "UNKNOWN", raw: String(err) };
  }
}
