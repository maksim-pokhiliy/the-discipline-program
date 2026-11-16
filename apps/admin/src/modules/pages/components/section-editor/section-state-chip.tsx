import { type ReactElement } from "react";

import { Chip } from "@mui/material";

import { SectionTranslationState } from "@repo/contracts/cms/pages";

const STATE_LABELS = {
  [SectionTranslationState.NOT_TRANSLATED]: "Not translated",
  [SectionTranslationState.DRAFT]: "Draft",
  [SectionTranslationState.TRANSLATED]: "Translated",
  [SectionTranslationState.ENGLISH_NEWER]: "English is newer",
};
const STATE_COLORS = {
  [SectionTranslationState.NOT_TRANSLATED]: "default",
  [SectionTranslationState.DRAFT]: "warning",
  [SectionTranslationState.TRANSLATED]: "success",
  [SectionTranslationState.ENGLISH_NEWER]: "info",
} as const;

type SectionStateChipProps = { state: SectionTranslationState };

export const SectionStateChip = ({ state }: SectionStateChipProps): ReactElement => (
  <Chip label={STATE_LABELS[state]} color={STATE_COLORS[state]} variant="outlined" size="small" />
);
