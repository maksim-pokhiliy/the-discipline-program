"use client";

import { useMemo } from "react";

import { type DefaultValues, type UseFormReturn, useForm } from "react-hook-form";

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
  seed: SectionWriteData[TKey];
  canSave: boolean;
  handleSave: () => Promise<void>;
  handleClear: () => void;
};

const isSectionDefaults = <TKey extends SectionSchemaKey>(
  section: TKey,
  value: unknown,
): value is DefaultValues<SectionWriteData[TKey]> => isSectionWriteData(section, value);

export const useSectionForm = <TKey extends SectionSchemaKey>({
  section,
  isDefaultLocale,
  isLoading,
  isImageBusy,
  onSave,
}: SectionFormOptions<TKey>): SectionFormResult<TKey> => {
  const values = useMemo<SectionWriteData[TKey]>(() => {
    if (isDefaultLocale) {
      return section.data;
    }

    const seed = buildTranslationSeed(SECTION_FIELD_KINDS[section.section], section.data);

    return isSectionWriteData<TKey>(section.section, seed) ? seed : section.data;
  }, [isDefaultLocale, section.section, section.data]);
  const methods = useForm<SectionWriteData[TKey]>(
    isDefaultLocale
      ? { values }
      : isSectionDefaults<TKey>(section.section, values)
        ? { defaultValues: values }
        : {},
  );
  const canConfirm =
    !isDefaultLocale && section.translation?.state === SectionTranslationState.ENGLISH_NEWER;
  const canSave = !isLoading && !isImageBusy && (methods.formState.isDirty || canConfirm);
  const handleSave = methods.handleSubmit((data) =>
    onSave({
      section: section.section,
      data: isDefaultLocale ? data : parseSectionWriteData(section.section, data),
    }),
  );
  const handleClear = () => {
    methods.reset(values, { keepFieldsRef: true });
    onSave({ section: section.section, data: {} });
  };

  return { methods, seed: values, canSave, handleSave, handleClear };
};
