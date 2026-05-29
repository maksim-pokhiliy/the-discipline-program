import type { ArchetypeName, ArchetypeParams } from "@repo/contracts/lms/schema";

import {
  AmrapFlatSchemaForm,
  amrapFlatDefaultParams,
  toAmrapFlatParams,
} from "./amrap-flat-schema-form";
import { NRoundsSchemaForm, nRoundsDefaultParams, toNRoundsParams } from "./n-rounds-schema-form";
import type { SchemaEditorMode, SchemaParamFormProps } from "./schema-editor-types";

export type ParamsFor<N extends ArchetypeName> = Extract<
  ArchetypeParams,
  { archetype: N }
>["params"];

export type SchemaParamFormEntry<N extends ArchetypeName> = {
  Form: React.FC<SchemaParamFormProps<ParamsFor<N>>>;
  defaultParams: ParamsFor<N>;
  toParams: (mode: SchemaEditorMode) => ParamsFor<N>;
};

export const SCHEMA_PARAM_FORM_REGISTRY: {
  [N in ArchetypeName]?: SchemaParamFormEntry<N>;
} = {
  "amrap-flat": {
    Form: AmrapFlatSchemaForm,
    defaultParams: amrapFlatDefaultParams,
    toParams: toAmrapFlatParams,
  },
  "n-rounds": {
    Form: NRoundsSchemaForm,
    defaultParams: nRoundsDefaultParams,
    toParams: toNRoundsParams,
  },
};
