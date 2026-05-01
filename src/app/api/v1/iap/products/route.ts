import { apiSuccess, handleApiError } from "@/lib/api-response";
import { COIN_PACKS } from "@/lib/iap/products";

/**
 * GET /api/v1/iap/products
 *
 * Public catalog of Google Play coin packs. No auth required — used by the
 * Flutter client to render the top-up screen and cross-check product ids
 * returned from `InAppPurchase.queryProductDetails()`.
 *
 * Response: { products: [{ productId, name, coins, bonus, total, priceThb }] }
 */
export async function GET() {
  try {
    const products = COIN_PACKS.map((p) => ({
      productId: p.productId,
      name: p.name,
      coins: p.coins,
      bonus: p.bonus,
      total: p.coins + p.bonus,
      priceThb: p.priceThb,
    }));

    return apiSuccess({ products });
  } catch (error) {
    return handleApiError(error);
  }
}
