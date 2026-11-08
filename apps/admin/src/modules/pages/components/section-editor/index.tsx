"use client";

import { type ReactElement } from "react";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SaveIcon from "@mui/icons-material/Save";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Stack,
  Typography,
} from "@mui/material";
import { useIsMutating } from "@tanstack/react-query";
import { FormProvider, useForm } from "react-hook-form";

import {
  type AdminPageSection,
  type SectionSchemaKey,
  type SectionWriteBody,
  type SectionWriteData,
} from "@repo/contracts/cms/pages";

import { IMAGE_MUTATION_KEY } from "@app/lib/hooks";

import { SECTION_FORMS } from "../../config/section-forms";
import { SECTION_LABELS } from "../../config/section-labels";

export { getSectionEditorKey } from "./section-editor-key";

type SectionEditorProps<TKey extends SectionSchemaKey> = {
  section: Extract<AdminPageSection, { section: TKey }>;
  isExpanded: boolean;
  onToggle: (event: React.SyntheticEvent, isExpanded: boolean) => void;
  onSave: (body: SectionWriteBody<TKey>) => void;
  isLoading: boolean;
};

export const SectionEditor = <TKey extends SectionSchemaKey>({
  section,
  isExpanded,
  onToggle,
  onSave,
  isLoading,
}: SectionEditorProps<TKey>): ReactElement => {
  const isImageBusy = useIsMutating({ mutationKey: IMAGE_MUTATION_KEY }) > 0;
  const methods = useForm<SectionWriteData[TKey]>({ values: section.data });
  const handleSave = methods.handleSubmit((data) => onSave({ section: section.section, data }));

  return (
    <Accordion expanded={isExpanded} onChange={onToggle}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        id={`${section.section}-header`}
        aria-controls={`${section.section}-content`}
      >
        <Typography variant="subtitle1">{SECTION_LABELS[section.section]}</Typography>
      </AccordionSummary>

      <AccordionDetails>
        <FormProvider {...methods}>
          <Stack
            component="fieldset"
            disabled={isLoading}
            spacing={3}
            sx={(theme) => ({
              border: 0,
              m: 0,
              p: 0,
              minWidth: 0,
              "&:disabled": { opacity: theme.palette.action.disabledOpacity },
            })}
          >
            {SECTION_FORMS[section.section]}

            <Stack direction="row" justifyContent="flex-end">
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={isLoading || isImageBusy || !methods.formState.isDirty}
              >
                Update Section
              </Button>
            </Stack>
          </Stack>
        </FormProvider>
      </AccordionDetails>
    </Accordion>
  );
};
