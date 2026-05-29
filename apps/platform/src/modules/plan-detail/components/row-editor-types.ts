import type { FieldErrors, FieldValues } from "react-hook-form";

import type { RowKind, SchemaRow, SchemaRowPayload } from "@repo/contracts/lms/schema-row";

export type RowEditorMode =
  | { kind: "create"; schemaId: string; rowKind: RowKind }
  | { kind: "edit"; row: SchemaRow };

export type RowFormProps = {
  mode: RowEditorMode;
  planId: string;
  startDate: string;
  onClose: () => void;
};

export type RowPayloadFormProps<TValue extends FieldValues> = {
  value: TValue;
  onChange: (next: TValue) => void;
  error?: FieldErrors<TValue> | undefined;
  disabled?: boolean;
};

export type RowPayloadFor<K extends RowKind> = Extract<SchemaRowPayload, { rowKind: K }>;
