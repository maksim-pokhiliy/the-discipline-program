"use client";

import { useMemo } from "react";

import { type UseFormReturn, useForm } from "react-hook-form";

import {
  type AdminPageSection,
  SECTION_FIELD_KINDS,
  SectionTranslationState,
  type SectionSchemaKey,
  type SectionWriteBody,
  type SectionWriteData,
} from "@repo/contracts/cms/pages";

import {
  buildTranslationSeed,
  isSectionWriteData,
  parseSectionWriteData,
} from "./translation-form-values";

type SectionFormOptions<TKey extends SectionSchemaKey> = {
  section: Extract<AdminPageSection, { section: TKey }>;
  isDefaultLocale: boolean;
  isLoading: boolean;
  isImageBusy: boolean;
  onSave: (body: SectionWriteBody<TKey>) => void;
};

type SectionFormResult<TKey extends SectionSchemaKey> = {
  methods: UseFormReturn<SectionWriteData[TKey]>;
  canSave: boolean;
  handleSave: () => Promise<void>;
  handleClear: () => void;
};

export const useSectionForm = <TKey extends SectionSchemaKey>({
  section,
  isDefaultLocale,
  isLoading,
  isImageBusy,
  onSave,
}: SectionFormOptions<TKey>): SectionFormResult<TKey> => {
  const values = useMemo(() => {
    if (isDefaultLocale) {
      return section.data;
    }

    const seed = buildTranslationSeed(SECTION_FIELD_KINDS[section.section], section.data);

    return isSectionWriteData(section.section, seed) ? seed : section.data;
  }, [isDefaultLocale, section]);
  const methods = useForm<SectionWriteData[TKey]>({ values });
  const canConfirm =
    !isDefaultLocale && section.translation?.state === SectionTranslationState.ENGLISH_NEWER;
  const canSave = !isLoading && !isImageBusy && (methods.formState.isDirty || canConfirm);
  const handleSave = methods.handleSubmit((data) =>
    onSave({
      section: section.section,
      data: isDefaultLocale ? data : parseSectionWriteData(section.section, data),
    }),
  );
  const handleClear = () => onSave({ section: section.section, data: {} });

  return { methods, canSave, handleSave, handleClear };
};
