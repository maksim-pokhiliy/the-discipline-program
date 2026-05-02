import { type Product } from "@repo/contracts/cms/product";

import { prisma } from "../../../db/client";
import { mapToProduct } from "../../../mappers/cms";
import { findOrThrow } from "../../../utils";
import { PUBLIC_LIST_LIMIT } from "../../../utils/list-limits";

export const cmsProductPublicApi = {
  getAll: async (): Promise<Product[]> => {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { prices: { where: { isActive: true } } },
      take: PUBLIC_LIST_LIMIT,
    });

    return products.map(mapToProduct);
  },

  getBySlug: async (slug: string): Promise<Product> => {
    const product = await findOrThrow(
      prisma.product.findFirst({
        where: { slug, isActive: true },
        include: { prices: { where: { isActive: true } } },
      }),
      "Product",
    );

    return mapToProduct(product);
  },
};
