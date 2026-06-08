"use client";

import { type ReactElement, useEffect, useMemo, useRef, useState } from "react";

import { Stack, Typography } from "@mui/material";

import { deriveCompositionLabel } from "@repo/contracts/lms/composition";
import type { Exercise } from "@repo/contracts/lms/exercise";
import type { SchemaWithBody } from "@repo/contracts/lms/schema";
import { FormModal } from "@repo/ui";

import { useCatalog, useCreateSchema, useUpdateSchema } from "@app/lib/hooks";

import { makeNodeId } from "../lib/axis-draft-id";
import {
  AXIS_REFUSAL_MESSAGE,
  buildComposition,
  previewComposition,
} from "../lib/build-axis-composition";
import { formatCompositionSummary } from "../lib/format-composition-summary";
import {
  type InverseRefusalReason,
  schemaWithBodyToDraftContainer,
} from "../lib/schema-to-draft-container";

import type { ComposeContainer, ComposeNode, NodeId } from "./axes/axis-draft.types";
import { ContainerInspector } from "./axes/container-inspector";
import { DerivedLabelCard } from "./derived-label-card";

const CREATE_TITLE = "Add schema";
const EDIT_TITLE = "Container composition";
const CREATE_SUBMIT = "Add schema";
const EDIT_SUBMIT = "Save";
const FLAT_KIND = "flat";
const CREATE_ARRANGEMENT_HINT =
  "parallel / superset unlock once this schema has rows or sub-schemas — add those first, then tune here.";
const BODY_SPACING = 2;

export type AxisEditorMode =
  | { kind: "create"; blockId: string }
  | { kind: "edit"; schema: SchemaWithBody };

type AxisEditorModalProps = {
  open: boolean;
  onClose: () => void;
  planId: string;
  startDate: string;
  mode: AxisEditorMode;
};

type DraftSeed = { container: ComposeContainer; refusal: InverseRefusalReason | null };

const defaultDraftContainer = (): ComposeContainer => ({
  nodeType: "container",
  id: makeNodeId(),
  header: null,
  notes: null,
  children: [],
});

const seedDraft = (mode: AxisEditorMode): DraftSeed => {
  if (mode.kind === "create") {
    return { container: defaultDraftContainer(), refusal: null };
  }

  const result = schemaWithBodyToDraftContainer(mode.schema);

  return result.ok
    ? { container: result.container, refusal: null }
    : { container: defaultDraftContainer(), refusal: result.reason };
};

const modeKey = (mode: AxisEditorMode): string =>
  mode.kind === "create" ? `create:${mode.blockId}` : `edit:${mode.schema.schema.id}`;

export const AxisEditorModal: React.FC<AxisEditorModalProps> = ({
  open,
  onClose,
  planId,
  startDate,
  mode,
}): ReactElement => {
  const createSchema = useCreateSchema(planId, startDate);
  const updateSchema = useUpdateSchema(planId, startDate);
  const { exerciseById: catalogExercises } = useCatalog();
  const exerciseById = useMemo<Map<string, Exercise>>(
    () => new Map(catalogExercises),
    [catalogExercises],
  );

  const [{ container: draft, refusal }, setSeed] = useState<DraftSeed>(() => seedDraft(mode));
  const [error, setError] = useState<string | null>(null);

  const modeRef = useRef(mode);

  modeRef.current = mode;

  const isSubmittingRef = useRef(false);

  const key = modeKey(mode);

  useEffect(() => {
    setSeed(seedDraft(modeRef.current));
    setError(null);
    isSubmittingRef.current = false;
  }, [key]);

  const onUpdateNode = (id: NodeId, patch: (node: ComposeNode) => ComposeNode): void =>
    setSeed((prev) => {
      if (prev.container.id !== id) {
        return prev;
      }

      const patched = patch(prev.container);

      return patched.nodeType === "container" ? { ...prev, container: patched } : prev;
    });

  const onRename = (id: NodeId, header: string): void =>
    setSeed((prev) =>
      prev.container.id === id
        ? { ...prev, container: { ...prev.container, header: header === "" ? null : header } }
        : prev,
    );

  const isCreateMode = mode.kind === "create";
  const isPending = createSchema.isPending || updateSchema.isPending;
  const preview = useMemo(() => previewComposition(draft), [draft]);
  const parts = useMemo(() => formatCompositionSummary(preview), [preview]);
  const labelKind = deriveCompositionLabel(preview).kind;
  const showsFlatHint = labelKind === FLAT_KIND && parts.length === 0;

  const handleSubmit = (): void => {
    if (isSubmittingRef.current || isPending) {
      return;
    }

    setError(null);

    const result = buildComposition(draft);

    if (!result.ok) {
      setError(result.error);

      return;
    }

    const header = draft.header;

    isSubmittingRef.current = true;

    if (mode.kind === "create") {
      createSchema.mutate(
        { blockId: mode.blockId, composition: result.composition, header, notes: null },
        {
          onSuccess: onClose,
          onError: (cause) => setError(cause.message),
          onSettled: () => {
            isSubmittingRef.current = false;
          },
        },
      );

      return;
    }

    updateSchema.mutate(
      { schemaId: mode.schema.schema.id, data: { composition: result.composition, header } },
      {
        onSuccess: onClose,
        onError: (cause) => setError(cause.message),
        onSettled: () => {
          isSubmittingRef.current = false;
        },
      },
    );
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={isCreateMode ? CREATE_TITLE : EDIT_TITLE}
      maxWidth="sm"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
      isSubmitting={isPending}
      submitText={isCreateMode ? CREATE_SUBMIT : EDIT_SUBMIT}
      submitDisabled={refusal !== null}
      error={error ?? (refusal !== null ? AXIS_REFUSAL_MESSAGE : null)}
    >
      <Stack direction="column" spacing={BODY_SPACING}>
        <DerivedLabelCard labelKind={labelKind} parts={parts} showsFlatHint={showsFlatHint} />

        <ContainerInspector
          container={draft}
          exerciseById={exerciseById}
          isCreateMode={isCreateMode}
          headerEditable
          onUpdateNode={onUpdateNode}
          onRename={onRename}
          onDemoteNode={undefined}
        />

        {isCreateMode ? (
          <Typography variant="caption" color="text.subtle">
            {CREATE_ARRANGEMENT_HINT}
          </Typography>
        ) : null}
      </Stack>
    </FormModal>
  );
};
