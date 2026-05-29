import { createElement } from "react";

import {
  PARALLEL_LADDERS_DEFAULTS,
  ParallelLaddersForm,
  toParallelLaddersParams,
} from "./parallel-ladders-schema-form";
import type { SchemaEditorMode } from "./schema-editor-types";

type ParallelLaddersControlledProps = Omit<
  React.ComponentProps<typeof ParallelLaddersForm>,
  "mixed"
>;

export const parallelLaddersEntry = (mixed: boolean) => ({
  Form: (props: ParallelLaddersControlledProps) =>
    createElement(ParallelLaddersForm, { ...props, mixed }),
  defaultParams: mixed ? PARALLEL_LADDERS_DEFAULTS.mixed : PARALLEL_LADDERS_DEFAULTS.descending,
  toParams: (mode: SchemaEditorMode) => toParallelLaddersParams(mode, mixed),
});
