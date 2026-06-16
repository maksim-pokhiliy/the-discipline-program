"use client";

import { type ReactElement, useEffect, useMemo, useRef, useState } from "react";

import { deriveCompositionLabel } from "@repo/contracts/lms/composition";
import type { SchemaWithBody } from "@repo/contracts/lms/schema";
import { FormModal } from "@repo/ui";

import { useCreateSchema, useUpdateSchema } from "@app/lib/hooks";

import { makeNodeId } from "../lib/axis-draft-id";
import { buildComposition, previewComposition } from "../lib/build-axis-composition";
import { formatCompositionSummary } from "../lib/format-composition-summary";
import { schemaWithBodyToDraft } from "../lib/schema-to-draft";

import type { NodeId, SchemaDraft } from "./axes/axis-draft.types";
import { ContainerInspector } from "./axes/container-inspector";
import { CreateSchemaFlow } from "./create-schema-flow";
import { DerivedLabelCard } from "./derived-label-card";

const CREATE_TITLE = "Add schema";
const EDIT_TITLE = "Edit schema";
const CREATE_SUBMIT = "Add schema";
const EDIT_SUBMIT = "Save";
const FLAT_KIND = "flat";

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

const seedDraft = (mode: AxisEditorMode): SchemaDraft =>
  mode.kind === "create" ? defaultSchemaDraft() : schemaWithBodyToDraft(mode.schema);

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

  const [seed, setSeed] = useState<SchemaDraft>(() => seedDraft(mode));
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

  const onUpdateNode = (id: NodeId, patch: (schema: SchemaDraft) => SchemaDraft): void =>
    setSeed((prev) => (prev.id === id ? patch(prev) : prev));

  const onRename = (id: NodeId, header: string): void =>
    setSeed((prev) => (prev.id === id ? { ...prev, header: header === "" ? null : header } : prev));

  const isCreateMode = mode.kind === "create";
  const isPending = createSchema.isPending || updateSchema.isPending;
  const preview = useMemo(() => previewComposition(seed), [seed]);
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
        intensity: schema.intensity ?? null,
        notes: null,
      },
      { onSuccess: onClose, onError: (cause) => setError(cause.message), onSettled: releaseGuard },
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
        data: {
          composition: result.composition,
          header: schema.header,
          intensity: schema.intensity ?? null,
        },
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
      submitEdit(mode, seed);

      return;
    }

    submitFlatCreate(mode, seed);
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
      <DerivedLabelCard labelKind={labelKind} parts={parts} showsFlatHint={showsFlatHint} />

      {isCreateMode ? (
        <CreateSchemaFlow draft={seed} onUpdateNode={onUpdateNode} onRename={onRename} />
      ) : (
        <ContainerInspector
          container={seed}
          isCreateMode={false}
          headerEditable
          onUpdateNode={onUpdateNode}
          onRename={onRename}
          onDemoteNode={undefined}
        />
      )}
    </FormModal>
  );
};
