import type { RowKind } from "@repo/contracts/lms/schema-row";

import { InnerLadderMarkerRowForm } from "./inner-ladder-marker-row-form";
import { RestRowForm } from "./rest-row-form";
import type { RowFormProps } from "./row-editor-types";
import { StandaloneLoadRowForm } from "./standalone-load-row-form";
import { StandaloneUrlRowForm } from "./standalone-url-row-form";

export const ROW_KIND_FORM_REGISTRY: Partial<Record<RowKind, React.FC<RowFormProps>>> = {
  STANDALONE_LOAD: StandaloneLoadRowForm,
  REST: RestRowForm,
  INNER_LADDER_MARKER: InnerLadderMarkerRowForm,
  STANDALONE_URL: StandaloneUrlRowForm,
};
