import { type ReactElement } from "react";

import SaveIcon from "@mui/icons-material/Save";
import { Button, Stack } from "@mui/material";

import { TranslationState } from "@repo/contracts/cms/locale";

import { type EditorLocale } from "@app/lib/components/localized-editor/locale-gate";
import { ClearTranslationButton } from "@app/lib/components/localized-editor/translation-state";

type SectionEditorActionsProps = {
  sectionLabel: string;
  locale: EditorLocale;
  state: TranslationState | undefined;
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
    {!locale.isDefault && state !== undefined && state !== TranslationState.NOT_TRANSLATED && (
      <ClearTranslationButton
        message={`The ${locale.name} words written for ${sectionLabel} are removed, and the ${locale.name} site shows this section in English.`}
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
