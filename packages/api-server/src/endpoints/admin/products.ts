import {
  type CreateProductData,
  type Product,
  type UpdateProductData,
} from "@repo/contracts/product";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToProduct } from "../../mappers";
import { handlePrismaError } from "../../utils";

const includeWithPrices = { prices: { where: { isActive: true } } } as const;

export const adminProductsApi = {
  getAll: async (): Promise<Product[]> => {
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
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

    if (!product || product.deletedAt) {
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
                currency: price.currency ?? "USD",
                interval: price.interval ?? "MONTHLY",
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

      if (price) {
        const existingPrice = await prisma.price.findFirst({
          where: { productId: id, isActive: true },
        });

        if (existingPrice) {
          await prisma.price.update({
            where: { id: existingPrice.id },
            data: {
              amountCents: price.amountCents,
              currency: price.currency,
              interval: price.interval,
            },
          });
        } else {
          await prisma.price.create({
            data: {
              productId: id,
              amountCents: price.amountCents,
              currency: price.currency ?? "USD",
              interval: price.interval ?? "MONTHLY",
            },
          });
        }
      }

      const product = await prisma.product.update({
        where: { id },
        data: productData,
        include: includeWithPrices,
      });

      return mapToProduct(product);
    } catch (error) {
      return handlePrismaError(error, { entity: "Product", field: "slug" });
    }
  },

  delete: async (id: string): Promise<void> => {
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product || product.deletedAt) {
      throw new NotFoundError("Product not found", { id });
    }

    await prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        slug: `${product.slug}-deleted-${Date.now()}`,
      },
    });
  },

  toggleStatus: async (id: string): Promise<Product> => {
    const product = await prisma.product.findUnique({
      where: { id },
      include: includeWithPrices,
    });

    if (!product || product.deletedAt) {
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

      if (!product || product.deletedAt) {
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
