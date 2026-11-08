import { type ReactElement } from "react";

import SaveIcon from "@mui/icons-material/Save";
import { Button, Stack } from "@mui/material";

import { SectionTranslationState } from "@repo/contracts/cms/pages";

import { type EditorLocale } from "../locale-gate";

import { ClearTranslationButton } from "./clear-translation-button";

type SectionEditorActionsProps = {
  sectionLabel: string;
  locale: EditorLocale;
  state: SectionTranslationState | undefined;
  isDisabled: boolean;
  canSave: boolean;
  onSave: () => Promise<void>;
  onClear: () => void;
};

export const SectionEditorActions = ({
  sectionLabel,
  locale,
  state,
  isDisabled,
  canSave,
  onSave,
  onClear,
}: SectionEditorActionsProps): ReactElement => (
  <Stack direction="row" justifyContent="flex-end" spacing={2}>
    {!locale.isDefault &&
      state !== undefined &&
      state !== SectionTranslationState.NOT_TRANSLATED && (
        <ClearTranslationButton
          sectionLabel={sectionLabel}
          languageName={locale.name}
          isDisabled={isDisabled}
          onConfirm={onClear}
        />
      )}
    <Button variant="contained" startIcon={<SaveIcon />} onClick={onSave} disabled={!canSave}>
      Update Section
    </Button>
  </Stack>
);
