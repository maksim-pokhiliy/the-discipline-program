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

const isContiguousByOrder = (orders: number[]): boolean => {
  const min = Math.min(...orders);
  const max = Math.max(...orders);

  return max - min + CONTIGUITY_SPAN_OFFSET === orders.length;
};

export const buildRowGroupCreateRequest = (
  rows: SchemaRow[],
  schemaId: string,
  notes: string[] | null = null,
): RowGroupCreateRequestResult => {
  const sorted = [...rows].sort((a, b) => a.order - b.order);

  if (!isContiguousByOrder(sorted.map((row) => row.order))) {
    return { ok: false, error: NON_CONTIGUOUS_ERROR };
  }

  const parsed = createRowGroupRequestSchema.safeParse({
    schemaId,
    rowIds: sorted.map((row) => row.id),
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
