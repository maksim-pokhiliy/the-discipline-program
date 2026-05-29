import type { FieldErrors, FieldValues } from "react-hook-form";

import type { ArchetypeName, SchemaKind, SchemaWithBody } from "@repo/contracts/lms/schema";

export type SelectedArchetype = {
  archetypeId: string;
  name: ArchetypeName;
  kind: SchemaKind;
};

export type SchemaEditorMode =
  | { kind: "create"; blockId: string; archetype: SelectedArchetype }
  | { kind: "edit"; schema: SchemaWithBody };

export type SchemaParamFormProps<TParams extends FieldValues> = {
  value: TParams;
  onChange: (next: TParams) => void;
  error?: FieldErrors<TParams> | undefined;
  disabled?: boolean;
};
