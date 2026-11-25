import { type Prisma } from "@prisma/client";

import { type ContactPageData } from "@repo/contracts/cms/pages";
import { type Product } from "@repo/contracts/cms/product";

import { prisma } from "../../../db/client";
import { mapToPublicProduct } from "../../../mappers/cms";

const SHOWN_PRODUCT_WHERE: Prisma.ProductWhereInput = { isActive: true };

export const PUBLIC_PRODUCT_ORDER: Prisma.ProductOrderByWithRelationInput[] = [
  { createdAt: "asc" },
  { id: "asc" },
];

export const readServedProducts = async (take?: number): Promise<Product[]> => {
  const products = await prisma.product.findMany({
    where: SHOWN_PRODUCT_WHERE,
    include: { prices: { where: { isActive: true } } },
    orderBy: PUBLIC_PRODUCT_ORDER,
    ...(take === undefined ? {} : { take }),
  });

  return products.map(mapToPublicProduct);
};

export const readProgramOptions = async (): Promise<ContactPageData["programOptions"]> =>
  prisma.product.findMany({
    where: SHOWN_PRODUCT_WHERE,
    select: { slug: true, title: true },
    orderBy: PUBLIC_PRODUCT_ORDER,
  });
