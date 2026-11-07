import { type ReactElement } from "react";

import { Stack } from "@mui/material";

import { LanguageMoveButton } from "./language-move-button";
import { type LanguageRow, type MoveDirection } from "./language-order";

type LanguageMoveButtonsProps = {
  language: LanguageRow;
  isPending: boolean;
  onMove: (code: string, direction: MoveDirection) => void;
};

export const LanguageMoveButtons = ({
  language,
  isPending,
  onMove,
}: LanguageMoveButtonsProps): ReactElement | null => {
  if (language.isDefault) {
    return null;
  }

  return (
    <Stack direction="row">
      <LanguageMoveButton
        name={language.name}
        direction="up"
        isUnavailable={isPending || !language.canMoveUp}
        onMove={() => onMove(language.code, "up")}
      />
      <LanguageMoveButton
        name={language.name}
        direction="down"
        isUnavailable={isPending || !language.canMoveDown}
        onMove={() => onMove(language.code, "down")}
      />
    </Stack>
  );
};
