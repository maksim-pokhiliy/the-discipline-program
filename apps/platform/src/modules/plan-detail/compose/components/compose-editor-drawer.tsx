"use client";

import { useMemo, useState } from "react";

import { Alert, Box, Button, CircularProgress, Paper, Stack } from "@mui/material";

import type { Exercise } from "@repo/contracts/lms/exercise";
import { BaseModal } from "@repo/ui";

import { useCatalog } from "@app/lib/hooks";

import type { ComposeContainer, ComposeProgram } from "../compose-tree.types";
import { composeRootToCreatePlan, type ConvertIssue } from "../lib/compose-to-create-requests";
import { makeNodeId } from "../lib/id-factory";
import { usePersistComposeCascade } from "../lib/use-persist-compose-cascade";
import { useComposeProgram } from "../use-compose-program";

import { ComposeCanvas } from "./compose-canvas";
import { ComposeNodeInspector } from "./compose-node-inspector";

const TITLE = "Compose block";
const SUBTITLE = "assemble by free nesting";
const INSPECTOR_WIDTH_PX = 360;
const LAYOUT_GAP = 3;
const INSPECTOR_PADDING = 2.5;
const ISSUES_TITLE = "Cannot save this block yet";
const PARTIAL_TITLE = "Partial save";
const SAVE_LABEL = "Save block";
const SAVING_LABEL = "Saving…";
const CANCEL_LABEL = "Cancel";

const emptyRoot = (): ComposeContainer => ({
  nodeType: "container",
  id: makeNodeId(),
  header: null,
  notes: null,
  children: [],
});

const emptyBlockProgram = (): ComposeProgram => ({
  weeks: [
    {
      id: makeNodeId(),
      label: "Block",
      days: [
        {
          id: makeNodeId(),
          label: "Block",
          sessions: [
            {
              id: makeNodeId(),
              label: "Block",
              blocks: [{ id: makeNodeId(), label: "Block", root: emptyRoot() }],
            },
          ],
        },
      ],
    },
  ],
});

const rootOf = (program: ComposeProgram): ComposeContainer | null =>
  program.weeks[0]?.days[0]?.sessions[0]?.blocks[0]?.root ?? null;

type ComposeEditorDrawerProps = {
  open: boolean;
  onClose: () => void;
  planId: string;
  startDate: string;
  blockId: string;
};

export const ComposeEditorDrawer: React.FC<ComposeEditorDrawerProps> = ({
  open,
  onClose,
  planId,
  startDate,
  blockId,
}) => {
  const seed = useMemo(emptyBlockProgram, []);
  const controller = useComposeProgram(seed);
  const { exerciseById: catalogExercises } = useCatalog();
  const { persist, isPending } = usePersistComposeCascade(planId, startDate);

  const [issues, setIssues] = useState<ConvertIssue[]>([]);
  const [partialCount, setPartialCount] = useState<number | null>(null);

  const exerciseById = useMemo<Map<string, Exercise>>(
    () => new Map(catalogExercises),
    [catalogExercises],
  );

  const handleSave = async (): Promise<void> => {
    setIssues([]);
    setPartialCount(null);

    const root = rootOf(controller.program);

    if (root === null) {
      return;
    }

    const result = composeRootToCreatePlan(root);

    if (!result.ok) {
      setIssues(result.issues);

      return;
    }

    const persisted = await persist(result.nodes, blockId);

    if (persisted.ok) {
      onClose();

      return;
    }

    setPartialCount(persisted.createdCount);
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={TITLE}
      subtitle={SUBTITLE}
      maxWidth="lg"
      disableBackdropClick={isPending}
      disableEscapeKeyDown={isPending}
      actions={
        <>
          <Box sx={{ flexGrow: 1 }} />

          <Button onClick={onClose} disabled={isPending} size="small">
            {CANCEL_LABEL}
          </Button>

          <Button
            onClick={() => void handleSave()}
            variant="contained"
            size="small"
            disabled={isPending}
            startIcon={isPending ? <CircularProgress size={16} /> : null}
          >
            {isPending ? SAVING_LABEL : SAVE_LABEL}
          </Button>
        </>
      }
    >
      <Stack direction="column" spacing={LAYOUT_GAP}>
        {issues.length > 0 ? (
          <Alert severity="error">
            <Stack direction="column" spacing={0.5}>
              <Box component="span">{ISSUES_TITLE}</Box>

              {issues.map((issue) => (
                <Box component="span" key={`${issue.path}-${issue.message}`}>
                  {`${issue.path}: ${issue.message}`}
                </Box>
              ))}
            </Stack>
          </Alert>
        ) : null}

        {partialCount !== null ? (
          <Alert severity="warning">{`${PARTIAL_TITLE} — ${String(partialCount)} node(s) created before the failure. The tree may be saved but some parallel/superset links not wired. Fix the flagged issue, then re-save the rest or delete the partial via the row menu.`}</Alert>
        ) : null}

        <Stack direction="row" spacing={LAYOUT_GAP} sx={{ alignItems: "flex-start" }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
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
            sx={{ width: INSPECTOR_WIDTH_PX, flexShrink: 0, p: INSPECTOR_PADDING }}
          >
            <ComposeNodeInspector
              selectedNode={controller.selectedNode}
              exerciseById={exerciseById}
              updateNode={controller.updateNode}
              rename={controller.rename}
            />
          </Paper>
        </Stack>
      </Stack>
    </BaseModal>
  );
};
