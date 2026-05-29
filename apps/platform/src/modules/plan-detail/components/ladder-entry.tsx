import { createElement } from "react";

import {
  LADDER_DEFAULTS,
  type LadderFlavour,
  LadderForm,
  toLadderParams,
} from "./ladder-schema-form";
import type { SchemaEditorMode } from "./schema-editor-types";

type LadderControlledProps = Omit<React.ComponentProps<typeof LadderForm>, "flavour">;

export const ladderEntry = (flavour: LadderFlavour) => ({
  Form: (props: LadderControlledProps) => createElement(LadderForm, { ...props, flavour }),
  defaultParams: LADDER_DEFAULTS[flavour],
  toParams: (mode: SchemaEditorMode) => toLadderParams(mode, flavour),
});
