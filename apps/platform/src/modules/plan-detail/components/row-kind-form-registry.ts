import type { RowKind } from "@repo/contracts/lms/schema-row";

import type { RowFormProps } from "./row-editor-types";
import { StandaloneLoadRowForm } from "./standalone-load-row-form";

export const ROW_KIND_FORM_REGISTRY: Partial<Record<RowKind, React.FC<RowFormProps>>> = {
  STANDALONE_LOAD: StandaloneLoadRowForm,
};
