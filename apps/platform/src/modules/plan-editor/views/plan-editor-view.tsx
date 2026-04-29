"use client";

import { Stack } from "@mui/material";

import { LAYOUT } from "@repo/shared";

import {
  CommandPalette,
  CommandPaletteProvider,
  PlanCommandRegistry,
} from "../components/command-palette";
import { PlanEditorChrome } from "../components/plan-editor-chrome";
import { PlanEditorHeader } from "../components/plan-editor-header";

const CONTAINER_VERTICAL_PADDING = 64;

export type PlanEditorViewProps = {
  planId: string;
};

export const PlanEditorView = ({ planId }: PlanEditorViewProps) => {
  return (
    <CommandPaletteProvider>
      <PlanCommandRegistry planId={planId} />
      <CommandPalette />
      <Stack
        spacing={3}
        sx={{
          height: `calc(100dvh - ${LAYOUT.platformHeaderHeight}px - ${LAYOUT.platformBottomNavHeight}px - ${CONTAINER_VERTICAL_PADDING}px)`,
          minHeight: 0,
        }}
      >
        <PlanEditorHeader planId={planId} activeTab="schedule" />
        <PlanEditorChrome planId={planId} />
      </Stack>
    </CommandPaletteProvider>
  );
};
