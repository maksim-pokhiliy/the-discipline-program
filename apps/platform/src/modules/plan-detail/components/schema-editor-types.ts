import type { FieldErrors, FieldValues } from "react-hook-form";

import type {
  ArchetypeName,
  ArchetypeParams,
  SchemaKind,
  SchemaWithBody,
} from "@repo/contracts/lms/schema";

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

export type ParamsFor<N extends ArchetypeName> = Extract<
  ArchetypeParams,
  { archetype: N }
>["params"];

export type SchemaParamFormEntry<N extends ArchetypeName> = {
  Form: React.FC<SchemaParamFormProps<ParamsFor<N>>>;
  defaultParams: ParamsFor<N>;
  toParams: (mode: SchemaEditorMode) => ParamsFor<N>;
};
