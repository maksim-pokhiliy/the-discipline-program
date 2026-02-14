import { type Price as PrismaPrice, type Product as PrismaProduct } from "@prisma/client";

import { type Price, type Product } from "@repo/contracts/product";

export const mapToPrice = (p: PrismaPrice): Price => ({
  id: p.id,
  amountCents: p.amountCents,
  currency: p.currency,
  interval: p.interval,
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
