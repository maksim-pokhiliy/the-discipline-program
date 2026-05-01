import { type Prisma } from "@prisma/client";

export type PageSeed = {
  slug: string;
  title: string;
  seoTitle: string;
  seoDesc: string;
};

export type SectionSeed = {
  pageSlug: string;
  section: string;
  data: Prisma.InputJsonObject;
};
