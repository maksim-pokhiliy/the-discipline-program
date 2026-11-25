import { type Prisma } from "@prisma/client";

import { DEFAULT_LOCALE_CODE, type LocaleCode } from "@repo/contracts/cms/locale";
import { type ContactPageData } from "@repo/contracts/cms/pages";
import { type Product } from "@repo/contracts/cms/product";

import { prisma } from "../../../db/client";
import { mapToPublicProduct } from "../../../mappers/cms";

const SHOWN_PRODUCT_WHERE: Prisma.ProductWhereInput = { isActive: true };

export const PUBLIC_PRODUCT_ORDER: Prisma.ProductOrderByWithRelationInput[] = [
  { createdAt: "asc" },
  { id: "asc" },
];

export const readServedProducts = async (locale: LocaleCode, take?: number): Promise<Product[]> => {
  if (locale === DEFAULT_LOCALE_CODE) {
    const products = await prisma.product.findMany({
      where: SHOWN_PRODUCT_WHERE,
      include: { prices: { where: { isActive: true } } },
      orderBy: PUBLIC_PRODUCT_ORDER,
      ...(take === undefined ? {} : { take }),
    });

    return products.map((product) => mapToPublicProduct(product));
  }

  const products = await prisma.product.findMany({
    where: SHOWN_PRODUCT_WHERE,
    include: {
      prices: { where: { isActive: true } },
      translations: { where: { locale, isActive: true } },
    },
    orderBy: PUBLIC_PRODUCT_ORDER,
    ...(take === undefined ? {} : { take }),
  });

  return products.map((product) => mapToPublicProduct(product, product.translations[0] ?? null));
};

export const readProgramOptions = async (
  locale: LocaleCode,
): Promise<ContactPageData["programOptions"]> => {
  if (locale === DEFAULT_LOCALE_CODE) {
    return prisma.product.findMany({
      where: SHOWN_PRODUCT_WHERE,
      select: { slug: true, title: true },
      orderBy: PUBLIC_PRODUCT_ORDER,
    });
  }

  const products = await prisma.product.findMany({
    where: SHOWN_PRODUCT_WHERE,
    select: {
      slug: true,
      title: true,
      translations: { where: { locale, isActive: true }, select: { title: true } },
    },
    orderBy: PUBLIC_PRODUCT_ORDER,
  });

  return products.map((product) => ({
    slug: product.slug,
    title: product.translations[0]?.title ?? product.title,
  }));
};
