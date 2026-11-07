import { type ReactElement } from "react";

import Delete from "@mui/icons-material/Delete";
import { IconButton, Tooltip } from "@mui/material";

import { type AdminLocaleListItem } from "@repo/contracts/cms/locale";

type LanguageDeleteButtonProps = {
  language: AdminLocaleListItem;
  onDelete: (code: string) => void;
};

export const LanguageDeleteButton = ({
  language,
  onDelete,
}: LanguageDeleteButtonProps): ReactElement | null => {
  if (language.isDefault) {
    return null;
  }

  return (
    <Tooltip title="Delete">
      <IconButton
        color="error"
        aria-label={`Delete ${language.name}`}
        onClick={() => onDelete(language.code)}
      >
        <Delete fontSize="small" />
      </IconButton>
    </Tooltip>
  );
};
