import { apiSuccess } from "@/lib/api-response";
import { getVisiblePackages } from "@/lib/payment/paysolutions";

// GET /api/payments/packages - List coin packages available for purchase
export async function GET() {
  return apiSuccess({ packages: getVisiblePackages() });
}
