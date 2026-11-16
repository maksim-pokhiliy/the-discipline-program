"use client";

import { createContext, useContext } from "react";

import { SectionFieldKind, type SectionFieldKindTree } from "@repo/contracts/cms/pages";

import { fieldKindAt, textAt } from "./field-at-path";

export const SHARED_FIELD_HELPER = "Same in every language. Change it in English.";

type SectionFieldContextValue = {
  kinds: SectionFieldKindTree;
  english: Readonly<Record<string, unknown>> | null;
};

export type SectionFieldMode =
  | { mode: "plain" }
  | { mode: "word"; englishText: string }
  | { mode: "shared" };

export const SectionFieldContext = createContext<SectionFieldContextValue | null>(null);

export const useSectionField = (name: string): SectionFieldMode => {
  const context = useContext(SectionFieldContext);

  if (context === null || context.english === null) {
    return { mode: "plain" };
  }

  const kind = fieldKindAt(context.kinds, name);

  if (kind === SectionFieldKind.WORD) {
    return { mode: "word", englishText: textAt(context.english, name) };
  }

  return { mode: kind === SectionFieldKind.SHARED ? "shared" : "plain" };
};
