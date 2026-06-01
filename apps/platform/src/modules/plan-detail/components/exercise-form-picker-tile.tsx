"use client";

import { ButtonBase, Stack, Typography, alpha } from "@mui/material";

import { type ExerciseFormKind } from "@repo/contracts/lms/_shared";

const SELECTED_BG_ALPHA = 0.08;
const TILE_LABEL_FONT_WEIGHT = 700;
const TILE_LABEL_LETTER_SPACING = "0.04em";
const TILE_GLYPH_FONT_WEIGHT = 700;

export type ExerciseFormTile = {
  form: ExerciseFormKind;
  label: string;
  desc: string;
  glyph: string;
};

type ExerciseFormPickerTileProps = {
  tile: ExerciseFormTile;
  isSelected: boolean;
  isDeferred: boolean;
  hint: string;
  onSelect: () => void;
};

export const ExerciseFormPickerTile: React.FC<ExerciseFormPickerTileProps> = ({
  tile,
  isSelected,
  isDeferred,
  hint,
  onSelect,
}) => (
  <ButtonBase
    disabled={isDeferred}
    onClick={onSelect}
    sx={(theme) => ({
      width: "100%",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 0.25,
      p: 1,
      border: "1px solid",
      borderColor: isSelected ? "primary.main" : "divider",
      borderRadius: 1,
      bgcolor: isSelected ? alpha(theme.palette.primary.main, SELECTED_BG_ALPHA) : "transparent",
      opacity: isDeferred ? theme.palette.action.disabledOpacity : 1,
      textAlign: "left",
      "&:hover": {
        borderColor: isSelected ? "primary.main" : "dividerStrong",
        bgcolor: isSelected ? alpha(theme.palette.primary.main, SELECTED_BG_ALPHA) : "action.hover",
      },
    })}
  >
    <Stack spacing={0.25} sx={{ width: "100%" }}>
      <Typography
        variant="subtitle2"
        sx={{ fontWeight: TILE_GLYPH_FONT_WEIGHT, color: "primary.main" }}
      >
        {tile.glyph}
      </Typography>

      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: TILE_LABEL_FONT_WEIGHT,
          letterSpacing: TILE_LABEL_LETTER_SPACING,
          textTransform: "uppercase",
        }}
      >
        {tile.label}
      </Typography>

      <Typography variant="caption" sx={{ color: "text.subtle" }}>
        {isDeferred ? hint : tile.desc}
      </Typography>
    </Stack>
  </ButtonBase>
);
