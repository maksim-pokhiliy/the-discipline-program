"use client";

import { useMemo } from "react";

import { Box, Paper, Stack, Typography } from "@mui/material";

import type { Exercise } from "@repo/contracts/lms/exercise";

import { ComposeCanvas } from "../compose/components/compose-canvas";
import { ComposeNodeInspector } from "../compose/components/compose-node-inspector";
import { ComposeProviderShell } from "../compose/components/compose-provider-shell";
import { MOCK_EXERCISES } from "../compose/compose-mock-exercises";
import type { ComposeProgram } from "../compose/compose-tree.types";
import { useComposeProgram } from "../compose/use-compose-program";

const INSPECTOR_WIDTH_PX = 360;
const CANVAS_MAX_WIDTH_PX = 860;
const LAYOUT_GAP = 3;
const PAGE_PADDING = 4;
const INSPECTOR_PADDING = 2.5;
const TITLE = "Compose constructor";
const SUBTITLE = "prototype on mocks · assemble by free nesting";

type ComposePrototypeViewProps = {
  initialProgram?: ComposeProgram;
};

export const ComposePrototypeView: React.FC<ComposePrototypeViewProps> = ({ initialProgram }) => {
  const controller = useComposeProgram(initialProgram);

  const exerciseById = useMemo<Map<string, Exercise>>(
    () => new Map(MOCK_EXERCISES.map((exercise) => [exercise.id, exercise])),
    [],
  );

  return (
    <ComposeProviderShell>
      <Stack direction="column" spacing={LAYOUT_GAP} sx={{ p: PAGE_PADDING }}>
        <Stack direction="column" spacing={0.5}>
          <Typography variant="h3">{TITLE}</Typography>

          <Typography variant="body2" color="text.subtle">
            {SUBTITLE}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={LAYOUT_GAP} sx={{ alignItems: "flex-start" }}>
          <Box sx={{ flex: 1, minWidth: 0, maxWidth: CANVAS_MAX_WIDTH_PX }}>
            <ComposeCanvas
              program={controller.program}
              exerciseById={exerciseById}
              handlers={controller.nodeHandlers}
              upperHandlers={controller.upperHandlers}
              onRename={controller.rename}
            />
          </Box>

          <Paper
            variant="outlined"
            sx={{
              width: INSPECTOR_WIDTH_PX,
              flexShrink: 0,
              p: INSPECTOR_PADDING,
              position: "sticky",
              top: PAGE_PADDING,
            }}
          >
            <ComposeNodeInspector
              selectedNode={controller.selectedNode}
              exerciseById={exerciseById}
              isCreateMode
              updateNode={controller.updateNode}
              rename={controller.rename}
            />
          </Paper>
        </Stack>
      </Stack>
    </ComposeProviderShell>
  );
};
