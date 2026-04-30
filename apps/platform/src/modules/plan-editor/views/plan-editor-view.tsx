"use client";

import { Stack } from "@mui/material";

import { LAYOUT } from "@repo/shared";

import { BulkActionProvider } from "../components/bulk-action-toolbar";
import {
  CommandPalette,
  CommandPaletteProvider,
  PlanCommandRegistry,
} from "../components/command-palette";
import { PlanEditorChrome } from "../components/plan-editor-chrome";
import { PlanEditorHeader } from "../components/plan-editor-header";
import { EditingTargetProvider } from "../lib/editing-target";

const CONTAINER_VERTICAL_PADDING = 64;

export type PlanEditorViewProps = {
  planId: string;
};

export const PlanEditorView = ({ planId }: PlanEditorViewProps) => {
  return (
    <EditingTargetProvider>
      <BulkActionProvider>
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
      </BulkActionProvider>
    </EditingTargetProvider>
  );
};
