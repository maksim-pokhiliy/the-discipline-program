import type { ArchetypeName, SchemaKind, SchemaWithBody } from "@repo/contracts/lms/schema";

export type SelectedArchetype = {
  archetypeId: string;
  name: ArchetypeName;
  kind: SchemaKind;
};

export type SchemaEditorMode =
  | { kind: "create"; blockId: string; archetype: SelectedArchetype }
  | { kind: "edit"; schema: SchemaWithBody };

export type SchemaParamFormProps = {
  mode: SchemaEditorMode;
  planId: string;
  startDate: string;
  onClose: () => void;
};
