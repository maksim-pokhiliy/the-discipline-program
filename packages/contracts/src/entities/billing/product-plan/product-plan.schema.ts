import { z } from "zod";

import { PlanDelivery } from "./product-plan.constants";

export const planDeliverySchema = z.nativeEnum(PlanDelivery);

export const productPlanSchema = z.object({
  id: z.string().cuid(),
  productId: z.string().cuid(),
  planId: z.string().cuid(),
  delivery: planDeliverySchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});
