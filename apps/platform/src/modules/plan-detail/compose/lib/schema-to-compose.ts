import type { SchemaWithBody } from "@repo/contracts/lms/schema";

import { asNodeId } from "../../lib/axis-draft-id";
import {
  type InverseRefusalReason,
  schemaWithBodyToDraftContainer,
} from "../../lib/schema-to-draft-container";
import type { ComposeContainer, ComposeProgram } from "../compose-tree.types";

export type { InverseRefusalReason };

export type InverseResult =
  | { ok: true; program: ComposeProgram }
  | { ok: false; reason: InverseRefusalReason };

const SYNTHETIC_LABEL = "Block";

const wrapAsProgram = (root: ComposeContainer): ComposeProgram => ({
  weeks: [
    {
      id: asNodeId("compose-edit-week"),
      label: SYNTHETIC_LABEL,
      days: [
        {
          id: asNodeId("compose-edit-day"),
          label: SYNTHETIC_LABEL,
          sessions: [
            {
              id: asNodeId("compose-edit-session"),
              label: SYNTHETIC_LABEL,
              blocks: [{ id: asNodeId("compose-edit-block"), label: SYNTHETIC_LABEL, root }],
            },
          ],
        },
      ],
    },
  ],
});

export const schemaWithBodyToComposeContainer = (schema: SchemaWithBody): InverseResult => {
  const result = schemaWithBodyToDraftContainer(schema);

  if (!result.ok) {
    return result;
  }

  const root: ComposeContainer = {
    nodeType: "container",
    id: asNodeId("compose-edit-root"),
    header: null,
    notes: null,
    children: [result.container],
  };

  return { ok: true, program: wrapAsProgram(root) };
};

export const schemaWithBodyToComposeProgram = (schema: SchemaWithBody): InverseResult =>
  schemaWithBodyToComposeContainer(schema);
