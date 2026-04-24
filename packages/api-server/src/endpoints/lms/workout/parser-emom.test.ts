import { describe, expect, it } from "vitest";

import { type TiptapDoc, type TiptapNode } from "@repo/contracts/common/tiptap-doc";
import { BadRequestError } from "@repo/errors";

import { parseTiptapDoc } from "./parser";
import {
  BLOCK_TYPE_ID,
  EXERCISE_ID_A,
  EXERCISE_ID_B,
  SCHEME_ID_EMOM,
  buildLookup,
  mentionNode,
  parserOpts,
  straightSetsBlock,
} from "./parser-fixtures";

const buildEmomDoc = (slots: TiptapNode[]): TiptapDoc => ({
  type: "doc",
  content: [
    {
      type: "emom",
      attrs: { blockTypeId: BLOCK_TYPE_ID, schemeId: SCHEME_ID_EMOM, schemeConfig: {} },
      content: slots,
    },
  ],
});

describe("parseTiptapDoc EMOM", () => {
  it("maps one slot with two mentions to two slotExercises on the slot", () => {
    const doc = buildEmomDoc([
      {
        type: "emomSlot",
        attrs: { minuteInRound: 0 },
        content: [mentionNode(EXERCISE_ID_A), mentionNode(EXERCISE_ID_B)],
      },
    ]);

    const result = parseTiptapDoc(doc, buildLookup(), parserOpts);

    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]?.emomSlots).toHaveLength(1);
    expect(result.blocks[0]?.emomSlots[0]?.exercises).toHaveLength(2);
    expect(result.blocks[0]?.emomSlots[0]?.exercises[0]?.exerciseId).toBe(EXERCISE_ID_A);
    expect(result.blocks[0]?.emomSlots[0]?.exercises[1]?.exerciseId).toBe(EXERCISE_ID_B);
    expect(result.blocks[0]?.exercises).toHaveLength(0);
  });

  it("maps multiple slots with correct minuteInRound and sortOrder", () => {
    const doc = buildEmomDoc([
      {
        type: "emomSlot",
        attrs: { minuteInRound: 0 },
        content: [mentionNode(EXERCISE_ID_A)],
      },
      {
        type: "emomSlot",
        attrs: { minuteInRound: 1 },
        content: [mentionNode(EXERCISE_ID_B)],
      },
    ]);

    const result = parseTiptapDoc(doc, buildLookup(), parserOpts);

    expect(result.blocks[0]?.emomSlots).toHaveLength(2);
    expect(result.blocks[0]?.emomSlots[0]?.minuteInRound).toBe(0);
    expect(result.blocks[0]?.emomSlots[0]?.sortOrder).toBe(0);
    expect(result.blocks[0]?.emomSlots[1]?.minuteInRound).toBe(1);
    expect(result.blocks[0]?.emomSlots[1]?.sortOrder).toBe(1);
  });

  it("rejects an EMOM node that contains non-slot child", () => {
    const doc = buildEmomDoc([mentionNode(EXERCISE_ID_A)]);

    expect(() => parseTiptapDoc(doc, buildLookup(), parserOpts)).toThrow(BadRequestError);
  });

  it("rejects an emomSlot with zero exercise mentions", () => {
    const doc = buildEmomDoc([
      {
        type: "emomSlot",
        attrs: { minuteInRound: 0 },
        content: [{ type: "paragraph" }],
      },
    ]);

    try {
      parseTiptapDoc(doc, buildLookup(), parserOpts);
      expect.fail("expected parseTiptapDoc to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestError);

      if (error instanceof BadRequestError) {
        expect(error.details?.code).toBe("workout.emomSlot.empty");
      }
    }
  });

  it("rejects an emom block with zero slots", () => {
    const doc = buildEmomDoc([]);

    try {
      parseTiptapDoc(doc, buildLookup(), parserOpts);
      expect.fail("expected parseTiptapDoc to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestError);

      if (error instanceof BadRequestError) {
        expect(error.details?.code).toBe("workout.emom.empty");
      }
    }
  });
});

describe("parseTiptapDoc complex grouping", () => {
  it("carries the same complexGroup string across two mentions", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [
        straightSetsBlock([
          mentionNode(EXERCISE_ID_A, { complexGroup: "A", complexOrder: 0 }),
          mentionNode(EXERCISE_ID_B, { complexGroup: "A", complexOrder: 1 }),
        ]),
      ],
    };

    const result = parseTiptapDoc(doc, buildLookup(), parserOpts);
    const exercises = result.blocks[0]?.exercises ?? [];

    expect(exercises).toHaveLength(2);
    expect(exercises[0]?.complexGroup).toBe("A");
    expect(exercises[0]?.complexOrder).toBe(0);
    expect(exercises[1]?.complexGroup).toBe("A");
    expect(exercises[1]?.complexOrder).toBe(1);
  });
});

describe("parseTiptapDoc schemeless blocks", () => {
  it("parses notes block with note attribute", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [
        {
          type: "notes",
          attrs: { blockTypeId: BLOCK_TYPE_ID, note: "Good luck" },
        },
      ],
    };

    const result = parseTiptapDoc(doc, buildLookup(), parserOpts);

    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]?.note).toBe("Good luck");
    expect(result.blocks[0]?.schemeKind).toBeNull();
    expect(result.blocks[0]?.blockTypeId).toBe(BLOCK_TYPE_ID);
  });

  it("parses textCallout block", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [
        {
          type: "textCallout",
          attrs: { blockTypeId: BLOCK_TYPE_ID, note: "Warning" },
        },
      ],
    };

    const result = parseTiptapDoc(doc, buildLookup(), parserOpts);

    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]?.note).toBe("Warning");
    expect(result.blocks[0]?.schemeKind).toBeNull();
    expect(result.blocks[0]?.blockTypeId).toBe(BLOCK_TYPE_ID);
  });
});

describe("parseTiptapDoc sortOrder normalization", () => {
  it("normalizes sortOrder within a block based on document order", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [
        straightSetsBlock([
          mentionNode(EXERCISE_ID_A, { sortOrder: 99 }),
          mentionNode(EXERCISE_ID_B, { sortOrder: 3 }),
        ]),
      ],
    };

    const result = parseTiptapDoc(doc, buildLookup(), parserOpts);
    const exercises = result.blocks[0]?.exercises ?? [];

    expect(exercises[0]?.sortOrder).toBe(0);
    expect(exercises[1]?.sortOrder).toBe(1);
  });
});
