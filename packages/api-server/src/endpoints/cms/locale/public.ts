import { type PublicLocale } from "@repo/contracts/cms/locale";

import { prisma } from "../../../db/client";
import { mapToPublicLocale } from "../../../mappers/cms";

import { LOCALE_ORDER } from "./locale-access";

export const cmsLocalePublicApi = {
  getEnabledLocales: async (): Promise<PublicLocale[]> => {
    const locales = await prisma.marketingLocale.findMany({
      where: { isEnabled: true },
      orderBy: LOCALE_ORDER,
      select: { code: true, name: true },
    });

    return locales.map(mapToPublicLocale);
  },
};
