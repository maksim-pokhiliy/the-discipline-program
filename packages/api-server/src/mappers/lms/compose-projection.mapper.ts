import {
  type ComposeContainer,
  type ComposeRow,
  composeContainerSchema,
} from "@repo/contracts/lms/composition";
import { type SchemaWithBody } from "@repo/contracts/lms/schema";
import { type SchemaRow } from "@repo/contracts/lms/schema-row";
import { BadRequestError, InternalServerError } from "@repo/errors";

export const projectSchemaRow = (row: SchemaRow): ComposeRow => ({
  nodeType: "row",
  id: row.id,
  exerciseId: row.exerciseId,
  reps: row.reps,
  load: row.load,
  side: row.side,
  tempo: row.tempo,
  media: row.media,
  notes: row.notes,
});

export const projectSchemaWithBody = (node: SchemaWithBody): ComposeContainer => ({
  nodeType: "container",
  id: node.schema.id,
  header: node.schema.header,
  notes: node.schema.notes,
  composition: node.schema.composition ?? {},
  children: node.rows.map(projectSchemaRow),
});

export const assertComposeTreeValid = (node: SchemaWithBody): void => {
  const result = composeContainerSchema.safeParse(projectSchemaWithBody(node));

  if (!result.success) {
    throw new InternalServerError("Schema composition tree failed validation", {
      kind: "DbCorruption",
      entity: "Schema",
      issues: result.error.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
        code: e.code,
      })),
    });
  }
};

export const assertComposeTreeValidForWrite = (node: SchemaWithBody): void => {
  const result = composeContainerSchema.safeParse(projectSchemaWithBody(node));

  if (!result.success) {
    throw new BadRequestError("Schema composition tree is invalid", {
      entity: "Schema",
      issues: result.error.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
        code: e.code,
      })),
    });
  }
};
