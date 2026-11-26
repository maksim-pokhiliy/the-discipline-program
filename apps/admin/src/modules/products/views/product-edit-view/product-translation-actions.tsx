import { type ReactElement } from "react";

import SaveIcon from "@mui/icons-material/Save";
import { Button, Stack } from "@mui/material";

import { TranslationState } from "@repo/contracts/cms/locale";

import { ClearTranslationButton } from "@app/lib/components/localized-editor/translation-state";

type ProductTranslationActionsProps = {
  languageName: string;
  state: TranslationState;
  isDisabled: boolean;
  canSave: boolean;
  onSave: () => void;
  onClear: () => void;
};

export const ProductTranslationActions = ({
  languageName,
  state,
  isDisabled,
  canSave,
  onSave,
  onClear,
}: ProductTranslationActionsProps): ReactElement => (
  <Stack direction="row" spacing={2} justifyContent="flex-end" flexWrap="wrap">
    {state !== TranslationState.NOT_TRANSLATED && (
      <ClearTranslationButton
        languageName={languageName}
        message={`The ${languageName} words written for this product are removed, and the ${languageName} site shows it in English.`}
        isDisabled={isDisabled}
        onConfirm={onClear}
      />
    )}
    <Button
      variant="contained"
      startIcon={<SaveIcon />}
      disabled={isDisabled || !canSave}
      onClick={onSave}
    >
      Save Translation
    </Button>
  </Stack>
);
