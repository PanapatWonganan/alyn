/**
 * Omise payment integration (mock mode supported).
 *
 * If OMISE_SECRET_KEY is not set, createCharge() returns a mock success
 * response and logs with the [OMISE MOCK] prefix. This lets the rest of the
 * platform run end-to-end without a real Omise account.
 */

export interface CreateChargeInput {
  amountSatang: number;
  token?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface ChargeResult {
  id: string;
  status: string;
  amount: number;
  mock: boolean;
}

/**
 * Whether Omise is running in mock mode (no real secret key configured).
 */
export function isOmiseMock(): boolean {
  return !process.env.OMISE_SECRET_KEY;
}

/**
 * Create a charge via Omise. Falls back to a mock response when no secret key
 * is configured.
 */
export async function createCharge(
  input: CreateChargeInput
): Promise<ChargeResult> {
  const { amountSatang, token, description, metadata } = input;

  if (!Number.isFinite(amountSatang) || amountSatang <= 0) {
    throw new Error("INVALID_AMOUNT");
  }

  if (isOmiseMock()) {
    const mockId = `mock_chrg_${Date.now()}`;
    console.log(
      `[OMISE MOCK] createCharge amount=${amountSatang} satang description=${
        description ?? ""
      } token=${token ?? "none"} metadata=${JSON.stringify(metadata ?? {})}`
    );
    return {
      id: mockId,
      status: "successful",
      amount: amountSatang,
      mock: true,
    };
  }

  if (!token) {
    throw new Error("MISSING_TOKEN");
  }

  // Lazy-load the SDK via a runtime-computed module id so Turbopack does not
  // try to resolve "omise" at build time. The package only needs to be
  // installed when real payments are configured.
  const modName = ["om", "ise"].join("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod: any = await import(/* webpackIgnore: true */ modName).catch(
    () => null
  );
  if (!mod) {
    throw new Error("OMISE_SDK_NOT_INSTALLED");
  }
  const Omise = mod.default ?? mod;
  const client = Omise({ secretKey: process.env.OMISE_SECRET_KEY });

  const charge = await client.charges.create({
    amount: amountSatang,
    currency: "thb",
    card: token,
    description,
    metadata,
  });

  return {
    id: charge.id,
    status: charge.status,
    amount: charge.amount,
    mock: false,
  };
}
