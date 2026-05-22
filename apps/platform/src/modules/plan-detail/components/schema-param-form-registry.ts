import type { ArchetypeName } from "@repo/contracts/lms/schema";

import { AmrapFlatSchemaForm } from "./amrap-flat-schema-form";
import { NRoundsSchemaForm } from "./n-rounds-schema-form";
import type { SchemaParamFormProps } from "./schema-editor-types";

export const SCHEMA_PARAM_FORM_REGISTRY: Partial<
  Record<ArchetypeName, React.FC<SchemaParamFormProps>>
> = {
  "amrap-flat": AmrapFlatSchemaForm,
  "n-rounds": NRoundsSchemaForm,
};
