import {
  type CreateProductData,
  type Product,
  type UpdateProductData,
  ProductCurrency,
  PriceInterval,
} from "@repo/contracts/product";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToProduct } from "../../mappers";
import { handlePrismaError } from "../../utils";

const includeWithPrices = { prices: { where: { isActive: true } } } as const;

export const adminProductsApi = {
  getAll: async (): Promise<Product[]> => {
    const products = await prisma.product.findMany({
      include: includeWithPrices,
      orderBy: [{ createdAt: "desc" }, { title: "asc" }],
    });

    return products.map(mapToProduct);
  },

  getById: async (id: string): Promise<Product | null> => {
    const product = await prisma.product.findUnique({
      where: { id },
      include: includeWithPrices,
    });

    if (!product) {
      return null;
    }

    return mapToProduct(product);
  },

  getPageData: async () => {
    const products = await adminProductsApi.getAll();

    return { products };
  },

  create: async (data: CreateProductData): Promise<Product> => {
    try {
      const { price, ...productData } = data;

      const product = await prisma.product.create({
        data: {
          ...productData,
          ...(price && {
            prices: {
              create: {
                amountCents: price.amountCents,
                currency: price.currency ?? ProductCurrency.USD,
                interval: price.interval ?? PriceInterval.MONTHLY,
              },
            },
          }),
        },
        include: includeWithPrices,
      });

      return mapToProduct(product);
    } catch (error) {
      return handlePrismaError(error, { entity: "Product", field: "slug" });
    }
  },

  update: async (id: string, data: UpdateProductData): Promise<Product> => {
    try {
      const { price, ...productData } = data;

      const product = await prisma.$transaction(async (tx) => {
        if (price) {
          const existingPrice = await tx.price.findFirst({
            where: { productId: id, isActive: true },
          });

          if (existingPrice) {
            await tx.price.update({
              where: { id: existingPrice.id },
              data: {
                amountCents: price.amountCents,
                currency: price.currency,
                interval: price.interval,
              },
            });
          } else {
            await tx.price.create({
              data: {
                productId: id,
                amountCents: price.amountCents,
                currency: price.currency ?? ProductCurrency.USD,
                interval: price.interval ?? PriceInterval.MONTHLY,
              },
            });
          }
        }

        return tx.product.update({
          where: { id },
          data: productData,
          include: includeWithPrices,
        });
      });

      return mapToProduct(product);
    } catch (error) {
      return handlePrismaError(error, { entity: "Product", field: "slug" });
    }
  },

  delete: async (id: string): Promise<void> => {
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundError("Product not found", { id });
    }

    await prisma.product.delete({ where: { id } });
  },

  toggleStatus: async (id: string): Promise<Product> => {
    const product = await prisma.product.findUnique({
      where: { id },
      include: includeWithPrices,
    });

    if (!product) {
      throw new NotFoundError("Product not found", { id });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { isActive: !product.isActive },
      include: includeWithPrices,
    });

    return mapToProduct(updated);
  },

  toggleFeatured: async (id: string): Promise<Product> => {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id },
        include: includeWithPrices,
      });

      if (!product) {
        throw new NotFoundError("Product not found", { id });
      }

      const newValue = !product.isFeatured;

      if (newValue === true) {
        await tx.product.updateMany({
          where: { isFeatured: true, id: { not: id } },
          data: { isFeatured: false },
        });
      }

      const updated = await tx.product.update({
        where: { id },
        data: { isFeatured: newValue },
        include: includeWithPrices,
      });

      return mapToProduct(updated);
    });
  },
};
