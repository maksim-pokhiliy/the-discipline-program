import {
  type AdminProductsPageData,
  type CreateProductData,
  type Product,
  type UpdateProductData,
  ProductCurrency,
  PriceInterval,
} from "@repo/contracts/cms/product";

import { prisma } from "../../../db/client";
import { mapToProduct } from "../../../mappers/cms";
import { findOrThrow, handlePrismaError } from "../../../utils";
import { DEFAULT_LIST_LIMIT } from "../../../utils/list-limits";
import { toggleExclusiveFeatured } from "../toggle-exclusive-featured";

const includeWithPrices = { prices: { where: { isActive: true } } } as const;

export const cmsProductAdminApi = {
  getAll: async (): Promise<Product[]> => {
    const products = await prisma.product.findMany({
      include: includeWithPrices,
      orderBy: [{ createdAt: "desc" }, { title: "asc" }],
      take: DEFAULT_LIST_LIMIT,
    });

    return products.map(mapToProduct);
  },

  getById: async (id: string): Promise<Product> => {
    const product = await findOrThrow(
      prisma.product.findUnique({ where: { id }, include: includeWithPrices }),
      "Product",
    );

    return mapToProduct(product);
  },

  getPageData: async (): Promise<AdminProductsPageData> => {
    const products = await cmsProductAdminApi.getAll();

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
          data: {
            ...(productData.title !== undefined && { title: productData.title }),
            ...(productData.slug !== undefined && { slug: productData.slug }),
            ...(productData.description !== undefined && {
              description: productData.description,
            }),
            ...(productData.features !== undefined && { features: productData.features }),
            ...(productData.isFeatured !== undefined && {
              isFeatured: productData.isFeatured,
            }),
            ...(productData.isActive !== undefined && { isActive: productData.isActive }),
          },
          include: includeWithPrices,
        });
      });

      return mapToProduct(product);
    } catch (error) {
      return handlePrismaError(error, { entity: "Product", field: "slug" });
    }
  },

  delete: async (id: string): Promise<void> => {
    await findOrThrow(prisma.product.findUnique({ where: { id } }), "Product");

    try {
      await prisma.product.delete({ where: { id } });
    } catch (error) {
      return handlePrismaError(error, { entity: "Product" });
    }
  },

  toggleStatus: async (id: string): Promise<Product> => {
    const product = await findOrThrow(
      prisma.product.findUnique({ where: { id }, include: includeWithPrices }),
      "Product",
    );

    const updated = await prisma.product.update({
      where: { id },
      data: { isActive: !product.isActive },
      include: includeWithPrices,
    });

    return mapToProduct(updated);
  },

  toggleFeatured: async (id: string): Promise<Product> =>
    prisma.$transaction((tx) =>
      toggleExclusiveFeatured({
        find: () => tx.product.findUnique({ where: { id }, include: includeWithPrices }),
        unfeatureOthers: () =>
          tx.product.updateMany({
            where: { isFeatured: true, id: { not: id } },
            data: { isFeatured: false },
          }),
        update: (isFeatured) =>
          tx.product.update({ where: { id }, data: { isFeatured }, include: includeWithPrices }),
        map: mapToProduct,
        entityName: "Product",
        id,
      }),
    ),
};
