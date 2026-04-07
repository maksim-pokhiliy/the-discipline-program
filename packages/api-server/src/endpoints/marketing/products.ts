import { type Product } from "@repo/contracts/product";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToProduct } from "../../mappers";

export const marketingProductsApi = {
  getAll: async (): Promise<Product[]> => {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { prices: { where: { isActive: true } } },
    });

    return products.map(mapToProduct);
  },

  getBySlug: async (slug: string): Promise<Product> => {
    const product = await prisma.product.findFirst({
      where: { slug, isActive: true },
      include: { prices: { where: { isActive: true } } },
    });

    if (!product) {
      throw new NotFoundError("Product not found", { slug });
    }

    return mapToProduct(product);
  },
};
