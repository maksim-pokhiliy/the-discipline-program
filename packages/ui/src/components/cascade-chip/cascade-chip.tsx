import { type ReactElement } from "react";

import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import { Chip } from "@mui/material";

const CASCADE_ARROW_OPACITY = 0.6;

export type CascadeChipProps = {
  text: string;
};

export const CascadeChip: React.FC<CascadeChipProps> = ({ text }): ReactElement => (
  <Chip
    size="small"
    variant="filled"
    color="default"
    icon={<ArrowUpwardIcon fontSize="inherit" sx={{ opacity: CASCADE_ARROW_OPACITY }} />}
    label={text}
    sx={{
      bgcolor: "action.hover",
      color: "text.subtle",
      fontStyle: "italic",
    }}
  />
);
