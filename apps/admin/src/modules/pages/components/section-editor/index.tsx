"use client";

import { type ReactElement } from "react";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Accordion, AccordionDetails, AccordionSummary, Stack, Typography } from "@mui/material";

import { type SectionSchemaKey } from "@repo/contracts/cms/pages";

import { SECTION_LABELS } from "../../config/section-labels";

import { SectionEditorForm, type SectionEditorFormProps } from "./section-editor-form";
import { SectionStateChip } from "./section-state-chip";

export { getSectionEditorKey } from "./section-editor-key";

type SectionEditorProps<TKey extends SectionSchemaKey> = SectionEditorFormProps<TKey> & {
  isExpanded: boolean;
  onToggle: (event: React.SyntheticEvent, isExpanded: boolean) => void;
};

export const SectionEditor = <TKey extends SectionSchemaKey>({
  section,
  locale,
  isExpanded,
  onToggle,
  onSave,
  isLoading,
}: SectionEditorProps<TKey>): ReactElement => (
  <Accordion expanded={isExpanded} onChange={onToggle}>
    <AccordionSummary
      expandIcon={<ExpandMoreIcon />}
      id={`${section.section}-header`}
      aria-controls={`${section.section}-content`}
    >
      <Stack direction="row" alignItems="center" spacing={2}>
        <Typography variant="subtitle1">{SECTION_LABELS[section.section]}</Typography>
        {!locale.isDefault && section.translation && (
          <SectionStateChip state={section.translation.state} />
        )}
      </Stack>
    </AccordionSummary>

    <AccordionDetails>
      <SectionEditorForm section={section} locale={locale} onSave={onSave} isLoading={isLoading} />
    </AccordionDetails>
  </Accordion>
);
