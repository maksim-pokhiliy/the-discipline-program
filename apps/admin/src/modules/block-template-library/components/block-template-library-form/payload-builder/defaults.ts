import {
  type BlockTemplatePayload,
  defaultSchemeParams,
  type SchemeArchetypeKind,
} from "@repo/contracts/lms/_domain";
import { type ExerciseLibraryItem } from "@repo/contracts/lms/exercise-library-item";

type Segment = BlockTemplatePayload["segments"][number];
type SetGroup = Segment["setGroups"][number];
type Entry = SetGroup["entries"][number];

export const buildDefaultBlock = (kindId: string): BlockTemplatePayload["block"] => ({
  order: 0,
  kindId,
  title: null,
  status: "ACTIVE",
  weight: 5,
  notes: null,
});

export const buildDefaultEntry = (exercise: ExerciseLibraryItem, order: number): Entry => ({
  order,
  exerciseId: exercise.id,
  exerciseSnapshot: {
    id: exercise.id,
    name: exercise.name,
    primaryMovement: exercise.primaryMovement,
    modality: exercise.modality,
    primaryBodyParts: exercise.primaryBodyParts,
    defaultMetrics: exercise.defaultMetrics,
    demoVideoUrl: exercise.demoVideoUrl,
    demoImageUrl: exercise.demoImageUrl,
  },
  prescription: {
    reps: { kind: "FIXED", value: 10 },
    sideMode: "BILATERAL",
    modifiers: [],
  },
  alternatives: [],
  externalUrl: null,
  notes: null,
});

export const buildDefaultSetGroup = (order: number): SetGroup => ({
  order,
  label: null,
  restConfig: null,
  entries: [],
});

export const buildDefaultSegment = (
  order: number,
  kind: SchemeArchetypeKind = "NONE",
): Segment => ({
  order,
  label: null,
  archetypeKind: kind,
  schemeParams: defaultSchemeParams(kind),
  schemeTemplateId: null,
  restConfig: null,
  setGroups: [buildDefaultSetGroup(0)],
});

export const buildDefaultPayload = (kindId: string): BlockTemplatePayload => ({
  block: buildDefaultBlock(kindId),
  segments: [buildDefaultSegment(0)],
});
