import { type Product } from "@repo/contracts/product";

import { prisma } from "../../db/client";
import { mapToProduct } from "../../mappers";
import { findOrThrow } from "../../utils";

export const marketingProductsApi = {
  getAll: async (): Promise<Product[]> => {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { prices: { where: { isActive: true } } },
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
