import {
  type Price as PrismaPrice,
  type Product as PrismaProduct,
  type Prisma,
} from "@prisma/client";
import { z } from "zod";

import {
  type AdminProduct,
  type Price,
  type Product,
  type ProductFeature,
  productFeatureSchema,
} from "@repo/contracts/cms/product";
import { InternalServerError } from "@repo/errors";

import { CURRENCY_MAP } from "../common";

import { PERIOD_UNIT_MAP } from "./enum-maps";

export const mapToPrice = (p: PrismaPrice): Price => ({
  id: p.id,
  amountCents: p.amountCents,
  currency: CURRENCY_MAP[p.currency],
  periodCount: p.periodCount,
  periodUnit: PERIOD_UNIT_MAP[p.periodUnit],
  autoRenew: p.autoRenew,
  isActive: p.isActive,
});

type ProductWithPrices = PrismaProduct & { prices: PrismaPrice[] };

const featureListSchema = z.array(productFeatureSchema);

export const parseFeatureList = (value: Prisma.JsonValue, productId: string): ProductFeature[] => {
  const parsed = featureListSchema.safeParse(value);

  if (!parsed.success) {
    throw new InternalServerError("A stored feature list does not match its shape", {
      productId,
      issues: parsed.error.issues,
    });
  }

  return parsed.data;
};

export const mapToAdminProduct = (p: ProductWithPrices): AdminProduct => ({
  id: p.id,
  slug: p.slug,
  title: p.title,
  description: p.description,
  features: parseFeatureList(p.featureList, p.id),
  imageUrl: p.imageUrl,
  isFeatured: p.isFeatured,
  isActive: p.isActive,
  prices: p.prices.map(mapToPrice),
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});

export const mapToPublicProduct = (p: ProductWithPrices): Product => {
  const product = mapToAdminProduct(p);

  return { ...product, features: product.features.map(({ text }) => text) };
};
