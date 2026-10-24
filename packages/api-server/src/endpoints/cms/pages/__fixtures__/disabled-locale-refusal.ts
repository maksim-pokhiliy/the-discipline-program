import { type LocaleCode } from "@repo/contracts/cms/locale";

import { cleanupRaw } from "../../../../test/helpers";
import { GERMAN } from "../../locale/__fixtures__/locale-catalog";
import { refusalOf } from "../../locale/__fixtures__/lock-race";

export type LocaleRefusals = { disabled: unknown; unknown: unknown };

export const refusalsOfDisabledAndUnknownLocale = async (
  read: (locale: LocaleCode) => Promise<unknown>,
): Promise<LocaleRefusals> => {
  const disabled = await refusalOf(read(GERMAN.code));

  await cleanupRaw.marketingLocale.delete({ where: { code: GERMAN.code } });

  try {
    return { disabled, unknown: await refusalOf(read(GERMAN.code)) };
  } finally {
    await cleanupRaw.marketingLocale.create({ data: GERMAN });
  }
};
