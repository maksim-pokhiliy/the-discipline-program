"use client";

import { useMemo } from "react";

import { type ExerciseEntry } from "@repo/contracts/lms/exercise-entry";
import {
  type GetPlanStructureResponse,
  type PlanStructureBlock,
  type PlanStructureSegment,
} from "@repo/contracts/lms/training-plan";

export type SelectedBlockResult = {
  block: PlanStructureBlock;
  parentSegment: undefined;
  parentBlock: undefined;
};

export type SelectedSegmentResult = {
  block: PlanStructureBlock;
  segment: PlanStructureSegment;
};

export type SelectedEntryResult = {
  block: PlanStructureBlock;
  segment: PlanStructureSegment;
  entry: ExerciseEntry;
};

export const findBlockById = (
  data: GetPlanStructureResponse | undefined,
  blockId: string,
): PlanStructureBlock | null => {
  if (!data) {
    return null;
  }

  for (const week of data.plan.weeks) {
    for (const day of week.days) {
      for (const session of day.sessions) {
        const found = session.blocks.find((b) => b.id === blockId);

        if (found) {
          return found;
        }
      }
    }
  }

  return null;
};

export const findSegmentById = (
  data: GetPlanStructureResponse | undefined,
  segmentId: string,
): SelectedSegmentResult | null => {
  if (!data) {
    return null;
  }

  for (const week of data.plan.weeks) {
    for (const day of week.days) {
      for (const session of day.sessions) {
        for (const block of session.blocks) {
          const segment = block.segments.find((s) => s.id === segmentId);

          if (segment) {
            return { block, segment };
          }
        }
      }
    }
  }

  return null;
};

export const findEntryById = (
  data: GetPlanStructureResponse | undefined,
  entryId: string,
): SelectedEntryResult | null => {
  if (!data) {
    return null;
  }

  for (const week of data.plan.weeks) {
    for (const day of week.days) {
      for (const session of day.sessions) {
        for (const block of session.blocks) {
          for (const segment of block.segments) {
            for (const setGroup of segment.setGroups) {
              const entry = setGroup.entries.find((e) => e.id === entryId);

              if (entry) {
                return { block, segment, entry };
              }
            }
          }
        }
      }
    }
  }

  return null;
};

export const useSelectedBlock = (
  data: GetPlanStructureResponse | undefined,
  blockId: string,
): PlanStructureBlock | null => useMemo(() => findBlockById(data, blockId), [blockId, data]);

export const useSelectedSegment = (
  data: GetPlanStructureResponse | undefined,
  segmentId: string,
): SelectedSegmentResult | null =>
  useMemo(() => findSegmentById(data, segmentId), [data, segmentId]);

export const useSelectedEntry = (
  data: GetPlanStructureResponse | undefined,
  entryId: string,
): SelectedEntryResult | null => useMemo(() => findEntryById(data, entryId), [data, entryId]);
