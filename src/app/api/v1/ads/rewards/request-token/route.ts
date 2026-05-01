import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { rateLimitRequest } from "@/lib/rate-limit";
import { signCustomData } from "@/lib/admob/customData";

/**
 * POST /api/v1/ads/rewards/request-token
 *
 * Issues a short-lived HMAC-signed token for the mobile client to attach
 * as `customData` on the rewarded ad. The token binds the eventual SSV
 * callback to the calling user — without it we'd have no trustworthy
 * userId on the (unauthenticated) Google callback.
 */
export async function POST(request: NextRequest) {
  try {
    const limit = rateLimitRequest(request, "v1:ads:token", 30, 60_000);
    if (!limit.success) {
      return apiError("คำขอมากเกินไป", 429, "RATE_LIMITED");
    }

    const session = await requireAuth();

    let body: unknown = null;
    try {
      body = await request.json();
    } catch {
      // body is optional — Flutter clients may send {} or {adUnitId}
    }
    const adUnitId =
      body && typeof body === "object" && "adUnitId" in body
        ? String((body as Record<string, unknown>).adUnitId ?? "")
        : "";
    if (!adUnitId) {
      return apiError("ต้องระบุ adUnitId", 400, "BAD_REQUEST");
    }

    const customData = signCustomData(session.user.id);

    return apiSuccess({ customData });
  } catch (error) {
    return handleApiError(error);
  }
}
