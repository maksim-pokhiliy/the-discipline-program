import { type ReactElement } from "react";

import { Chip } from "@mui/material";

export type CascadeChipProps = {
  text: string;
};

export const CascadeChip: React.FC<CascadeChipProps> = ({ text }): ReactElement => (
  <Chip
    size="small"
    variant="filled"
    color="default"
    label={text}
    sx={{
      bgcolor: "action.hover",
      color: "text.subtle",
      fontStyle: "italic",
    }}
  />
);
