import { type MarketingLocale } from "@prisma/client";

import { DEFAULT_LOCALE_CODE, type Locale, type PublicLocale } from "@repo/contracts/cms/locale";

export const mapToLocale = (l: MarketingLocale): Locale => ({
  code: l.code,
  name: l.name,
  isEnabled: l.isEnabled,
  isDefault: l.code === DEFAULT_LOCALE_CODE,
  sortOrder: l.sortOrder,
  createdAt: l.createdAt,
  updatedAt: l.updatedAt,
});

export const mapToPublicLocale = (l: Pick<MarketingLocale, "code" | "name">): PublicLocale => ({
  code: l.code,
  name: l.name,
});
