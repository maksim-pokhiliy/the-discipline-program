"use client";

import { useState } from "react";

import { BaseModal } from "@repo/ui";

import type { SchemaEditorMode } from "./schema-editor-types";
import { SchemaParamFormDispatch } from "./schema-param-form-dispatch";
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

const resolveInitialParams = (mode: SchemaEditorMode): unknown => {
  const entry = SCHEMA_PARAM_FORM_REGISTRY[resolveArchetypeName(mode)];

  if (entry === undefined) {
    return {};
  }

  return entry.toParams(mode);
};

export const SchemaEditorModal: React.FC<SchemaEditorModalProps> = ({ open, onClose, mode }) => {
  const [params, setParams] = useState<unknown>(() => resolveInitialParams(mode));

  if (!open) {
    return null;
  }

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={mode.kind === "create" ? "Add schema" : "Edit schema"}
      maxWidth="md"
      fullWidth
    >
      <SchemaParamFormDispatch
        archetype={resolveArchetypeName(mode)}
        value={params}
        onChange={setParams}
      />
    </BaseModal>
  );
};
