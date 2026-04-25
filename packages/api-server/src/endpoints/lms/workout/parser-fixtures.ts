import { type TiptapNode } from "@repo/contracts/common/tiptap-doc";
import { ExerciseStatus } from "@repo/contracts/library/exercise";
import { SchemeKind } from "@repo/contracts/library/scheme";

import { type LibraryLookup, type ParseWorkoutDocOptions } from "./parser-types";

export const BLOCK_TYPE_ID = "cl000000000000000000bt001";
export const SCHEME_ID_STRAIGHT = "cl000000000000000000sch001";
export const SCHEME_ID_EMOM = "cl000000000000000000sch002";
export const EXERCISE_ID_A = "cl000000000000000000ex0001";
export const EXERCISE_ID_B = "cl000000000000000000ex0002";
export const SAVING_COACH_ID = "cl000000000000000000usr001";

export const buildLookup = (overrides?: Partial<LibraryLookup>): LibraryLookup => ({
  blockTypeIds: overrides?.blockTypeIds ?? new Set([BLOCK_TYPE_ID]),
  schemeIds: overrides?.schemeIds ?? new Set([SCHEME_ID_STRAIGHT, SCHEME_ID_EMOM]),
  exerciseIds: overrides?.exerciseIds ?? new Set([EXERCISE_ID_A, EXERCISE_ID_B]),
  exercisesById:
    overrides?.exercisesById ??
    new Map([
      [
        EXERCISE_ID_A,
        { id: EXERCISE_ID_A, status: ExerciseStatus.APPROVED, createdByUserId: "someone-else" },
      ],
      [
        EXERCISE_ID_B,
        { id: EXERCISE_ID_B, status: ExerciseStatus.APPROVED, createdByUserId: "someone-else" },
      ],
    ]),
});

export const parserOpts: ParseWorkoutDocOptions = { savingCoachUserId: SAVING_COACH_ID };

export const mentionNode = (
  exerciseId: string,
  attrs: Record<string, unknown> = {},
): TiptapNode => ({
  type: "exerciseMention",
  attrs: { exerciseId, ...attrs },
});

export const blockNode = (
  blockTypeId: string,
  sections: TiptapNode[],
  title?: string | null,
): TiptapNode => ({
  type: "block",
  attrs: { blockTypeId, title: title ?? null, sortOrder: 0 },
  content: sections,
});

export const schemeSectionNode = (
  schemeKind: SchemeKind,
  schemeId: string | null,
  children: TiptapNode[],
  extras?: Record<string, unknown>,
): TiptapNode => ({
  type: "schemeSection",
  attrs: {
    schemeKind,
    schemeId,
    schemeConfig: {},
    effortPct: null,
    pace: null,
    note: null,
    sortOrder: 0,
    ...extras,
  },
  content: children,
});

export const notesSectionNode = (paragraphs: TiptapNode[]): TiptapNode => ({
  type: "notesSection",
  attrs: { note: null, sortOrder: 0 },
  content: paragraphs,
});

export const textCalloutSectionNode = (tone: string, paragraphs: TiptapNode[]): TiptapNode => ({
  type: "textCalloutSection",
  attrs: { tone, note: null, sortOrder: 0 },
  content: paragraphs,
});

export const exerciseLineNode = (children: TiptapNode[]): TiptapNode => ({
  type: "exerciseLine",
  attrs: { sortOrder: 0 },
  content: children,
});

export const straightSetsBlock = (children: TiptapNode[] = []): TiptapNode =>
  blockNode(BLOCK_TYPE_ID, [
    schemeSectionNode(SchemeKind.STRAIGHT_SETS, SCHEME_ID_STRAIGHT, [exerciseLineNode(children)]),
  ]);
