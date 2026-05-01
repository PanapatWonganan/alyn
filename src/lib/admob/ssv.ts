/**
 * AdMob Server-Side Verification (SSV) signature verification.
 *
 * Per Google's docs, AdMob signs a callback URL with ECDSA-P256-SHA256 using
 * one of the published verifier public keys at:
 *   https://www.gstatic.com/admob/reward/verifier-keys.json
 *
 * The message that was signed is the callback's query string with both
 * `signature` and `key_id` parameters removed, preserving the original
 * order of the remaining parameters. The signature itself is web-safe
 * base64 (no padding) of the DER-encoded ECDSA signature.
 *
 * We verify locally using `node:crypto` only — no extra packages.
 *
 * Dev escape hatch: set `ADMOB_SSV_BYPASS=1` to skip signature verification
 * and trust the request (logs `[ADMOB SSV BYPASS]`).
 */

import { createPublicKey, createVerify, KeyObject } from "node:crypto";

export const VERIFIER_KEYS_URL =
  "https://www.gstatic.com/admob/reward/verifier-keys.json";

const KEYS_TTL_MS = 24 * 60 * 60 * 1000; // 24h

interface CachedKey {
  keyObject: KeyObject;
  // Raw entry kept for debugging/audit.
  raw: VerifierKeyEntry;
}

interface VerifierKeyEntry {
  keyId: number | string;
  pem?: string;
  base64?: string; // sometimes published as DER base64
}

interface VerifierKeysResponse {
  keys: VerifierKeyEntry[];
}

interface CacheState {
  byKeyId: Map<string, CachedKey>;
  fetchedAt: number;
}

let cache: CacheState | null = null;
// Avoid stampedes when many SSV callbacks arrive concurrently after a key rotation.
let inflight: Promise<CacheState> | null = null;

export interface SsvPayload {
  transactionId: string;
  userId?: string;
  customData?: string;
  rewardAmount: number;
  rewardItem: string;
  timestamp: string;
  adNetwork: string;
  adUnit: string;
}

export interface SsvVerifyResult {
  valid: boolean;
  reason?: string;
  payload?: SsvPayload;
}

function isFresh(state: CacheState | null): state is CacheState {
  return !!state && Date.now() - state.fetchedAt < KEYS_TTL_MS;
}

async function fetchKeys(): Promise<CacheState> {
  // SECURITY: We trust only the gstatic.com URL above (TLS pinning is left to
  // the platform). Any infra-level interception of that URL would be a much
  // larger compromise than this code can defend against.
  const res = await fetch(VERIFIER_KEYS_URL, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`verifier_keys_fetch_failed:${res.status}`);
  }
  const json = (await res.json()) as VerifierKeysResponse;
  const byKeyId = new Map<string, CachedKey>();
  for (const entry of json.keys ?? []) {
    try {
      const keyObject = parseKey(entry);
      byKeyId.set(String(entry.keyId), { keyObject, raw: entry });
    } catch (err) {
      console.warn(
        "[ADMOB SSV] Skipping unparseable verifier key",
        entry.keyId,
        err
      );
    }
  }
  return { byKeyId, fetchedAt: Date.now() };
}

function parseKey(entry: VerifierKeyEntry): KeyObject {
  if (entry.pem) {
    return createPublicKey({ key: entry.pem, format: "pem" });
  }
  if (entry.base64) {
    // Google has historically published DER (X.509 SubjectPublicKeyInfo) as
    // base64. createPublicKey accepts DER with explicit format/type.
    const der = Buffer.from(entry.base64, "base64");
    return createPublicKey({ key: der, format: "der", type: "spki" });
  }
  throw new Error("unsupported_key_shape");
}

async function getKeys(forceRefresh = false): Promise<CacheState> {
  if (!forceRefresh && isFresh(cache)) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      cache = await fetchKeys();
      return cache;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/**
 * Reconstruct the message body that AdMob signs: the original query string
 * with `signature` and `key_id` parameters removed, preserving order.
 *
 * Note: Next.js' `URLSearchParams` exposes the iteration in original order.
 * We re-encode using the same encoding rules that URLSearchParams produces
 * (RFC 1738 form-urlencoding). This matches what Google sends, since the
 * signature is computed over the raw query they emit.
 */
function buildMessage(searchParams: URLSearchParams): string {
  const parts: string[] = [];
  for (const [key, value] of searchParams.entries()) {
    if (key === "signature" || key === "key_id") continue;
    parts.push(
      `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    );
  }
  return parts.join("&");
}

function decodeWebSafeBase64(s: string): Buffer {
  // AdMob uses URL-safe base64 *without* padding for the signature param.
  const padded = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, "base64");
}

function extractPayload(sp: URLSearchParams): SsvPayload | null {
  const transactionId = sp.get("transaction_id");
  const rewardAmountStr = sp.get("reward_amount");
  const rewardItem = sp.get("reward_item");
  const timestamp = sp.get("timestamp");
  const adNetwork = sp.get("ad_network");
  const adUnit = sp.get("ad_unit");
  if (
    !transactionId ||
    !rewardAmountStr ||
    !rewardItem ||
    !timestamp ||
    !adNetwork ||
    !adUnit
  ) {
    return null;
  }
  const rewardAmount = Number.parseInt(rewardAmountStr, 10);
  if (!Number.isFinite(rewardAmount)) return null;
  return {
    transactionId,
    userId: sp.get("user_id") || undefined,
    customData: sp.get("custom_data") || undefined,
    rewardAmount,
    rewardItem,
    timestamp,
    adNetwork,
    adUnit,
  };
}

export async function verifySsvSignature(
  searchParams: URLSearchParams
): Promise<SsvVerifyResult> {
  const payload = extractPayload(searchParams);
  if (!payload) {
    return { valid: false, reason: "missing_required_params" };
  }

  if (process.env.ADMOB_SSV_BYPASS === "1") {
    console.warn("[ADMOB SSV BYPASS] Skipping signature verification (dev mode)");
    return { valid: true, payload };
  }

  const signatureB64 = searchParams.get("signature");
  const keyId = searchParams.get("key_id");
  if (!signatureB64 || !keyId) {
    return { valid: false, reason: "missing_signature_or_key_id" };
  }

  let signature: Buffer;
  try {
    signature = decodeWebSafeBase64(signatureB64);
  } catch {
    return { valid: false, reason: "bad_signature_encoding" };
  }

  const message = Buffer.from(buildMessage(searchParams), "utf8");

  let state = await getKeys(false);
  let entry = state.byKeyId.get(keyId);
  if (!entry) {
    // Possible key rotation — refresh once and retry.
    state = await getKeys(true);
    entry = state.byKeyId.get(keyId);
  }
  if (!entry) {
    return { valid: false, reason: `unknown_key_id:${keyId}` };
  }

  try {
    const verifier = createVerify("sha256");
    verifier.update(message);
    verifier.end();
    const ok = verifier.verify(entry.keyObject, signature);
    if (!ok) return { valid: false, reason: "signature_mismatch" };
    return { valid: true, payload };
  } catch (err) {
    return {
      valid: false,
      reason: `verify_threw:${(err as Error).message}`,
    };
  }
}
