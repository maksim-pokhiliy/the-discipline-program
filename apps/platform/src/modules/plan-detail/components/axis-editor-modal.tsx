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
import { isParallelDraft } from "../lib/parallel-ladder-draft";
import { schemaWithBodyToDraftContainer } from "../lib/schema-to-draft-container";
import { useCreateGroup } from "../lib/use-create-group";
import { useCreateIndependentLadders } from "../lib/use-create-independent-ladders";

import type { ComposeContainer, ComposeNode, NodeId } from "./axes/axis-draft.types";
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

type DraftSeed = { container: ComposeContainer };

const defaultDraftContainer = (): ComposeContainer => ({
  nodeType: "container",
  id: makeNodeId(),
  header: null,
  notes: null,
  children: [],
});

const seedDraft = (mode: AxisEditorMode): DraftSeed =>
  mode.kind === "create"
    ? { container: defaultDraftContainer() }
    : { container: schemaWithBodyToDraftContainer(mode.schema) };

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

  const [{ container: draft }, setSeed] = useState<DraftSeed>(() => seedDraft(mode));
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

  const onDraftChange = (next: ComposeContainer): void => setSeed({ container: next });

  const isCreateMode = mode.kind === "create";
  const isInGroupAdd = mode.kind === "create" && mode.groupId !== undefined;
  const isPending =
    createSchema.isPending ||
    updateSchema.isPending ||
    groupCreate.isPending ||
    independentCreate.isPending;
  const preview = useMemo(
    () => (isCreateMode ? EMPTY_COMPOSITION : previewComposition(draft)),
    [isCreateMode, draft],
  );
  const parts = useMemo(() => formatCompositionSummary(preview), [preview]);
  const labelKind = deriveCompositionLabel(preview).kind;
  const showsFlatHint = labelKind === FLAT_KIND && parts.length === 0;

  const releaseGuard = (): void => {
    isSubmittingRef.current = false;
  };

  const submitFlatCreate = (createMode: Extract<AxisEditorMode, { kind: "create" }>): void => {
    const result = buildComposition(draft);

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
        header: draft.header,
        notes: null,
      },
      { onSuccess: onClose, onError: (cause) => setError(cause.message), onSettled: releaseGuard },
    );
  };

  const submitGroupCreate = (createMode: Extract<AxisEditorMode, { kind: "create" }>): void => {
    isSubmittingRef.current = true;
    void groupCreate.run(
      { blockId: createMode.blockId, draft },
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
  ): void => {
    isSubmittingRef.current = true;
    void independentCreate.run(
      { blockId: createMode.blockId, draft },
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

  const submitEdit = (editMode: Extract<AxisEditorMode, { kind: "edit" }>): void => {
    const result = buildComposition(draft);

    if (!result.ok) {
      setError(result.error);

      return;
    }

    isSubmittingRef.current = true;
    updateSchema.mutate(
      {
        schemaId: editMode.schema.schema.id,
        data: { composition: result.composition, header: draft.header },
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
      submitEdit(mode);

      return;
    }

    if (isParallelDraft(draft) && !isInGroupAdd) {
      if (linkIntoBox) {
        submitGroupCreate(mode);
      } else {
        submitIndependentLadders(mode);
      }

      return;
    }

    submitFlatCreate(mode);
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
          draft={draft}
          onDraftChange={onDraftChange}
          linkIntoBox={linkIntoBox}
          onLinkIntoBoxChange={isInGroupAdd ? undefined : setLinkIntoBox}
        />
      ) : (
        <Stack direction="column" spacing={BODY_SPACING}>
          <DerivedLabelCard labelKind={labelKind} parts={parts} showsFlatHint={showsFlatHint} />

          <ContainerInspector
            container={draft}
            isCreateMode={isCreateMode}
            headerEditable
            onUpdateNode={onUpdateNode}
            onRename={onRename}
            onDemoteNode={undefined}
          />
        </Stack>
      )}
    </FormModal>
  );
};
