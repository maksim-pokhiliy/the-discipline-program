"use client";

import { useEffect, useState } from "react";

import { Box, Button, Typography } from "@mui/material";

import type { RowKind } from "@repo/contracts/lms/schema-row";
import { BaseModal } from "@repo/ui";

import { RowKindPickerTile, type RowKindTile } from "./row-kind-picker-tile";

const GRID_COLUMNS = "repeat(2, 1fr)";
const GRID_GAP = 1;
const ENTER_KEY = "Enter";
const HOTKEYS_HINT = "hotkeys: E R P S · enter to accept · esc to cancel";

const DEFAULT_SELECTED_KIND: RowKind = "REST";

const ROW_KIND_TILES: readonly RowKindTile[] = [
  {
    kind: "EXERCISE",
    label: "Exercise",
    desc: "A movement + reps + load. The dominant kind — picks from coach's library.",
    badge: "EX",
    badgeKind: "ex",
    dashed: false,
    hotkey: "E",
  },
  {
    kind: "REST",
    label: "Rest",
    desc: "'rest 2 min between sets' · 'rest until recovery'",
    badge: "RST",
    badgeKind: "rest",
    dashed: false,
    hotkey: "R",
  },
  {
    kind: "PLACEHOLDER",
    label: "Placeholder",
    desc: "'any exercise for ABS' — coach picks at runtime",
    badge: "?",
    badgeKind: "placeholder",
    dashed: true,
    hotkey: "P",
  },
  {
    kind: "REST_SLOT",
    label: "Rest slot (EMOM)",
    desc: "A REST minute inside an EMOM",
    badge: "RS",
    badgeKind: "rest",
    dashed: false,
    hotkey: "S",
  },
];

export type RowKindPickerProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (kind: RowKind) => void;
};

export const RowKindPicker: React.FC<RowKindPickerProps> = ({ open, onClose, onSelect }) => {
  const [selectedKind, setSelectedKind] = useState<RowKind>(DEFAULT_SELECTED_KIND);

  const handlePick = (kind: RowKind): void => {
    onSelect(kind);
    onClose();
  };

  const handleContinue = (): void => handlePick(selectedKind);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === ENTER_KEY) {
        event.preventDefault();
        onSelect(selectedKind);
        onClose();

        return;
      }

      const tile = ROW_KIND_TILES.find((candidate) => candidate.hotkey === event.key.toUpperCase());

      if (tile === undefined) {
        return;
      }

      event.preventDefault();
      setSelectedKind(tile.kind);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, selectedKind, onSelect, onClose]);

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Pick row type"
      subtitle="step 1 of 2"
      maxWidth="sm"
      actions={
        <>
          <Typography variant="caption" sx={{ color: "text.subtle" }}>
            {HOTKEYS_HINT}
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>

          <Button variant="contained" onClick={handleContinue}>
            Continue
          </Button>
        </>
      }
    >
      <Box sx={{ display: "grid", gridTemplateColumns: GRID_COLUMNS, gap: GRID_GAP }}>
        {ROW_KIND_TILES.map((tile) => (
          <RowKindPickerTile
            key={tile.kind}
            tile={tile}
            isSelected={selectedKind === tile.kind}
            onSelect={() => setSelectedKind(tile.kind)}
            onConfirm={() => handlePick(tile.kind)}
          />
        ))}
      </Box>
    </BaseModal>
  );
};
