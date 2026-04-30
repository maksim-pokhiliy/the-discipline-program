import { type BulkPatchOp } from "@repo/contracts/lms/training-plan";

import {
  type SelectedBlockResult,
  type SelectedEntryResult,
  type SelectedSegmentResult,
} from "../../inspector/use-selected-entities";

import { type BulkOpChunks, chunkBulkOps } from "./chunk";

export type BulkDeleteBlocksInput = {
  blocks: readonly Pick<NonNullable<SelectedBlockResult["block"]>, "id" | "version">[];
};

export type BulkDeleteSegmentsInput = {
  segments: readonly Pick<NonNullable<SelectedSegmentResult["segment"]>, "id" | "version">[];
};

export type BulkDeleteEntriesInput = {
  entries: readonly Pick<NonNullable<SelectedEntryResult["entry"]>, "id" | "version">[];
};

export const buildBulkDeleteBlockOps = ({ blocks }: BulkDeleteBlocksInput): BulkOpChunks => {
  const ops: BulkPatchOp[] = blocks.map((block) => ({
    kind: "delete-block",
    blockId: block.id,
    expectedVersion: block.version,
  }));

  return chunkBulkOps(ops);
};

export const buildBulkDeleteSegmentOps = ({ segments }: BulkDeleteSegmentsInput): BulkOpChunks => {
  const ops: BulkPatchOp[] = segments.map((segment) => ({
    kind: "delete-segment",
    segmentId: segment.id,
    expectedVersion: segment.version,
  }));

  return chunkBulkOps(ops);
};

export const buildBulkDeleteEntryOps = ({ entries }: BulkDeleteEntriesInput): BulkOpChunks => {
  const ops: BulkPatchOp[] = entries.map((entry) => ({
    kind: "delete-entry",
    entryId: entry.id,
    expectedVersion: entry.version,
  }));

  return chunkBulkOps(ops);
};
