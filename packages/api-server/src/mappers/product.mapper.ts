import { type Price as PrismaPrice, type Product as PrismaProduct } from "@prisma/client";

import {
  type Price,
  type Product,
  type PriceInterval,
  type ProductCurrency,
} from "@repo/contracts/product";

export const mapToPrice = (p: PrismaPrice): Price => ({
  id: p.id,
  amountCents: p.amountCents,
  currency: p.currency as ProductCurrency,
  interval: p.interval as PriceInterval,
  isActive: p.isActive,
});

type ProductWithPrices = PrismaProduct & { prices: PrismaPrice[] };

export const mapToProduct = (p: ProductWithPrices): Product => ({
  id: p.id,
  slug: p.slug,
  title: p.title,
  description: p.description,
  features: p.features,
  trainingPlanId: p.trainingPlanId,
  isActive: p.isActive,
  prices: p.prices.map(mapToPrice),
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});
