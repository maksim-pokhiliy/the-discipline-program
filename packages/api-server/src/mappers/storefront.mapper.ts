import { type MarketingStorefrontProgram } from "@prisma/client";

import { type StorefrontProgram } from "@repo/contracts/storefront";

export const mapToStorefrontProgram = (p: MarketingStorefrontProgram): StorefrontProgram => ({
  id: p.id,
  title: p.title,
  slug: p.slug,
  description: p.description,
  priceLabel: p.priceLabel,
  features: p.features,
  isActive: p.isActive,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});
