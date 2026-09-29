import {
  PlanDelivery as PrismaPlanDelivery,
  type ProductPlan as PrismaProductPlan,
} from "@prisma/client";
import { describe, expect, it } from "vitest";

import { PlanDelivery, type ProductPlan } from "@repo/contracts/billing/product-plan";

import { mapToProductPlan } from "./product-plan.mapper";

const BINDING_ID = "clz00000000000000000ppl1";
const PRODUCT_ID = "clz00000000000000000prd1";
const PLAN_ID = "clz00000000000000000pln1";
const CREATED_AT = new Date("2026-09-01T00:00:00.000Z");
const UPDATED_AT = new Date("2026-09-02T00:00:00.000Z");

const makeRow = (overrides: Partial<PrismaProductPlan> = {}): PrismaProductPlan => ({
  id: BINDING_ID,
  productId: PRODUCT_ID,
  planId: PLAN_ID,
  delivery: PrismaPlanDelivery.JOIN,
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT,
  ...overrides,
});

const DELIVERY_CASES: [PrismaPlanDelivery, PlanDelivery][] = [
  [PrismaPlanDelivery.JOIN, PlanDelivery.JOIN],
  [PrismaPlanDelivery.COPY, PlanDelivery.COPY],
];

describe("mapToProductPlan", () => {
  it.each(DELIVERY_CASES)("maps a %s binding to the contract shape", (prismaDelivery, delivery) => {
    const expected: ProductPlan = {
      id: BINDING_ID,
      productId: PRODUCT_ID,
      planId: PLAN_ID,
      delivery,
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
    };

    expect(mapToProductPlan(makeRow({ delivery: prismaDelivery }))).toStrictEqual(expected);
  });
});
