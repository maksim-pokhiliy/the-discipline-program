import { type Prisma } from "@prisma/client";

import {
  DEFAULT_LOCALE_CODE,
  DEFAULT_LOCALE_NAME,
  type LocaleCode,
} from "@repo/contracts/cms/locale";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../../db/client";
import { findOrThrow } from "../../../utils";

export const LOCALE_ORDER: Prisma.MarketingLocaleOrderByWithRelationInput[] = [
  { sortOrder: "asc" },
  { code: "asc" },
];

export const ensureDefaultLocale = async (): Promise<void> => {
  await prisma.marketingLocale.createMany({
    data: [{ code: DEFAULT_LOCALE_CODE, name: DEFAULT_LOCALE_NAME }],
    skipDuplicates: true,
  });
};

export const assertAdminLocale = async (code: LocaleCode): Promise<void> => {
  if (code === DEFAULT_LOCALE_CODE) {
    await ensureDefaultLocale();

    return;
  }

  await findOrThrow(
    prisma.marketingLocale.findUnique({ where: { code }, select: { code: true } }),
    "Locale",
  );
};

export const assertPublicLocale = async (code: LocaleCode): Promise<void> => {
  if (code === DEFAULT_LOCALE_CODE) {
    return;
  }

  const locale = await prisma.marketingLocale.findUnique({
    where: { code },
    select: { isEnabled: true },
  });

  if (!locale?.isEnabled) {
    throw new NotFoundError(`Locale ${code} not found`, { code });
  }
};
