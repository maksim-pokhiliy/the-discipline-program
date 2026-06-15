"use client";

import { Box, Typography, alpha } from "@mui/material";

const DOT_SIZE = 20;
const LINE_WIDTH = 2;
const LINE_ALPHA = 0.35;
const DOT_BORDER_ALPHA = 0.6;
const CENTER = "50%";

type RowTimelineMarkerProps = {
  ord: number;
  isFirst: boolean;
  isLast: boolean;
};

export const RowTimelineMarker: React.FC<RowTimelineMarkerProps> = ({ ord, isFirst, isLast }) => (
  <Box
    sx={{
      alignSelf: "stretch",
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Box
      sx={(theme) => ({
        position: "absolute",
        top: isFirst ? CENTER : 0,
        bottom: isLast ? CENTER : 0,
        left: CENTER,
        width: LINE_WIDTH,
        transform: "translateX(-50%)",
        bgcolor: alpha(theme.palette.primary.main, LINE_ALPHA),
      })}
    />

    <Box
      sx={(theme) => ({
        position: "relative",
        zIndex: 1,
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: "50%",
        border: `1px solid ${alpha(theme.palette.primary.main, DOT_BORDER_ALPHA)}`,
        bgcolor: "background.paper",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      })}
    >
      <Typography
        variant="caption"
        sx={{ lineHeight: 1, color: "primary.main", fontVariantNumeric: "tabular-nums" }}
      >
        {ord}
      </Typography>
    </Box>
  </Box>
);
