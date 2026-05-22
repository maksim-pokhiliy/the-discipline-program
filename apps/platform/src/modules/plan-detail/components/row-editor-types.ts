import type { RowKind, SchemaRow } from "@repo/contracts/lms/schema-row";

export type RowEditorMode =
  | { kind: "create"; schemaId: string; rowKind: RowKind }
  | { kind: "edit"; row: SchemaRow };

export type RowFormProps = {
  mode: RowEditorMode;
  planId: string;
  startDate: string;
  onClose: () => void;
};
