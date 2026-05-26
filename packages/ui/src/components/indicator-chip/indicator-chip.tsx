import { type ReactElement, type ReactNode } from "react";

import { Box, Chip } from "@mui/material";

const INDICATOR_DOT_SIZE_PX = 5;

export type IndicatorChipTone = "default" | "primary" | "info" | "success" | "warning" | "error";

export type IndicatorChipProps = {
  tone: IndicatorChipTone;
  label: ReactNode;
  onClick?: () => void;
  clickable?: boolean;
  icon?: ReactElement;
  dot?: boolean;
};

export const IndicatorChip: React.FC<IndicatorChipProps> = ({
  tone,
  label,
  onClick,
  clickable,
  icon,
  dot = true,
}): ReactElement => {
  const dotIcon = (
    <Box
      sx={{
        width: INDICATOR_DOT_SIZE_PX,
        height: INDICATOR_DOT_SIZE_PX,
        bgcolor: "currentColor",
        borderRadius: "50%",
        ml: 0.5,
      }}
    />
  );

  const resolvedIcon = icon ?? (dot ? dotIcon : undefined);

  return (
    <Chip
      variant="filled"
      size="small"
      color={tone}
      label={label}
      {...(resolvedIcon !== undefined && { icon: resolvedIcon })}
      {...(clickable === true && { clickable: true })}
      {...(onClick !== undefined && { onClick })}
    />
  );
};
