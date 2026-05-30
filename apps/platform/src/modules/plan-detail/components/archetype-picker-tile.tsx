"use client";

import { Box, ButtonBase, Stack, Typography, alpha } from "@mui/material";

import type { Archetype } from "@repo/contracts/lms/archetype";

const TILE_ICON_SIZE_FACTOR = 4;
const TILE_ACCENT_WIDTH_FACTOR = 0.375;
const SELECTED_BG_ALPHA = 0.08;

type ArchetypePickerTileProps = {
  archetype: Archetype;
  glyph: string;
  isSelected: boolean;
  isDeferred: boolean;
  hint: string;
  onSelect: () => void;
  onConfirm: () => void;
};

export const ArchetypePickerTile: React.FC<ArchetypePickerTileProps> = ({
  archetype,
  glyph,
  isSelected,
  isDeferred,
  hint,
  onSelect,
  onConfirm,
}) => {
  const isNested = archetype.kind === "NESTED";

  return (
    <ButtonBase
      disabled={isDeferred}
      onClick={onSelect}
      onDoubleClick={onConfirm}
      sx={(theme) => ({
        width: "100%",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        gap: 1.25,
        px: 1.5,
        py: 1.25,
        borderBottom: "1px solid",
        borderColor: "divider",
        borderLeft: isSelected ? `${theme.spacing(TILE_ACCENT_WIDTH_FACTOR)} solid` : "none",
        borderLeftColor: "primary.main",
        bgcolor: isSelected ? alpha(theme.palette.primary.main, SELECTED_BG_ALPHA) : "transparent",
        opacity: isDeferred ? theme.palette.action.disabledOpacity : 1,
        textAlign: "left",
        "&:hover": {
          bgcolor: isSelected
            ? alpha(theme.palette.primary.main, SELECTED_BG_ALPHA)
            : "action.hover",
        },
      })}
    >
      <Box
        sx={(theme) => ({
          flexShrink: 0,
          width: theme.spacing(TILE_ICON_SIZE_FACTOR),
          height: theme.spacing(TILE_ICON_SIZE_FACTOR),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 1,
          border: isNested ? "1px dashed" : "1px solid",
          borderColor: "dividerStrong",
        })}
      >
        <Typography variant="caption" sx={{ fontWeight: 700 }}>
          {glyph}
        </Typography>
      </Box>

      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "baseline", flexWrap: "wrap" }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {archetype.label}
          </Typography>

          <Typography variant="overline" sx={{ color: "text.subtle" }}>
            {archetype.kind}
          </Typography>

          <Typography variant="caption" sx={{ color: "text.subtle" }}>
            {archetype.name}
          </Typography>
        </Stack>

        <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
          {hint}
        </Typography>
      </Box>
    </ButtonBase>
  );
};
