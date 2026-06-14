import {
  type CreateRowGroupRequest,
  createRowGroupRequestSchema,
} from "@repo/contracts/lms/row-group";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import { formatZodIssue } from "./format-zod-issue";
import { selectContiguousByListPosition } from "./select-contiguous";

const NON_CONTIGUOUS_ERROR = "Selected rows must be next to each other";

const REQUEST_BUILD_FALLBACK = "could not build the group create request.";

export type RowGroupCreateRequestResult =
  | { ok: true; request: CreateRowGroupRequest }
  | { ok: false; error: string };

export const buildRowGroupCreateRequest = (
  rows: SchemaRow[],
  selectedIds: ReadonlySet<string>,
  schemaId: string,
  notes: string[] | null = null,
): RowGroupCreateRequestResult => {
  const contiguous = selectContiguousByListPosition(rows, selectedIds);

  if (!contiguous.ok) {
    return { ok: false, error: NON_CONTIGUOUS_ERROR };
  }

  const parsed = createRowGroupRequestSchema.safeParse({
    schemaId,
    rowIds: contiguous.orderedIds,
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
