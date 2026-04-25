import { describe, expect, it } from "vitest";

import { type TiptapDoc } from "@repo/contracts/common/tiptap-doc";
import { ExerciseStatus } from "@repo/contracts/library/exercise";
import { SchemeKind } from "@repo/contracts/library/scheme";
import { SchemeSectionKind, WorkoutRepScheme } from "@repo/contracts/lms/workout-block";
import { BadRequestError } from "@repo/errors";

import { parseTiptapDoc } from "./parser";
import {
  BLOCK_TYPE_ID,
  EXERCISE_ID_A,
  EXERCISE_ID_B,
  SAVING_COACH_ID,
  SCHEME_ID_EMOM,
  SCHEME_ID_STRAIGHT,
  blockNode,
  buildLookup,
  exerciseLineNode,
  mentionNode,
  notesSectionNode,
  parserOpts,
  schemeSectionNode,
  straightSetsBlock,
  textCalloutSectionNode,
} from "./parser-fixtures";

describe("parseTiptapDoc happy paths", () => {
  it("returns empty tree for an empty doc", () => {
    const doc: TiptapDoc = { type: "doc", content: [] };
    const result = parseTiptapDoc(doc, buildLookup(), parserOpts);

    expect(result.blocks).toHaveLength(0);
  });

  it("parses one block with one schemeSection containing one exerciseLine and one mention", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [straightSetsBlock([mentionNode(EXERCISE_ID_A, { repValues: [5, 5, 5], sets: 3 })])],
    };
    const result = parseTiptapDoc(doc, buildLookup(), parserOpts);

    expect(result.blocks).toHaveLength(1);

    const block = result.blocks[0];

    expect(block?.blockTypeId).toBe(BLOCK_TYPE_ID);
    expect(block?.sections).toHaveLength(1);

    const section = block?.sections[0];

    expect(section?.kind).toBe(SchemeSectionKind.SCHEME);
    expect(section?.schemeKind).toBe(SchemeKind.STRAIGHT_SETS);
    expect(section?.schemeId).toBe(SCHEME_ID_STRAIGHT);
    expect(section?.exercises).toHaveLength(1);
    expect(section?.exercises[0]?.exerciseId).toBe(EXERCISE_ID_A);
    expect(section?.exercises[0]?.repScheme).toBe(WorkoutRepScheme.STRAIGHT);
    expect(section?.exercises[0]?.repValues).toEqual([5, 5, 5]);
    expect(section?.exercises[0]?.sets).toBe(3);
  });

  it("parses one block with two schemeSections of different schemeKinds", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [
        blockNode(BLOCK_TYPE_ID, [
          schemeSectionNode(
            SchemeKind.STRAIGHT_SETS,
            SCHEME_ID_STRAIGHT,
            [exerciseLineNode([mentionNode(EXERCISE_ID_A)])],
            { sortOrder: 0 },
          ),
          schemeSectionNode(
            SchemeKind.AMRAP,
            SCHEME_ID_STRAIGHT,
            [exerciseLineNode([mentionNode(EXERCISE_ID_B)])],
            { sortOrder: 1 },
          ),
        ]),
      ],
    };
    const result = parseTiptapDoc(doc, buildLookup(), parserOpts);

    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]?.sections).toHaveLength(2);
    expect(result.blocks[0]?.sections[0]?.schemeKind).toBe(SchemeKind.STRAIGHT_SETS);
    expect(result.blocks[0]?.sections[0]?.exercises[0]?.exerciseId).toBe(EXERCISE_ID_A);
    expect(result.blocks[0]?.sections[1]?.schemeKind).toBe(SchemeKind.AMRAP);
    expect(result.blocks[0]?.sections[1]?.exercises[0]?.exerciseId).toBe(EXERCISE_ID_B);
  });

  it("parses an EMOM section with two slots and produces zero section-level exercises", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [
        blockNode(BLOCK_TYPE_ID, [
          schemeSectionNode(SchemeKind.EMOM, SCHEME_ID_EMOM, [
            {
              type: "emomSlot",
              attrs: { minuteInRound: 0, sortOrder: 0 },
              content: [mentionNode(EXERCISE_ID_A), mentionNode(EXERCISE_ID_B)],
            },
            {
              type: "emomSlot",
              attrs: { minuteInRound: 1, sortOrder: 1 },
              content: [mentionNode(EXERCISE_ID_A)],
            },
          ]),
        ]),
      ],
    };
    const result = parseTiptapDoc(doc, buildLookup(), parserOpts);
    const section = result.blocks[0]?.sections[0];

    expect(section?.schemeKind).toBe(SchemeKind.EMOM);
    expect(section?.exercises).toHaveLength(0);
    expect(section?.emomSlots).toHaveLength(2);
    expect(section?.emomSlots[0]?.exercises).toHaveLength(2);
    expect(section?.emomSlots[1]?.exercises).toHaveLength(1);
  });

  it("parses a notesSection without exercises", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [blockNode(BLOCK_TYPE_ID, [notesSectionNode([{ type: "paragraph" }])])],
    };
    const result = parseTiptapDoc(doc, buildLookup(), parserOpts);
    const section = result.blocks[0]?.sections[0];

    expect(section?.kind).toBe(SchemeSectionKind.NOTES);
    expect(section?.exercises).toHaveLength(0);
    expect(section?.emomSlots).toHaveLength(0);
  });

  it("parses a textCalloutSection with tone", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [
        blockNode(BLOCK_TYPE_ID, [textCalloutSectionNode("info", [{ type: "paragraph" }])]),
      ],
    };
    const result = parseTiptapDoc(doc, buildLookup(), parserOpts);
    const section = result.blocks[0]?.sections[0];

    expect(section?.kind).toBe(SchemeSectionKind.TEXT_CALLOUT);
    expect(section?.tone).toBe("info");
  });
});

