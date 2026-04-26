import {
  type BlockSegment as PrismaBlockSegment,
  type ExerciseEntry as PrismaExerciseEntry,
  type SetGroup as PrismaSetGroup,
} from "@prisma/client";

import { restSpecSchema, schemeParamsSchema } from "@repo/contracts/lms/_domain";
import { type BlockSegment } from "@repo/contracts/lms/block-segment";
import { type ExerciseEntry } from "@repo/contracts/lms/exercise-entry";
import { type SetGroup } from "@repo/contracts/lms/set-group";

import { SCHEME_ARCHETYPE_KIND_MAP } from "./enum-maps";
import { mapToSetGroupWithEntries } from "./set-group.mapper";

type SetGroupWithEntries = PrismaSetGroup & { entries: PrismaExerciseEntry[] };

export type BlockSegmentWithSetGroupsRow = PrismaBlockSegment & {
  setGroups: SetGroupWithEntries[];
};

export type BlockSegmentWithSetGroups = BlockSegment & {
  setGroups: (SetGroup & { entries: ExerciseEntry[] })[];
};

export const mapToBlockSegment = (s: PrismaBlockSegment): BlockSegment => ({
  id: s.id,
  blockId: s.blockId,
  order: s.order,
  label: s.label,
  archetypeKind: SCHEME_ARCHETYPE_KIND_MAP[s.archetypeKind],
  schemeParams: schemeParamsSchema.parse(s.schemeParams),
  schemeTemplateId: s.schemeTemplateId,
  restConfig: s.restConfig === null ? null : restSpecSchema.parse(s.restConfig),
});

export const mapToBlockSegmentWithSetGroups = (
  s: BlockSegmentWithSetGroupsRow,
): BlockSegmentWithSetGroups => ({
  ...mapToBlockSegment(s),
  setGroups: s.setGroups.map(mapToSetGroupWithEntries),
});
