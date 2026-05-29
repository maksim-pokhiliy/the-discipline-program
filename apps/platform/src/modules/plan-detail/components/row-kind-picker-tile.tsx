"use client";

import { Box, ButtonBase, Stack, Typography, alpha } from "@mui/material";

import type { RowKind } from "@repo/contracts/lms/schema-row";
import { KbdHint, RowKindBadge, type RowKindBadgeProps } from "@repo/ui";

const SELECTED_BG_ALPHA = 0.08;
const TILE_NAME_FONT_WEIGHT = 700;

export type RowKindTile = {
  kind: RowKind;
  label: string;
  desc: string;
  badge: string;
  badgeKind: RowKindBadgeProps["kind"];
  dashed: boolean;
  hotkey: string;
};

type RowKindPickerTileProps = {
  tile: RowKindTile;
  isSelected: boolean;
  isDeferred: boolean;
  hint: string;
  onSelect: () => void;
  onConfirm: () => void;
};

export const RowKindPickerTile: React.FC<RowKindPickerTileProps> = ({
  tile,
  isSelected,
  isDeferred,
  hint,
  onSelect,
  onConfirm,
}) => (
  <ButtonBase
    disabled={isDeferred}
    onClick={onSelect}
    onDoubleClick={onConfirm}
    sx={(theme) => ({
      width: "100%",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 0.75,
      p: 1.25,
      border: "1px solid",
      borderColor: isSelected ? "primary.main" : "divider",
      borderRadius: 1,
      bgcolor: isSelected ? alpha(theme.palette.primary.main, SELECTED_BG_ALPHA) : "transparent",
      opacity: isDeferred ? theme.palette.action.disabledOpacity : 1,
      textAlign: "left",
    })}
  >
    <Stack direction="row" spacing={0.75} sx={{ width: "100%", alignItems: "center" }}>
      <RowKindBadge kind={tile.badgeKind} label={tile.badge} dashed={tile.dashed} />

      <Box sx={{ marginLeft: "auto" }}>
        <KbdHint>{tile.hotkey}</KbdHint>
      </Box>
    </Stack>

    <Typography
      variant="subtitle2"
      sx={{ fontWeight: TILE_NAME_FONT_WEIGHT, textTransform: "uppercase" }}
    >
      {tile.label}
    </Typography>

    <Typography variant="caption" sx={{ color: "text.subtle" }}>
      {isDeferred ? hint : tile.desc}
    </Typography>
  </ButtonBase>
);
