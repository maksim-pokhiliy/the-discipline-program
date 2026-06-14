import type { SchemaWithBody } from "@repo/contracts/lms/schema";
import {
  type CreateGroupRequest,
  createGroupRequestSchema,
} from "@repo/contracts/lms/schema-group";

import { formatZodIssue } from "./format-zod-issue";
import { selectContiguousByListPosition } from "./select-contiguous";

const NON_CONTIGUOUS_ERROR = "Selected schemas must be next to each other";

const REQUEST_BUILD_FALLBACK = "could not build the group create request.";

export type SchemaGroupCreateRequestResult =
  | { ok: true; request: CreateGroupRequest }
  | { ok: false; error: string };

export const buildSchemaGroupCreateRequest = (
  schemas: SchemaWithBody[],
  selectedIds: ReadonlySet<string>,
  blockId: string,
  notes: string[] | null = null,
): SchemaGroupCreateRequestResult => {
  const items = schemas.map((entry) => ({ id: entry.schema.id, order: entry.schema.order }));

  const contiguous = selectContiguousByListPosition(items, selectedIds);

  if (!contiguous.ok) {
    return { ok: false, error: NON_CONTIGUOUS_ERROR };
  }

  const parsed = createGroupRequestSchema.safeParse({
    blockId,
    schemaIds: contiguous.orderedIds,
    notes,
  });

  if (!parsed.success) {
    const [issue] = parsed.error.issues;

    return {
      ok: false,
      error: issue === undefined ? REQUEST_BUILD_FALLBACK : formatZodIssue(issue),
    };
  }

  return { ok: true, request: parsed.data };
};
