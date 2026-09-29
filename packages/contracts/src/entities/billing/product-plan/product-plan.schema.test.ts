import { describe, expect, it } from "vitest";

import { PlanDelivery } from "./product-plan.constants";
import { productPlanSchema } from "./product-plan.schema";

const PRODUCT_PLAN_ROW = {
  id: "clz00000000000000000ppl1",
  productId: "clz00000000000000000prd1",
  planId: "clz00000000000000000pln1",
  delivery: PlanDelivery.JOIN,
  createdAt: new Date("2026-09-01T00:00:00.000Z"),
  updatedAt: new Date("2026-09-02T00:00:00.000Z"),
};

const DELIVERIES = ["JOIN", "COPY"];

describe("productPlanSchema", () => {
  it("parses a complete binding", () => {
    expect(productPlanSchema.parse(PRODUCT_PLAN_ROW)).toEqual(PRODUCT_PLAN_ROW);
  });

  it("rejects a delivery outside PlanDelivery", () => {
    expect(productPlanSchema.safeParse({ ...PRODUCT_PLAN_ROW, delivery: "LINK" }).success).toBe(
      false,
    );
  });

  it.each(DELIVERIES)("accepts the delivery %s", (delivery) => {
    expect(productPlanSchema.safeParse({ ...PRODUCT_PLAN_ROW, delivery }).success).toBe(true);
  });

  it("rejects a planId that is not a cuid", () => {
    expect(productPlanSchema.safeParse({ ...PRODUCT_PLAN_ROW, planId: "not-a-cuid" }).success).toBe(
      false,
    );
  });
});
