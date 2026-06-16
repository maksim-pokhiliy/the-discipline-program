import { type ReactElement, type ReactNode } from "react";

import { Box, Typography, alpha } from "@mui/material";

const ROW_SELECTED_TINT = 0.08;
const ROW_PADDING_Y_PX = 10;
const ROW_PADDING_X_PX = 12;
const ROW_GAP_PX = 12;
const ROW_MAIN_GAP_PX = 3;
const ROW_NAME_FONT_WEIGHT = 600;

export type RosterRowProps = {
  leading: ReactNode;
  name: ReactNode;
  sub?: ReactNode;
  trailing?: ReactNode;
  selected?: boolean;
  onClick?: () => void;
};

export const RosterRow = ({
  leading,
  name,
  sub,
  trailing,
  selected = false,
  onClick,
}: RosterRowProps): ReactElement => {
  const isInteractive = onClick !== undefined;

  return (
    <Box
      {...(isInteractive && { role: "button", tabIndex: 0, onClick })}
      sx={(theme) => ({
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        alignItems: "center",
        gap: `${ROW_GAP_PX}px`,
        py: `${ROW_PADDING_Y_PX}px`,
        px: `${ROW_PADDING_X_PX}px`,
        borderTop: `1px solid ${theme.palette.divider}`,
        "&:first-of-type": { borderTop: "none" },
        ...(isInteractive && { cursor: "pointer" }),
        transition: theme.transitions.create("background-color"),
        backgroundColor: selected
          ? alpha(theme.palette.primary.main, ROW_SELECTED_TINT)
          : "transparent",
        "&:hover": {
          backgroundColor: selected
            ? alpha(theme.palette.primary.main, ROW_SELECTED_TINT)
            : theme.palette.action.hover,
        },
      })}
    >
      <Box sx={{ display: "flex", flexShrink: 0 }}>{leading}</Box>
      <Box
        sx={{ display: "flex", flexDirection: "column", gap: `${ROW_MAIN_GAP_PX}px`, minWidth: 0 }}
      >
        <Typography component="div" variant="body1" sx={{ fontWeight: ROW_NAME_FONT_WEIGHT }}>
          {name}
        </Typography>
        {sub !== undefined && (
          <Typography component="div" variant="body2" color="text.secondary">
            {sub}
          </Typography>
        )}
      </Box>
      {trailing !== undefined && (
        <Box sx={{ display: "flex", alignItems: "center" }}>{trailing}</Box>
      )}
    </Box>
  );
};
