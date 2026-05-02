import { type PlanOverride } from "@prisma/client";

import { type EffectivePlanWeek } from "@repo/contracts/lms/plan-override";

import {
  mapToBlock,
  mapToBlockSegment,
  mapToExerciseEntry,
  mapToLmsSession,
} from "../../mappers/lms";

import { buildAppendedEntries } from "./plan-override-resolver.apply-overrides";
import { type WeekWithTree } from "./plan-override-resolver.load-tree";
import { type EffectiveNode, baseNode } from "./plan-override-resolver.types";

type BlockWithTree = WeekWithTree["days"][number]["sessions"][number]["blocks"][number];
type SegmentWithTree = BlockWithTree["segments"][number];

const getNode = (nodeMap: Map<string, EffectiveNode>, id: string): EffectiveNode => {
  const existing = nodeMap.get(id);

  if (existing) {
    return existing;
  }

  const node = baseNode();

  nodeMap.set(id, node);

  return node;
};

const buildEffectiveSegment = (
  segment: SegmentWithTree,
  nodeMap: Map<string, EffectiveNode>,
  overrides: PlanOverride[],
): EffectivePlanWeek["days"][number]["sessions"][number]["blocks"][number]["segments"][number] => {
  const segmentNode = getNode(nodeMap, segment.id);
  const mappedSegment = mapToBlockSegment(segment);
  const allEntries = segment.setGroups.flatMap((sg) => sg.entries);

  const baseEntries = allEntries.map((entry) => {
    const entryNode = getNode(nodeMap, entry.id);
    const mapped = mapToExerciseEntry(entry);

    return {
      ...entryNode,
      id: entry.id,
      order: mapped.order,
    };
  });

  const appendedEntries = buildAppendedEntries(overrides, segment.id, allEntries.length);

  return {
    ...segmentNode,
    id: segment.id,
    order: mappedSegment.order,
    entries: [...baseEntries, ...appendedEntries],
  };
};

const buildEffectiveBlock = (
  block: BlockWithTree,
  nodeMap: Map<string, EffectiveNode>,
  overrides: PlanOverride[],
): EffectivePlanWeek["days"][number]["sessions"][number]["blocks"][number] => {
  const blockNode = getNode(nodeMap, block.id);
  const mappedBlock = mapToBlock(block);
  const segments = block.segments.map((segment) =>
    buildEffectiveSegment(segment, nodeMap, overrides),
  );

  return {
    ...blockNode,
    id: block.id,
    order: mappedBlock.order,
    segments,
  };
};

export const buildEffectiveWeek = (
  week: WeekWithTree,
  nodeMap: Map<string, EffectiveNode>,
  overrides: PlanOverride[],
): EffectivePlanWeek => {
  return {
    ...baseNode(),
    id: week.id,
    index: week.index,
    days: week.days.map((day) => {
      const dayNode = getNode(nodeMap, day.id);

      return {
        ...dayNode,
        id: day.id,
        sessions: day.sessions.map((session) => {
          const sessionNode = getNode(nodeMap, session.id);
          const mappedSession = mapToLmsSession(session);

          return {
            ...sessionNode,
            id: session.id,
            order: mappedSession.order,
            blocks: session.blocks.map((block) => buildEffectiveBlock(block, nodeMap, overrides)),
          };
        }),
      };
    }),
  };
};