describe("parseTiptapDoc validation errors", () => {
  it("rejects an unknown root node type", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [{ type: "wrongName", attrs: { blockTypeId: BLOCK_TYPE_ID } }],
    };

    expect(() => parseTiptapDoc(doc, buildLookup(), parserOpts)).toThrow(BadRequestError);
  });

  it("rejects an unknown section node type inside a block", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [blockNode(BLOCK_TYPE_ID, [{ type: "noSuchSection", attrs: { sortOrder: 0 } }])],
    };

    expect(() => parseTiptapDoc(doc, buildLookup(), parserOpts)).toThrow(BadRequestError);
  });

  it("rejects bad block attrs (blockTypeId not a cuid)", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [
        {
          type: "block",
          attrs: { blockTypeId: "not-a-cuid", title: null, sortOrder: 0 },
          content: [],
        },
      ],
    };

    expect(() => parseTiptapDoc(doc, buildLookup(), parserOpts)).toThrow(BadRequestError);
  });

  it("rejects an unknown blockTypeId in lookup", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [blockNode("clmissing00000000000000000", [])],
    };

    expect(() => parseTiptapDoc(doc, buildLookup(), parserOpts)).toThrow(BadRequestError);
  });

  it("rejects an unknown schemeId in lookup", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [
        blockNode(BLOCK_TYPE_ID, [
          schemeSectionNode(SchemeKind.STRAIGHT_SETS, "clmissingscheme0000000000", [
            exerciseLineNode([mentionNode(EXERCISE_ID_A)]),
          ]),
        ]),
      ],
    };

    expect(() => parseTiptapDoc(doc, buildLookup(), parserOpts)).toThrow(BadRequestError);
  });

  it("rejects an unknown exerciseId in lookup", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [straightSetsBlock([mentionNode("unknown-ex")])],
    };

    expect(() => parseTiptapDoc(doc, buildLookup(), parserOpts)).toThrow(BadRequestError);
  });

  it("rejects a non-approved exercise not owned by the saving coach", () => {
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

  it("accepts a pending exercise created by the saving coach", () => {
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

    expect(result.blocks[0]?.sections[0]?.exercises).toHaveLength(1);
  });
});
