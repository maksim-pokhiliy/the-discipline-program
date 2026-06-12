"use client";

import { type ReactElement, useEffect, useMemo, useRef, useState } from "react";

import { Stack } from "@mui/material";

import { type Composition, deriveCompositionLabel } from "@repo/contracts/lms/composition";
import type { SchemaWithBody } from "@repo/contracts/lms/schema";
import { FormModal } from "@repo/ui";

import { useCreateSchema, useUpdateSchema } from "@app/lib/hooks";

import { makeNodeId } from "../lib/axis-draft-id";
import { buildComposition, previewComposition } from "../lib/build-axis-composition";
import { formatCompositionSummary } from "../lib/format-composition-summary";
import { schemaWithBodyToDraft } from "../lib/schema-to-draft";
import { useCreateGroup } from "../lib/use-create-group";
import { useCreateIndependentLadders } from "../lib/use-create-independent-ladders";

import type { DraftSeed, GroupDraft, NodeId, SchemaDraft } from "./axes/axis-draft.types";
import { ContainerInspector } from "./axes/container-inspector";
import { CreateSchemaFlow } from "./create-schema-flow";
import { DerivedLabelCard } from "./derived-label-card";

const CREATE_TITLE = "Add schema";
const EDIT_TITLE = "Container composition";
const CREATE_SUBMIT = "Add schema";
const EDIT_SUBMIT = "Save";
const FLAT_KIND = "flat";
const BODY_SPACING = 2;
const EMPTY_COMPOSITION: Composition = {};

export type AxisEditorMode =
  | { kind: "create"; blockId: string; groupId?: string }
  | { kind: "edit"; schema: SchemaWithBody };

type AxisEditorModalProps = {
  open: boolean;
  onClose: () => void;
  planId: string;
  startDate: string;
  mode: AxisEditorMode;
};

const defaultSchemaDraft = (): SchemaDraft => ({
  id: makeNodeId(),
  header: null,
  notes: null,
  rows: [],
});

const groupToFlatSchema = (group: GroupDraft): SchemaDraft => ({
  id: group.id,
  header: group.header,
  notes: null,
  rows: [],
});

const seedDraft = (mode: AxisEditorMode): DraftSeed =>
  mode.kind === "create"
    ? { mode: "schema", schema: defaultSchemaDraft() }
    : { mode: "schema", schema: schemaWithBodyToDraft(mode.schema) };

const modeKey = (mode: AxisEditorMode): string =>
  mode.kind === "create"
    ? `create:${mode.blockId}:${mode.groupId ?? ""}`
    : `edit:${mode.schema.schema.id}`;

