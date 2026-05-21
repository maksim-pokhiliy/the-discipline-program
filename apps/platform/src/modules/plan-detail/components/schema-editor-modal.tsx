"use client";

import type { SchemaEditorMode } from "./schema-editor-types";
import { SCHEMA_PARAM_FORM_REGISTRY } from "./schema-param-form-registry";

type SchemaEditorModalProps = {
  open: boolean;
  onClose: () => void;
  mode: SchemaEditorMode;
  planId: string;
  startDate: string;
};

const resolveArchetypeName = (mode: SchemaEditorMode) =>
  mode.kind === "create" ? mode.archetype.name : mode.schema.schema.archetypeParams.archetype;

export const SchemaEditorModal: React.FC<SchemaEditorModalProps> = ({
  open,
  onClose,
  mode,
  planId,
  startDate,
}) => {
  if (!open) {
    return null;
  }

  const ParamForm = SCHEMA_PARAM_FORM_REGISTRY[resolveArchetypeName(mode)];

  if (ParamForm === undefined) {
    return null;
  }

  return <ParamForm mode={mode} planId={planId} startDate={startDate} onClose={onClose} />;
};
