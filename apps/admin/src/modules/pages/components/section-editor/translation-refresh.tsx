"use client";

import { type ReactElement } from "react";

import {
  SECTION_FIELD_KINDS,
  type SectionSchemaKey,
  type SectionWriteData,
} from "@repo/contracts/cms/pages";

import { TranslationSeedRefresh } from "@app/lib/components/localized-editor/translation-refresh";

type TranslationRefreshProps<TKey extends SectionSchemaKey> = {
  section: TKey;
  seed: SectionWriteData[TKey];
};

export const TranslationRefresh = <TKey extends SectionSchemaKey>({
  section,
  seed,
}: TranslationRefreshProps<TKey>): ReactElement => (
  <TranslationSeedRefresh kinds={SECTION_FIELD_KINDS[section]} seed={seed} />
);
