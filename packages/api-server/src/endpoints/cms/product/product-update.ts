import { type Prisma, type Product as PrismaProduct } from "@prisma/client";

import { type ProductFeature, type UpdateProductData } from "@repo/contracts/cms/product";

import { parseFeatureList } from "../../../mappers/cms";

import { haveEnglishWordsChanged } from "./english-words";

type ProductFields = Omit<UpdateProductData, "features" | "price">;

export const buildProductUpdate = (
  before: PrismaProduct,
  fields: ProductFields,
  features: ProductFeature[] | undefined,
): Prisma.ProductUpdateInput => {
  const previous = { ...before, features: parseFeatureList(before.featureList, before.id) };
  const after = {
    title: fields.title ?? before.title,
    description: fields.description ?? before.description,
    features: features ?? previous.features,
  };

  return {
    ...(fields.title !== undefined && { title: fields.title }),
    ...(fields.slug !== undefined && { slug: fields.slug }),
    ...(fields.description !== undefined && { description: fields.description }),
    ...(fields.isFeatured !== undefined && { isFeatured: fields.isFeatured }),
    ...(fields.isActive !== undefined && { isActive: fields.isActive }),
    ...(fields.imageUrl !== undefined && { imageUrl: fields.imageUrl }),
    ...(features !== undefined && { featureList: features }),
    ...(haveEnglishWordsChanged(previous, after) && { wordsUpdatedAt: new Date() }),
  };
};
