"use client";

import { useLayoutEffect, useRef } from "react";

import { useFormContext } from "react-hook-form";

import {
  SECTION_FIELD_KINDS,
  type SectionSchemaKey,
  type SectionWriteData,
} from "@repo/contracts/cms/pages";

import { keptWords } from "./unsaved-words";

type TranslationRefreshProps<TKey extends SectionSchemaKey> = {
  section: TKey;
  seed: SectionWriteData[TKey];
};

export const TranslationRefresh = <TKey extends SectionSchemaKey>({
  section,
  seed,
}: TranslationRefreshProps<TKey>): null => {
  const { getValues, reset, setValue } = useFormContext<Record<string, unknown>>();
  const applied = useRef(seed);

  useLayoutEffect(() => {
    if (JSON.stringify(applied.current) === JSON.stringify(seed)) {
      return;
    }

    const kept = keptWords(SECTION_FIELD_KINDS[section], applied.current, getValues(), seed);

    reset(seed, { keepFieldsRef: true });

    for (const { path, value } of kept) {
      setValue(path, value, { shouldDirty: true });
    }

    applied.current = seed;
  }, [section, seed, getValues, reset, setValue]);

  return null;
};
