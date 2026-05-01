/**
 * Google Play Developer API — server-side receipt verification (mock supported).
 *
 * If `IAP_GOOGLE_SERVICE_ACCOUNT_JSON` is unset, verification and acknowledgement
 * fall back to mock success and log with the `[IAP MOCK]` prefix. This mirrors
 * the email/Omise mock pattern (see src/lib/email.ts and src/lib/payment/omise.ts)
 * so the platform can run end-to-end without real Google credentials.
 *
 * In live mode the `googleapis` package is loaded via a runtime-computed module
 * id so Turbopack does not try to bundle it at build time. Operators must
 * `npm install googleapis` before going live — the package is intentionally
 * NOT in package.json.
 */

export interface VerifyPurchaseInput {
  packageName: string;
  productId: string;
  purchaseToken: string;
}

export interface VerifyPurchaseResult {
  ok: boolean;
  reason?: string;
  raw?: unknown;
  orderId?: string;
  priceAmountMicros?: string;
  currency?: string;
  mock?: boolean;
}

export interface AcknowledgePurchaseInput {
  packageName: string;
  productId: string;
  purchaseToken: string;
}

export interface AcknowledgePurchaseResult {
  ok: boolean;
  reason?: string;
  mock?: boolean;
}

/**
 * Whether the Google Play API integration is in mock mode (no service account).
 */
export function isIapMock(): boolean {
  return !process.env.IAP_GOOGLE_SERVICE_ACCOUNT_JSON;
}

/**
 * Lazily build an authenticated Android Publisher client.
 * Uses a runtime-computed module id so Turbopack does not resolve `googleapis`
 * at build time. Returns null if the SDK is not installed or credentials are
 * malformed.
 */
async function getPublisherClient(): Promise<unknown | null> {
  const serviceAccountJson = process.env.IAP_GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) return null;

  // Runtime-computed module name avoids static bundler resolution.
  const modName = ["google", "apis"].join("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod: any = await import(/* webpackIgnore: true */ modName).catch(
    () => null
  );
  if (!mod) {
    console.error(
      "[IAP] googleapis package not installed. Run `npm install googleapis` for live mode."
    );
    return null;
  }

  let credentials: Record<string, unknown>;
  try {
    credentials = JSON.parse(serviceAccountJson);
  } catch (err) {
    console.error("[IAP] IAP_GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON", err);
    return null;
  }

  const google = mod.google ?? mod.default?.google ?? mod;
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/androidpublisher"],
  });

  return google.androidpublisher({ version: "v3", auth });
}

/**
 * Verify a Google Play product purchase against the Developer API.
 *
 * Validates `purchaseState === 0` (purchased). Falls back to mock success when
 * IAP_GOOGLE_SERVICE_ACCOUNT_JSON is not configured.
 */
export async function verifyPurchase(
  input: VerifyPurchaseInput
): Promise<VerifyPurchaseResult> {
  const { packageName, productId, purchaseToken } = input;

  if (!packageName || !productId || !purchaseToken) {
    return { ok: false, reason: "MISSING_FIELDS" };
  }

  if (isIapMock()) {
    const fakeOrderId = `mock_order_${Date.now()}`;
    console.log(
      `[IAP MOCK] verifyPurchase pkg=${packageName} product=${productId} token=${purchaseToken.slice(
        0,
        12
      )}... -> ok orderId=${fakeOrderId}`
    );
    return {
      ok: true,
      mock: true,
      orderId: fakeOrderId,
      priceAmountMicros: undefined,
      currency: "THB",
      raw: { mock: true, purchaseState: 0 },
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const publisher: any = await getPublisherClient();
  if (!publisher) {
    return { ok: false, reason: "SDK_UNAVAILABLE" };
  }

  try {
    const res = await publisher.purchases.products.get({
      packageName,
      productId,
      token: purchaseToken,
    });

    const data = res?.data ?? {};
    const purchaseState = data.purchaseState;

    if (purchaseState !== 0) {
      return {
        ok: false,
        reason: `PURCHASE_STATE_${purchaseState ?? "UNKNOWN"}`,
        raw: data,
      };
    }

    return {
      ok: true,
      raw: data,
      orderId: typeof data.orderId === "string" ? data.orderId : undefined,
      priceAmountMicros:
        typeof data.priceAmountMicros === "string"
          ? data.priceAmountMicros
          : undefined,
      currency:
        typeof data.priceCurrencyCode === "string"
          ? data.priceCurrencyCode
          : undefined,
    };
  } catch (err) {
    console.error("[IAP] verifyPurchase failed", err);
    const message = err instanceof Error ? err.message : "VERIFY_FAILED";
    return { ok: false, reason: message };
  }
}

/**
 * Acknowledge a verified purchase within Google's 3-day window. After
 * acknowledgement Google will not refund the transaction automatically.
 *
 * Best-effort: callers should not fail the user-facing flow if this errors —
 * coins have already been granted and the row can be re-acked later.
 */
export async function acknowledgePurchase(
  input: AcknowledgePurchaseInput
): Promise<AcknowledgePurchaseResult> {
  const { packageName, productId, purchaseToken } = input;

  if (!packageName || !productId || !purchaseToken) {
    return { ok: false, reason: "MISSING_FIELDS" };
  }

  if (isIapMock()) {
    console.log(
      `[IAP MOCK] acknowledgePurchase pkg=${packageName} product=${productId} token=${purchaseToken.slice(
        0,
        12
      )}...`
    );
    return { ok: true, mock: true };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const publisher: any = await getPublisherClient();
  if (!publisher) {
    return { ok: false, reason: "SDK_UNAVAILABLE" };
  }

  try {
    await publisher.purchases.products.acknowledge({
      packageName,
      productId,
      token: purchaseToken,
    });
    return { ok: true };
  } catch (err) {
    console.error("[IAP] acknowledgePurchase failed", err);
    const message = err instanceof Error ? err.message : "ACK_FAILED";
    return { ok: false, reason: message };
  }
}
