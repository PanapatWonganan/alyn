import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";

/**
 * POST /api/v1/auth/logout
 *
 * Mobile logout. With a stateless JWT scheme there is no server-side session
 * to destroy — the client is expected to clear its stored tokens. This
 * endpoint exists so the mobile app has a single place to call on logout
 * (and so we can plug in a token denylist later without changing the API).
 *
 * Idempotent: returns 200 even if no Bearer token was sent.
 */
export async function POST(_request: NextRequest) {
  try {
    return apiSuccess({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
