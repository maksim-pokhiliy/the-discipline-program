import {
  type AdminProductsPageData,
  type CreateProductData,
  type AdminProduct,
  type UpdateProductData,
} from "@repo/contracts/cms/product";

import { prisma } from "../../../db/client";
import { mapToAdminProduct } from "../../../mappers/cms";
import { findOrThrow, handlePrismaError } from "../../../utils";
import { toggleExclusiveFeatured } from "../toggle-exclusive-featured";

import { withFeatureIds } from "./feature-identity";
import { writeProductPrice, buildPriceData } from "./product-price";
import { buildProductUpdate } from "./product-update";

const includeWithPrices = { prices: { where: { isActive: true } } } as const;

export const cmsProductAdminApi = {
  getAll: async (): Promise<AdminProduct[]> => {
    const products = await prisma.product.findMany({
      include: includeWithPrices,
      orderBy: [{ createdAt: "desc" }, { title: "asc" }],
    });

    return products.map(mapToAdminProduct);
  },

  getById: async (id: string): Promise<AdminProduct> => {
    const product = await findOrThrow(
      prisma.product.findUnique({ where: { id }, include: includeWithPrices }),
      "Product",
    );

    return mapToAdminProduct(product);
  },

  getPageData: async (): Promise<AdminProductsPageData> => {
    const products = await cmsProductAdminApi.getAll();

    return { products };
  },

  create: async (data: CreateProductData): Promise<AdminProduct> => {
    try {
      const { price, features, ...productData } = data;
      const featureList = withFeatureIds(features);

      const product = await prisma.product.create({
        data: {
          ...productData,
          featureList,
          ...(price && { prices: { create: buildPriceData(price) } }),
        },
        include: includeWithPrices,
      });

      return mapToAdminProduct(product);
    } catch (error) {
      return handlePrismaError(error, { entity: "Product", field: "slug" });
    }
  },

  update: async (id: string, data: UpdateProductData): Promise<AdminProduct> => {
    try {
      const { price, features, ...productData } = data;
      const featureList = features === undefined ? undefined : withFeatureIds(features);

      const product = await prisma.$transaction(async (tx) => {
        const before = await findOrThrow(tx.product.findUnique({ where: { id } }), "Product");
        const update = buildProductUpdate(before, productData, featureList);

        if (price) {
          await writeProductPrice(tx, id, price);
        }

        return tx.product.update({
          where: { id, deletedAt: null },
          data: update,
          include: includeWithPrices,
        });
      });

      return mapToAdminProduct(product);
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

  toggleStatus: async (id: string): Promise<AdminProduct> => {
    const product = await findOrThrow(
      prisma.product.findUnique({ where: { id }, include: includeWithPrices }),
      "Product",
    );

    const updated = await prisma.product.update({
      where: { id },
      data: { isActive: !product.isActive },
      include: includeWithPrices,
    });

    return mapToAdminProduct(updated);
  },

  toggleFeatured: async (id: string): Promise<AdminProduct> =>
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
        map: mapToAdminProduct,
        entityName: "Product",
        id,
      }),
    ),
};
