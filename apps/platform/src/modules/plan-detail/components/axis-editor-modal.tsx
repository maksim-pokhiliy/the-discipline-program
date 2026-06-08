"use client";

import { Fragment, type ReactElement, useEffect, useMemo, useRef, useState } from "react";

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
import {
  type CompositionSummaryPart,
  formatCompositionSummary,
} from "../lib/format-composition-summary";
import {
  type InverseRefusalReason,
  schemaWithBodyToDraftContainer,
} from "../lib/schema-to-draft-container";

import type { ComposeContainer, ComposeNode, NodeId } from "./axes/axis-draft.types";
import { ContainerInspector } from "./axes/container-inspector";
import { InertScoringChip } from "./inert-scoring-chip";
import { SchemaCompositionTag } from "./schema-composition-tag";

const CREATE_TITLE = "Add schema";
const EDIT_TITLE = "Container composition";
const CREATE_SUBMIT = "Add schema";
const EDIT_SUBMIT = "Save";
const LABEL_CAPTION = "computed (arrangement-first, scoring excluded)";
const FLAT_HINT = "flat — plain container";
const FLAT_KIND = "flat";
const CREATE_ARRANGEMENT_HINT =
  "parallel / superset unlock once this schema has rows or sub-schemas — add those first, then tune here.";
const PART_SEPARATOR = "·";
const LABEL_SPACING = 1;
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

const activePartsOf = (parts: CompositionSummaryPart[]): CompositionSummaryPart[] =>
  parts.filter((part) => part.tone === "active");

const inertPartOf = (parts: CompositionSummaryPart[]): CompositionSummaryPart | undefined =>
  parts.find((part) => part.tone === "inert");

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

  const key = modeKey(mode);

  useEffect(() => {
    setSeed(seedDraft(modeRef.current));
    setError(null);
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
  const activeParts = activePartsOf(parts);
  const inertPart = inertPartOf(parts);
  const showsFlatHint =
    labelKind === FLAT_KIND && activeParts.length === 0 && inertPart === undefined;

  const handleSubmit = (): void => {
    setError(null);

    const result = buildComposition(draft);

    if (!result.ok) {
      setError(result.error);

      return;
    }

    const header = draft.header;

    if (mode.kind === "create") {
      createSchema.mutate(
        { blockId: mode.blockId, composition: result.composition, header, notes: null },
        { onSuccess: onClose, onError: (cause) => setError(cause.message) },
      );

      return;
    }

    updateSchema.mutate(
      { schemaId: mode.schema.schema.id, data: { composition: result.composition, header } },
      { onSuccess: onClose, onError: (cause) => setError(cause.message) },
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
        <Stack
          direction="row"
          alignItems="center"
          spacing={LABEL_SPACING}
          useFlexGap
          flexWrap="wrap"
        >
          <SchemaCompositionTag label={labelKind} />

          {activeParts.map((part, i) => (
            <Fragment key={`${String(i)}-${part.text}`}>
              {i > 0 ? (
                <Typography variant="caption" component="span" color="text.disabled">
                  {PART_SEPARATOR}
                </Typography>
              ) : null}
              <Typography variant="caption" component="span" color="text.secondary">
                {part.text}
              </Typography>
            </Fragment>
          ))}

          {inertPart !== undefined ? <InertScoringChip text={inertPart.text} /> : null}

          {showsFlatHint ? (
            <Typography variant="caption" color="text.subtle" fontStyle="italic">
              {FLAT_HINT}
            </Typography>
          ) : null}

          <Typography variant="caption" color="text.subtle" sx={{ ml: "auto" }} fontStyle="italic">
            {LABEL_CAPTION}
          </Typography>
        </Stack>

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
