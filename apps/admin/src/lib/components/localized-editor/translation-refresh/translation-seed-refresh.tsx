"use client";

import { useLayoutEffect, useRef } from "react";

import { useFormContext } from "react-hook-form";

import { type SectionFieldKindTree } from "@repo/contracts/cms/pages";

import { keptWords } from "./unsaved-words";

type TranslationSeedRefreshProps = {
  kinds: SectionFieldKindTree;
  seed: Record<string, unknown>;
};

export const TranslationSeedRefresh = ({ kinds, seed }: TranslationSeedRefreshProps): null => {
  const { getValues, reset, setValue } = useFormContext<Record<string, unknown>>();
  const applied = useRef(seed);

  useLayoutEffect(() => {
    if (JSON.stringify(applied.current) === JSON.stringify(seed)) {
      return;
    }

    const kept = keptWords(kinds, applied.current, getValues(), seed);

    reset(seed, { keepFieldsRef: true });

    for (const { path, value } of kept) {
      setValue(path, value, { shouldDirty: true });
    }

    applied.current = seed;
  }, [kinds, seed, getValues, reset, setValue]);

  return null;
};
