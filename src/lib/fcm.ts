/**
 * Firebase Cloud Messaging (FCM) HTTP v1 sender.
 *
 * Mock-friendly: if `FCM_SERVICE_ACCOUNT_JSON` is unset, sends are logged
 * with a `[FCM MOCK]` prefix and resolved as success — same pattern as
 * `src/lib/email.ts` and `src/lib/payment/omise.ts`. No package needs to
 * be installed for mock mode.
 *
 * For live mode the operator must set:
 *   FCM_SERVICE_ACCOUNT_JSON  — full service-account JSON string
 *   FCM_PROJECT_ID            — Firebase project id (also in the JSON)
 *
 * The implementation uses `google-auth-library` if available (loaded via
 * runtime-computed import to avoid Turbopack bundling). To go live, run:
 *   npm install google-auth-library
 */

import crypto from "crypto";

export interface FcmMessagePayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

interface FcmSendResult {
  ok: boolean;
  // Tokens that came back as UNREGISTERED / INVALID — caller should prune these.
  invalidTokens: string[];
  // FCM message id when delivered to a single token (best-effort).
  messageIds: string[];
}

const FCM_HOST = "https://fcm.googleapis.com";

function isMock(): boolean {
  return !process.env.FCM_SERVICE_ACCOUNT_JSON;
}

interface ServiceAccount {
  client_email: string;
  private_key: string;
  project_id: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  // Reuse a cached token until it has 60s left.
  if (cachedToken && cachedToken.expiresAt - Date.now() > 60_000) {
    return cachedToken.token;
  }

  // We sign a JWT with the service account key and exchange it for a token.
  // This avoids depending on google-auth-library entirely.
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const enc = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");
  const unsigned = `${enc(header)}.${enc(claim)}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer
    .sign(sa.private_key)
    .toString("base64url");
  const jwt = `${unsigned}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }).toString(),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`FCM token exchange failed: ${res.status} ${text}`);
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return json.access_token;
}

function loadServiceAccount(): ServiceAccount | null {
  const raw = process.env.FCM_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ServiceAccount;
  } catch (e) {
    console.error("[FCM] Failed to parse FCM_SERVICE_ACCOUNT_JSON:", e);
    return null;
  }
}

/**
 * Send a single FCM HTTP v1 message to one device token.
 * Returns { ok, invalid } — `invalid` is true when the token is dead and
 * should be pruned from the database.
 */
async function sendOne(
  token: string,
  payload: FcmMessagePayload,
  sa: ServiceAccount
): Promise<{ ok: boolean; invalid: boolean; messageId?: string }> {
  const projectId = process.env.FCM_PROJECT_ID || sa.project_id;
  const accessToken = await getAccessToken(sa);
  const url = `${FCM_HOST}/v1/projects/${projectId}/messages:send`;

  const body = {
    message: {
      token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      // FCM data values must be strings.
      data: payload.data ?? {},
      android: {
        priority: "HIGH" as const,
      },
      apns: {
        headers: { "apns-priority": "10" },
        payload: { aps: { sound: "default" } },
      },
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (res.ok) {
    const j = (await res.json().catch(() => ({}))) as { name?: string };
    return { ok: true, invalid: false, messageId: j.name };
  }

  // 404 UNREGISTERED or 400 INVALID_ARGUMENT mean the token is dead.
  // Try to surface the FCM error code.
  let dead = false;
  try {
    const errJson = (await res.json()) as {
      error?: { details?: Array<{ errorCode?: string }> };
    };
    const code = errJson?.error?.details?.[0]?.errorCode;
    dead = code === "UNREGISTERED" || code === "INVALID_ARGUMENT";
  } catch {
    // ignore parse errors
  }
  return { ok: false, invalid: dead };
}

/**
 * Send the same payload to all of a user's device tokens. Best-effort:
 * we collect dead tokens but the caller decides whether to prune them
 * (see `sendPushToUser` in notification-service.ts).
 */
export async function sendFcmToTokens(
  tokens: string[],
  payload: FcmMessagePayload
): Promise<FcmSendResult> {
  if (tokens.length === 0) {
    return { ok: true, invalidTokens: [], messageIds: [] };
  }

  if (isMock()) {
    console.log(
      `[FCM MOCK] Would send to ${tokens.length} token(s):`,
      payload.title,
      "—",
      payload.body
    );
    return { ok: true, invalidTokens: [], messageIds: [] };
  }

  const sa = loadServiceAccount();
  if (!sa) {
    return { ok: false, invalidTokens: [], messageIds: [] };
  }

  const results = await Promise.allSettled(
    tokens.map((t) => sendOne(t, payload, sa))
  );
  const invalidTokens: string[] = [];
  const messageIds: string[] = [];
  let okCount = 0;
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      if (r.value.ok) {
        okCount++;
        if (r.value.messageId) messageIds.push(r.value.messageId);
      } else if (r.value.invalid) {
        invalidTokens.push(tokens[i]);
      }
    }
  });
  return {
    ok: okCount > 0,
    invalidTokens,
    messageIds,
  };
}
