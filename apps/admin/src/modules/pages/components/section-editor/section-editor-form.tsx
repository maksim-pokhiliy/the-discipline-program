"use client";

import { type ReactElement } from "react";

import { Stack, type Theme } from "@mui/material";
import { useIsMutating } from "@tanstack/react-query";
import { FormProvider } from "react-hook-form";

import {
  type AdminPageSection,
  SECTION_FIELD_KINDS,
  type SectionSchemaKey,
  type SectionWriteBody,
} from "@repo/contracts/cms/pages";

import { IMAGE_MUTATION_KEY } from "@app/lib/hooks";

import { SECTION_FORMS } from "../../config/section-forms";
import { SECTION_LABELS } from "../../config/section-labels";
import { type EditorLocale } from "../locale-gate";
import { SectionFieldContext } from "../section-field";

import { SectionEditorActions } from "./section-editor-actions";
import { SectionNotices } from "./section-notices";
import { useSectionForm } from "./use-section-form";

export type SectionEditorFormProps<TKey extends SectionSchemaKey> = {
  section: Extract<AdminPageSection, { section: TKey }>;
  locale: EditorLocale;
  onSave: (body: SectionWriteBody<TKey>) => void;
  isLoading: boolean;
};

const fieldsetStyles = (theme: Theme) => ({
  border: 0,
  m: 0,
  p: 0,
  minWidth: 0,
  "&:disabled": { opacity: theme.palette.action.disabledOpacity },
});

export const SectionEditorForm = <TKey extends SectionSchemaKey>({
  section,
  locale,
  onSave,
  isLoading,
}: SectionEditorFormProps<TKey>): ReactElement => {
  const isImageBusy = useIsMutating({ mutationKey: IMAGE_MUTATION_KEY }) > 0;
  const { methods, canSave, handleSave, handleClear } = useSectionForm({
    section,
    isDefaultLocale: locale.isDefault,
    isLoading,
    isImageBusy,
    onSave,
  });
  const fieldContext = {
    kinds: SECTION_FIELD_KINDS[section.section],
    english: section.translation?.english.data ?? null,
  };

  return (
    <FormProvider {...methods}>
      <SectionFieldContext.Provider value={fieldContext}>
        <Stack component="fieldset" disabled={isLoading} spacing={3} sx={fieldsetStyles}>
          <SectionNotices section={section} />
          {SECTION_FORMS[section.section]}
          <SectionEditorActions
            sectionLabel={SECTION_LABELS[section.section]}
            locale={locale}
            state={section.translation?.state}
            isDisabled={isLoading || isImageBusy}
            canSave={canSave}
            onSave={handleSave}
            onClear={handleClear}
          />
        </Stack>
      </SectionFieldContext.Provider>
    </FormProvider>
  );
};