export const AxisEditorModal: React.FC<AxisEditorModalProps> = ({
  open,
  onClose,
  planId,
  startDate,
  mode,
}): ReactElement => {
  const createSchema = useCreateSchema(planId, startDate);
  const updateSchema = useUpdateSchema(planId, startDate);
  const groupCreate = useCreateGroup(planId, startDate);
  const independentCreate = useCreateIndependentLadders(planId, startDate);

  const [seed, setSeed] = useState<DraftSeed>(() => seedDraft(mode));
  const [error, setError] = useState<string | null>(null);
  const [linkIntoBox, setLinkIntoBox] = useState(true);

  const modeRef = useRef(mode);

  modeRef.current = mode;

  const isSubmittingRef = useRef(false);

  const key = modeKey(mode);

  useEffect(() => {
    setSeed(seedDraft(modeRef.current));
    setError(null);
    setLinkIntoBox(true);
    isSubmittingRef.current = false;
  }, [key]);

  const onUpdateNode = (id: NodeId, patch: (schema: SchemaDraft) => SchemaDraft): void =>
    setSeed((prev) =>
      prev.mode === "schema" && prev.schema.id === id
        ? { mode: "schema", schema: patch(prev.schema) }
        : prev,
    );

  const onRename = (id: NodeId, header: string): void =>
    setSeed((prev) =>
      prev.mode === "schema" && prev.schema.id === id
        ? { mode: "schema", schema: { ...prev.schema, header: header === "" ? null : header } }
        : prev,
    );

  const onDraftChange = (next: DraftSeed): void => setSeed(next);

  const isCreateMode = mode.kind === "create";
  const isInGroupAdd = mode.kind === "create" && mode.groupId !== undefined;
  const isPending =
    createSchema.isPending ||
    updateSchema.isPending ||
    groupCreate.isPending ||
    independentCreate.isPending;
  const editSchema = seed.mode === "schema" ? seed.schema : undefined;
  const preview = useMemo(
    () =>
      isCreateMode || editSchema === undefined ? EMPTY_COMPOSITION : previewComposition(editSchema),
    [isCreateMode, editSchema],
  );
  const parts = useMemo(() => formatCompositionSummary(preview), [preview]);
  const labelKind = deriveCompositionLabel(preview).kind;
  const showsFlatHint = labelKind === FLAT_KIND && parts.length === 0;

  const releaseGuard = (): void => {
    isSubmittingRef.current = false;
  };

  const submitFlatCreate = (
    createMode: Extract<AxisEditorMode, { kind: "create" }>,
    schema: SchemaDraft,
  ): void => {
    const result = buildComposition(schema);

    if (!result.ok) {
      setError(result.error);

      return;
    }

    isSubmittingRef.current = true;
    createSchema.mutate(
      {
        blockId: createMode.blockId,
        ...(createMode.groupId !== undefined && { groupId: createMode.groupId }),
        composition: result.composition,
        header: schema.header,
        notes: null,
      },
      { onSuccess: onClose, onError: (cause) => setError(cause.message), onSettled: releaseGuard },
    );
  };

  const submitGroupCreate = (
    createMode: Extract<AxisEditorMode, { kind: "create" }>,
    group: GroupDraft,
  ): void => {
    isSubmittingRef.current = true;
    void groupCreate.run(
      { blockId: createMode.blockId, draft: group },
      {
        onSuccess: () => {
          releaseGuard();
          onClose();
        },
        onError: (message) => {
          setError(message);
          releaseGuard();
        },
      },
    );
  };

  const submitIndependentLadders = (
    createMode: Extract<AxisEditorMode, { kind: "create" }>,
    group: GroupDraft,
  ): void => {
    isSubmittingRef.current = true;
    void independentCreate.run(
      { blockId: createMode.blockId, draft: group },
      {
        onSuccess: () => {
          releaseGuard();
          onClose();
        },
        onError: (message) => {
          setError(message);
          releaseGuard();
        },
      },
    );
  };

  const submitEdit = (
    editMode: Extract<AxisEditorMode, { kind: "edit" }>,
    schema: SchemaDraft,
  ): void => {
    const result = buildComposition(schema);

    if (!result.ok) {
      setError(result.error);

      return;
    }

    isSubmittingRef.current = true;
    updateSchema.mutate(
      {
        schemaId: editMode.schema.schema.id,
        data: { composition: result.composition, header: schema.header },
      },
      { onSuccess: onClose, onError: (cause) => setError(cause.message), onSettled: releaseGuard },
    );
  };

  const handleSubmit = (): void => {
    if (isSubmittingRef.current || isPending) {
      return;
    }

    setError(null);

    if (mode.kind === "edit") {
      if (seed.mode === "schema") {
        submitEdit(mode, seed.schema);
      }

      return;
    }

    if (seed.mode === "group" && !isInGroupAdd) {
      if (linkIntoBox) {
        submitGroupCreate(mode, seed.group);
      } else {
        submitIndependentLadders(mode, seed.group);
      }

      return;
    }

    submitFlatCreate(mode, seed.mode === "schema" ? seed.schema : groupToFlatSchema(seed.group));
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
      error={error}
    >
      {isCreateMode ? (
        <CreateSchemaFlow
          draft={seed}
          onDraftChange={onDraftChange}
          linkIntoBox={linkIntoBox}
          onLinkIntoBoxChange={isInGroupAdd ? undefined : setLinkIntoBox}
        />
      ) : editSchema !== undefined ? (
        <Stack direction="column" spacing={BODY_SPACING}>
          <DerivedLabelCard labelKind={labelKind} parts={parts} showsFlatHint={showsFlatHint} />

          <ContainerInspector
            container={editSchema}
            isCreateMode={isCreateMode}
            headerEditable
            onUpdateNode={onUpdateNode}
            onRename={onRename}
            onDemoteNode={undefined}
          />
        </Stack>
      ) : null}
    </FormModal>
  );
};
