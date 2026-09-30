import { type Price as PrismaPrice, type Product as PrismaProduct } from "@prisma/client";

import { type Price, type Product } from "@repo/contracts/cms/product";

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

export const mapToProduct = (p: ProductWithPrices): Product => ({
  id: p.id,
  slug: p.slug,
  title: p.title,
  description: p.description,
  features: p.features,
  isFeatured: p.isFeatured,
  isActive: p.isActive,
  prices: p.prices.map(mapToPrice),
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});
