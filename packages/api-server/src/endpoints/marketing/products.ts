import { type Product } from "@repo/contracts/product";

import { prisma } from "../../db/client";
import { mapToProduct } from "../../mappers";

export const marketingProductsApi = {
  getAll: async (): Promise<Product[]> => {
    const products = await prisma.product.findMany({
      where: { isActive: true, deletedAt: null },
      include: { prices: { where: { isActive: true } } },
    });

    return products.map(mapToProduct);
  },

  getBySlug: async (slug: string): Promise<Product | null> => {
    const product = await prisma.product.findFirst({
      where: { slug, isActive: true, deletedAt: null },
      include: { prices: { where: { isActive: true } } },
    });

    return product ? mapToProduct(product) : null;
  },
};
