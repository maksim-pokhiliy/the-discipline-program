import { type ProductPlan as PrismaProductPlan } from "@prisma/client";

import { type ProductPlan } from "@repo/contracts/billing/product-plan";

import { PLAN_DELIVERY_MAP } from "./enum-maps";

export const mapToProductPlan = (p: PrismaProductPlan): ProductPlan => ({
  id: p.id,
  productId: p.productId,
  planId: p.planId,
  delivery: PLAN_DELIVERY_MAP[p.delivery],
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});
