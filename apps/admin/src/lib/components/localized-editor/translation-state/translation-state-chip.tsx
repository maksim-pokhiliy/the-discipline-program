import { type ReactElement } from "react";

import { Chip } from "@mui/material";

import { TranslationState } from "@repo/contracts/cms/locale";

const STATE_LABELS = {
  [TranslationState.NOT_TRANSLATED]: "Not translated",
  [TranslationState.DRAFT]: "Draft",
  [TranslationState.TRANSLATED]: "Translated",
  [TranslationState.ENGLISH_NEWER]: "English is newer",
};
const STATE_COLORS = {
  [TranslationState.NOT_TRANSLATED]: "default",
  [TranslationState.DRAFT]: "warning",
  [TranslationState.TRANSLATED]: "success",
  [TranslationState.ENGLISH_NEWER]: "info",
} as const;

type TranslationStateChipProps = { state: TranslationState };

export const TranslationStateChip = ({ state }: TranslationStateChipProps): ReactElement => (
  <Chip label={STATE_LABELS[state]} color={STATE_COLORS[state]} variant="outlined" size="small" />
);
