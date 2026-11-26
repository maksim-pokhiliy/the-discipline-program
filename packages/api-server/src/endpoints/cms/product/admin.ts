import {
  type AdminProductsPageData,
  type CreateProductData,
  type AdminProduct,
  type AdminProductListItem,
  type UpdateProductData,
} from "@repo/contracts/cms/product";

import { prisma } from "../../../db/client";
import { TX_BUDGET_DEFAULT } from "../../../db/transaction-config";
import { mapToAdminProduct } from "../../../mappers/cms";
import { findOrThrow, handlePrismaError } from "../../../utils";
import { ensureExclusiveFeatured, toggleExclusiveFeatured } from "../toggle-exclusive-featured";

import { type CmsProductAdminApi } from "./admin.types";
import { withFeatureIds } from "./feature-identity";
import { type DeleteImage, deleteDroppedPhoto } from "./photo-cleanup";
import { readProductDetails } from "./product-details";
import { lockProduct } from "./product-lock";
import { writeProductPrice, buildPriceData } from "./product-price";
import { productTranslationState } from "./product-translation";
import { buildProductUpdate } from "./product-update";

const includeWithPrices = { prices: { where: { isActive: true } } } as const;

export type { CmsProductAdminApi } from "./admin.types";

export const createCmsProductAdminApi = (deps: {
  deleteImage: DeleteImage;
}): CmsProductAdminApi => {
  const api: CmsProductAdminApi = {
    getAll: async (): Promise<AdminProductListItem[]> => {
      const products = await prisma.product.findMany({
        include: {
          ...includeWithPrices,
          translations: {
            select: {
              locale: true,
              isActive: true,
              updatedAt: true,
              marketingLocale: { select: { name: true } },
            },
            orderBy: { marketingLocale: { sortOrder: "asc" } },
          },
        },
        orderBy: [{ createdAt: "desc" }, { title: "asc" }],
      });

      return products.map((product) => ({
        ...mapToAdminProduct(product),
        translations: product.translations.map((row) => ({
          locale: row.locale,
          name: row.marketingLocale.name,
          state: productTranslationState(row, product.wordsUpdatedAt),
        })),
      }));
    },

    getById: readProductDetails,

    getPageData: async (): Promise<AdminProductsPageData> => {
      const products = await api.getAll();

      return { products };
    },

    create: async (data: CreateProductData): Promise<AdminProduct> => {
      try {
        const { price, features, ...productData } = data;
        const featureList = withFeatureIds(features);

        const product = await prisma.$transaction(async (tx) => {
          await ensureExclusiveFeatured(data.isFeatured === true, () =>
            tx.product.updateMany({
              where: { isFeatured: true, deletedAt: null },
              data: { isFeatured: false },
            }),
          );

          return tx.product.create({
            data: {
              ...productData,
              featureList,
              imageUrl: data.imageUrl ?? null,
              ...(price && { prices: { create: buildPriceData(price) } }),
            },
            include: includeWithPrices,
          });
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

        const { product, previousImageUrl } = await prisma.$transaction(async (tx) => {
          await lockProduct(tx, id);

          const before = await findOrThrow(tx.product.findUnique({ where: { id } }), "Product");

          await ensureExclusiveFeatured(data.isFeatured === true, () =>
            tx.product.updateMany({
              where: { isFeatured: true, deletedAt: null, id: { not: id } },
              data: { isFeatured: false },
            }),
          );

          const update = buildProductUpdate(before, productData, featureList);

          if (price) {
            await writeProductPrice(tx, id, price);
          }

          const product = await tx.product.update({
            where: { id, deletedAt: null },
            data: update,
            include: includeWithPrices,
          });

          return { product, previousImageUrl: before.imageUrl };
        }, TX_BUDGET_DEFAULT);

        await deleteDroppedPhoto(deps.deleteImage, id, previousImageUrl, data.imageUrl);

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
              where: { isFeatured: true, deletedAt: null, id: { not: id } },
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

  return api;
};
