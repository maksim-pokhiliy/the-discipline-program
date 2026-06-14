import {
  type CreateRowGroupRequest,
  createRowGroupRequestSchema,
} from "@repo/contracts/lms/row-group";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import { formatZodIssue } from "./format-zod-issue";

const NON_CONTIGUOUS_ERROR = "Selected rows must be next to each other";

const REQUEST_BUILD_FALLBACK = "could not build the group create request.";

const CONTIGUITY_SPAN_OFFSET = 1;

export type RowGroupCreateRequestResult =
  | { ok: true; request: CreateRowGroupRequest }
  | { ok: false; error: string };

export const buildRowGroupCreateRequest = (
  rows: SchemaRow[],
  selectedIds: ReadonlySet<string>,
  schemaId: string,
  notes: string[] | null = null,
): RowGroupCreateRequestResult => {
  const sorted = [...rows].sort((a, b) => a.order - b.order);

  const selectedInOrder = sorted
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => selectedIds.has(row.id));

  const first = selectedInOrder[0];
  const last = selectedInOrder[selectedInOrder.length - 1];
  const isContiguous =
    first !== undefined &&
    last !== undefined &&
    last.index - first.index + CONTIGUITY_SPAN_OFFSET === selectedInOrder.length;

  if (!isContiguous) {
    return { ok: false, error: NON_CONTIGUOUS_ERROR };
  }

  const parsed = createRowGroupRequestSchema.safeParse({
    schemaId,
    rowIds: selectedInOrder.map(({ row }) => row.id),
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
