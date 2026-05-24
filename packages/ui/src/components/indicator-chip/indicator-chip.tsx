import { type ReactElement, type ReactNode } from "react";

import { Box, Chip } from "@mui/material";

const INDICATOR_DOT_SIZE_PX = 5;

export type IndicatorChipTone = "default" | "primary" | "info" | "success" | "warning" | "error";

export type IndicatorChipProps = {
  tone: IndicatorChipTone;
  label: ReactNode;
};

export const IndicatorChip: React.FC<IndicatorChipProps> = ({ tone, label }): ReactElement => (
  <Chip
    variant="indicator"
    color={tone}
    icon={
      <Box
        sx={{
          width: INDICATOR_DOT_SIZE_PX,
          height: INDICATOR_DOT_SIZE_PX,
          bgcolor: "currentColor",
          borderRadius: "50%",
          ml: 0.5,
        }}
      />
    }
    label={label}
  />
);
