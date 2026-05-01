/**
 * Coin pack catalog for Google Play Billing (IAP).
 *
 * Single source of truth for product IDs, pricing, coins, and bonuses.
 * Numbers come from docs/mobile-plan.md §9.5.2 — keep in sync with the
 * Google Play Console SKUs (`alyn.coins.pack1` .. `alyn.coins.pack6`).
 */

export interface CoinPack {
  /** Google Play product id, e.g. "alyn.coins.pack1" */
  productId: string;
  /** Thai display name shown to users */
  name: string;
  /** Sticker price in THB (matches Google Play SKU price) */
  priceThb: number;
  /** Base coins granted */
  coins: number;
  /** Bonus coins on top of base */
  bonus: number;
}

export const COIN_PACKS: readonly CoinPack[] = [
  {
    productId: "alyn.coins.pack1",
    name: "แพ็กเริ่มต้น",
    priceThb: 35,
    coins: 50,
    bonus: 0,
  },
  {
    productId: "alyn.coins.pack2",
    name: "แพ็กประหยัด",
    priceThb: 99,
    coins: 150,
    bonus: 5,
  },
  {
    productId: "alyn.coins.pack3",
    name: "แพ็กยอดนิยม",
    priceThb: 199,
    coins: 300,
    bonus: 20,
  },
  {
    productId: "alyn.coins.pack4",
    name: "แพ็กคุ้มค่า",
    priceThb: 399,
    coins: 600,
    bonus: 60,
  },
  {
    productId: "alyn.coins.pack5",
    name: "แพ็กพรีเมียม",
    priceThb: 799,
    coins: 1200,
    bonus: 150,
  },
  {
    productId: "alyn.coins.pack6",
    name: "แพ็กสุดคุ้ม",
    priceThb: 1590,
    coins: 2400,
    bonus: 400,
  },
] as const;

/**
 * Look up a coin pack by Google Play product id.
 * Returns null if the id is not in our catalog.
 */
export function getPack(productId: string): CoinPack | null {
  return COIN_PACKS.find((p) => p.productId === productId) ?? null;
}
