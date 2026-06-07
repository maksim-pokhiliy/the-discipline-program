"use client";

import { useMemo, useRef, useState } from "react";

import { Alert, Box, Button, CircularProgress, Paper, Stack } from "@mui/material";

import type { Exercise } from "@repo/contracts/lms/exercise";
import type { SchemaWithBody } from "@repo/contracts/lms/schema";
import { BaseModal } from "@repo/ui";

import { useCatalog } from "@app/lib/hooks";

import type { ComposeContainer, ComposeProgram } from "../compose-tree.types";
import { composeRootToCreatePlan, type ConvertIssue } from "../lib/compose-to-create-requests";
import { diffComposeAxesAgainstOriginal } from "../lib/diff-compose-axes";
import { makeNodeId } from "../lib/id-factory";
import {
  type InverseRefusalReason,
  schemaWithBodyToComposeProgram,
} from "../lib/schema-to-compose";
import { useEditComposeAxes } from "../lib/use-edit-compose-axes";
import { usePersistComposeCascade } from "../lib/use-persist-compose-cascade";
import { useComposeProgram } from "../use-compose-program";

import { ComposeCanvas } from "./compose-canvas";
import { ComposeNodeInspector } from "./compose-node-inspector";

const CREATE_TITLE = "Compose block";
const CREATE_SUBTITLE = "assemble by free nesting";
const EDIT_TITLE = "Edit block axes";
const EDIT_SUBTITLE = "tune repetition, arrangement and rest";
const INSPECTOR_WIDTH_PX = 360;
const LAYOUT_GAP = 3;
const INSPECTOR_PADDING = 2.5;
const ISSUES_TITLE = "Cannot save this block yet";
const PARTIAL_TITLE = "Partial save";
const CREATE_SAVE_LABEL = "Save block";
const EDIT_SAVE_LABEL = "Save axes";
const SAVING_LABEL = "Saving…";
const CANCEL_LABEL = "Cancel";
const REFUSAL_MESSAGE = "This block contains a rep-scheme not yet editable.";
const STRUCTURAL_MESSAGE =
  "Structural edits aren't supported here yet — only axis changes. Undo added/removed/moved items to save.";

export type ComposeEditorMode = { kind: "create" } | { kind: "edit"; schema: SchemaWithBody };

const DEFAULT_MODE: ComposeEditorMode = { kind: "create" };

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

const seedFor = (
  mode: ComposeEditorMode,
): { program: ComposeProgram; refusal: InverseRefusalReason | null } => {
  if (mode.kind === "create") {
    return { program: emptyBlockProgram(), refusal: null };
  }

  const result = schemaWithBodyToComposeProgram(mode.schema);

  return result.ok
    ? { program: result.program, refusal: null }
    : { program: emptyBlockProgram(), refusal: result.reason };
};

type ComposeEditorDrawerProps = {
  open: boolean;
  onClose: () => void;
  planId: string;
  startDate: string;
  blockId: string;
  mode?: ComposeEditorMode;
};

export const ComposeEditorDrawer: React.FC<ComposeEditorDrawerProps> = ({
  open,
  onClose,
  planId,
  startDate,
  blockId,
  mode = DEFAULT_MODE,
}) => {
  const [{ program: seed, refusal }] = useState(() => seedFor(mode));
  const controller = useComposeProgram(seed);
  const { exerciseById: catalogExercises } = useCatalog();
  const createCascade = usePersistComposeCascade(planId, startDate);
  const editAxes = useEditComposeAxes(planId, startDate);

  const isSubmittingRef = useRef(false);
  const [issues, setIssues] = useState<ConvertIssue[]>([]);
  const [partialCount, setPartialCount] = useState<number | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [isStructurallyDivergent, setIsStructurallyDivergent] = useState(false);

  const exerciseById = useMemo<Map<string, Exercise>>(
    () => new Map(catalogExercises),
    [catalogExercises],
  );

  const isEdit = mode.kind === "edit";
  const isCreateMode = mode.kind === "create";
  const isStructuralEditingAllowed = mode.kind === "create";
  const isPending = isEdit ? editAxes.isPending : createCascade.isPending;
  const isSaveDisabled = isPending || refusal !== null;

  const handlers = useMemo(
    () => ({ ...controller.nodeHandlers, isStructuralEditingAllowed }),
    [controller.nodeHandlers, isStructuralEditingAllowed],
  );

  const upperHandlers = useMemo(
    () => ({ ...controller.upperHandlers, isStructuralEditingAllowed }),
    [controller.upperHandlers, isStructuralEditingAllowed],
  );

  const idleSaveLabel = isEdit ? EDIT_SAVE_LABEL : CREATE_SAVE_LABEL;

  const handleCreateSave = async (root: ComposeContainer): Promise<void> => {
    const result = composeRootToCreatePlan(root);

    if (!result.ok) {
      setIssues(result.issues);

      return;
    }

    const persisted = await createCascade.persist(result.nodes, blockId);

    if (persisted.ok) {
      onClose();

      return;
    }

    setPartialCount(persisted.createdCount);
  };

  const handleEditSave = async (schema: SchemaWithBody, root: ComposeContainer): Promise<void> => {
    const diff = diffComposeAxesAgainstOriginal(schema, root);

    if (!diff.ok) {
      if (diff.reason === "arrangement-invalid") {
        setIssues(diff.issues);

        return;
      }

      setIsStructurallyDivergent(true);

      return;
    }

    const persisted = await editAxes.saveEdits(diff.updates);

    if (persisted.ok) {
      onClose();

      return;
    }

    setEditError(persisted.error.message);
  };

  const handleSave = async (): Promise<void> => {
    if (isSubmittingRef.current || refusal !== null) {
      return;
    }

    isSubmittingRef.current = true;

    try {
      setIssues([]);
      setPartialCount(null);
      setEditError(null);
      setIsStructurallyDivergent(false);

      const root = rootOf(controller.program);

      if (root === null) {
        return;
      }

      await (mode.kind === "edit" ? handleEditSave(mode.schema, root) : handleCreateSave(root));
    } finally {
      isSubmittingRef.current = false;
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={isEdit ? EDIT_TITLE : CREATE_TITLE}
      subtitle={isEdit ? EDIT_SUBTITLE : CREATE_SUBTITLE}
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
            disabled={isSaveDisabled}
            startIcon={isPending ? <CircularProgress size={16} /> : null}
          >
            {isPending ? SAVING_LABEL : idleSaveLabel}
          </Button>
        </>
      }
    >
      <Stack direction="column" spacing={LAYOUT_GAP}>
        {refusal !== null ? <Alert severity="warning">{REFUSAL_MESSAGE}</Alert> : null}

        {isStructurallyDivergent ? <Alert severity="warning">{STRUCTURAL_MESSAGE}</Alert> : null}

        {editError !== null ? <Alert severity="error">{editError}</Alert> : null}

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
              handlers={handlers}
              upperHandlers={upperHandlers}
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
              isCreateMode={isCreateMode}
              updateNode={controller.updateNode}
              rename={controller.rename}
              onDemoteNode={controller.demoteNode}
            />
          </Paper>
        </Stack>
      </Stack>
    </BaseModal>
  );
};
