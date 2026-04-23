import { describe, expect, it } from "vitest";

import { type TiptapDoc } from "@repo/contracts/common/tiptap-doc";
import { ExerciseStatus } from "@repo/contracts/library/exercise";
import { SchemeKind } from "@repo/contracts/library/scheme";
import { WorkoutRepScheme } from "@repo/contracts/lms/workout-block";
import { BadRequestError } from "@repo/errors";

import { parseTiptapDoc } from "./parser";
import {
  BLOCK_TYPE_ID,
  EXERCISE_ID_A,
  SAVING_COACH_ID,
  SCHEME_ID_STRAIGHT,
  buildLookup,
  mentionNode,
  parserOpts,
  straightSetsBlock,
} from "./parser-fixtures";

describe("parseTiptapDoc core scenarios", () => {
  it("returns empty tree for an empty doc", () => {
    const doc: TiptapDoc = { type: "doc", content: [] };
    const result = parseTiptapDoc(doc, buildLookup(), parserOpts);

    expect(result.blocks).toHaveLength(0);
  });

  it("parses a straightSets block with one mention", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [straightSetsBlock([mentionNode(EXERCISE_ID_A, { repValues: [5, 5, 5], sets: 3 })])],
    };

    const result = parseTiptapDoc(doc, buildLookup(), parserOpts);

    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]?.blockTypeId).toBe(BLOCK_TYPE_ID);
    expect(result.blocks[0]?.schemeKind).toBe(SchemeKind.STRAIGHT_SETS);
    expect(result.blocks[0]?.exercises).toHaveLength(1);
    expect(result.blocks[0]?.exercises[0]?.exerciseId).toBe(EXERCISE_ID_A);
    expect(result.blocks[0]?.exercises[0]?.repScheme).toBe(WorkoutRepScheme.STRAIGHT);
    expect(result.blocks[0]?.exercises[0]?.repValues).toEqual([5, 5, 5]);
    expect(result.blocks[0]?.exercises[0]?.sets).toBe(3);
  });

  it("preserves ladder repValues as-is", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [
        straightSetsBlock([
          mentionNode(EXERCISE_ID_A, {
            repScheme: WorkoutRepScheme.LADDER,
            repValues: [36, 28, 20],
          }),
        ]),
      ],
    };

    const result = parseTiptapDoc(doc, buildLookup(), parserOpts);

    expect(result.blocks[0]?.exercises[0]?.repScheme).toBe(WorkoutRepScheme.LADDER);
    expect(result.blocks[0]?.exercises[0]?.repValues).toEqual([36, 28, 20]);
    expect(result.blocks[0]?.exercises[0]?.sets).toBe(3);
  });

  it("rejects an unknown block node type", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [{ type: "noSuchKind", attrs: { blockTypeId: BLOCK_TYPE_ID } }],
    };

    expect(() => parseTiptapDoc(doc, buildLookup(), parserOpts)).toThrow(BadRequestError);
  });

  it("rejects invalid blockTypeId reference", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [
        {
          type: "straightSets",
          attrs: { blockTypeId: "unknown-bt", schemeId: SCHEME_ID_STRAIGHT, schemeConfig: {} },
          content: [mentionNode(EXERCISE_ID_A)],
        },
      ],
    };

    expect(() => parseTiptapDoc(doc, buildLookup(), parserOpts)).toThrow(BadRequestError);
  });

  it("rejects invalid schemeId reference", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [
        {
          type: "straightSets",
          attrs: { blockTypeId: BLOCK_TYPE_ID, schemeId: "unknown-scheme", schemeConfig: {} },
          content: [mentionNode(EXERCISE_ID_A)],
        },
      ],
    };

    expect(() => parseTiptapDoc(doc, buildLookup(), parserOpts)).toThrow(BadRequestError);
  });

  it("rejects invalid exerciseId reference", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [straightSetsBlock([mentionNode("unknown-ex")])],
    };

    expect(() => parseTiptapDoc(doc, buildLookup(), parserOpts)).toThrow(BadRequestError);
  });

  it("rejects referencing a non-approved exercise not owned by the saving coach", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [straightSetsBlock([mentionNode(EXERCISE_ID_A)])],
    };

    const lookup = buildLookup({
      exercisesById: new Map([
        [
          EXERCISE_ID_A,
          {
            id: EXERCISE_ID_A,
            status: ExerciseStatus.PENDING_REVIEW,
            createdByUserId: "another-coach",
          },
        ],
      ]),
    });

    expect(() => parseTiptapDoc(doc, lookup, parserOpts)).toThrow(BadRequestError);
  });

  it("accepts pending exercise created by the saving coach", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [straightSetsBlock([mentionNode(EXERCISE_ID_A)])],
    };

    const lookup = buildLookup({
      exercisesById: new Map([
        [
          EXERCISE_ID_A,
          {
            id: EXERCISE_ID_A,
            status: ExerciseStatus.PENDING_REVIEW,
            createdByUserId: SAVING_COACH_ID,
          },
        ],
      ]),
    });

    const result = parseTiptapDoc(doc, lookup, parserOpts);

    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]?.exercises).toHaveLength(1);
  });
});
