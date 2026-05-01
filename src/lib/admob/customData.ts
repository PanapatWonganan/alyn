/**
 * Short-lived HMAC token used as the `customData` payload sent to AdMob
 * when the rewarded ad loads. AdMob echoes the token back in its SSV
 * callback, letting us bind the eventual reward grant to the user that
 * actually requested the ad — without trusting the (unauthenticated)
 * SSV callback for anything but signature validity.
 *
 * Format: `${userId}.${issuedAtMs}.${hmac}` where `hmac` = HMAC-SHA256
 * over `${userId}.${issuedAtMs}` keyed by AUTH_SECRET, base64url, no pad.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

const MAX_TOKEN_AGE_MS = 60 * 60 * 1000; // 1 hour

function getKey(): Buffer {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "fallback-secret";
  return Buffer.from(secret, "utf8");
}

function b64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromB64url(s: string): Buffer {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, "base64");
}

function compute(userId: string, issuedAtMs: number): string {
  const message = `${userId}.${issuedAtMs}`;
  return b64url(createHmac("sha256", getKey()).update(message).digest());
}

export function signCustomData(userId: string): string {
  const issuedAtMs = Date.now();
  const mac = compute(userId, issuedAtMs);
  return `${userId}.${issuedAtMs}.${mac}`;
}

export function verifyCustomData(
  token: string
): { userId: string } | null {
  if (!token || typeof token !== "string") return null;
  const lastDot = token.lastIndexOf(".");
  if (lastDot < 0) return null;
  const macB64 = token.slice(lastDot + 1);
  const head = token.slice(0, lastDot);
  const firstDot = head.indexOf(".");
  if (firstDot < 0) return null;
  const userId = head.slice(0, firstDot);
  const issuedAtStr = head.slice(firstDot + 1);
  if (!userId || !issuedAtStr) return null;
  const issuedAtMs = Number.parseInt(issuedAtStr, 10);
  if (!Number.isFinite(issuedAtMs)) return null;

  const age = Date.now() - issuedAtMs;
  if (age < 0 || age > MAX_TOKEN_AGE_MS) return null;

  let provided: Buffer;
  try {
    provided = fromB64url(macB64);
  } catch {
    return null;
  }
  const expected = fromB64url(compute(userId, issuedAtMs));
  if (provided.length !== expected.length) return null;
  if (!timingSafeEqual(provided, expected)) return null;

  return { userId };
}
