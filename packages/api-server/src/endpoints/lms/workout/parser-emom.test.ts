import { describe, expect, it } from "vitest";

import { type TiptapDoc, type TiptapNode } from "@repo/contracts/common/tiptap-doc";
import { SchemeKind } from "@repo/contracts/library/scheme";
import { BadRequestError } from "@repo/errors";

import { parseTiptapDoc } from "./parser";
import {
  BLOCK_TYPE_ID,
  EXERCISE_ID_A,
  EXERCISE_ID_B,
  SCHEME_ID_EMOM,
  blockNode,
  buildLookup,
  mentionNode,
  parserOpts,
  schemeSectionNode,
  straightSetsBlock,
} from "./parser-fixtures";

const buildEmomDoc = (slots: TiptapNode[]): TiptapDoc => ({
  type: "doc",
  content: [blockNode(BLOCK_TYPE_ID, [schemeSectionNode(SchemeKind.EMOM, SCHEME_ID_EMOM, slots)])],
});

describe("parseTiptapDoc EMOM section structure", () => {
  it("maps one slot with two mentions to two slot exercises and zero section exercises", () => {
    const doc = buildEmomDoc([
      {
        type: "emomSlot",
        attrs: { minuteInRound: 0, sortOrder: 0 },
        content: [mentionNode(EXERCISE_ID_A), mentionNode(EXERCISE_ID_B)],
      },
    ]);

    const result = parseTiptapDoc(doc, buildLookup(), parserOpts);
    const section = result.blocks[0]?.sections[0];

    expect(section?.emomSlots).toHaveLength(1);
    expect(section?.emomSlots[0]?.exercises).toHaveLength(2);
    expect(section?.emomSlots[0]?.exercises[0]?.exerciseId).toBe(EXERCISE_ID_A);
    expect(section?.emomSlots[0]?.exercises[1]?.exerciseId).toBe(EXERCISE_ID_B);
    expect(section?.exercises).toHaveLength(0);
  });

  it("maps multiple slots with correct minuteInRound and sortOrder", () => {
    const doc = buildEmomDoc([
      {
        type: "emomSlot",
        attrs: { minuteInRound: 0, sortOrder: 0 },
        content: [mentionNode(EXERCISE_ID_A)],
      },
      {
        type: "emomSlot",
        attrs: { minuteInRound: 1, sortOrder: 1 },
        content: [mentionNode(EXERCISE_ID_B)],
      },
    ]);

    const result = parseTiptapDoc(doc, buildLookup(), parserOpts);
    const section = result.blocks[0]?.sections[0];

    expect(section?.emomSlots).toHaveLength(2);
    expect(section?.emomSlots[0]?.minuteInRound).toBe(0);
    expect(section?.emomSlots[0]?.sortOrder).toBe(0);
    expect(section?.emomSlots[1]?.minuteInRound).toBe(1);
    expect(section?.emomSlots[1]?.sortOrder).toBe(1);
  });

  it("rejects an EMOM section that contains a non-slot child", () => {
    const doc = buildEmomDoc([mentionNode(EXERCISE_ID_A)]);

    expect(() => parseTiptapDoc(doc, buildLookup(), parserOpts)).toThrow(BadRequestError);
  });

  it("rejects an emomSlot with zero exercise mentions in strict mode", () => {
    const doc = buildEmomDoc([
      {
        type: "emomSlot",
        attrs: { minuteInRound: 0, sortOrder: 0 },
        content: [],
      },
    ]);

    try {
      parseTiptapDoc(doc, buildLookup(), { ...parserOpts, strict: true });
      expect.fail("expected parseTiptapDoc to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestError);

      if (error instanceof BadRequestError) {
        expect(error.details?.code).toBe("workout.emomSlot.empty");
      }
    }
  });

  it("accepts an emomSlot with zero exercise mentions when strict is not set", () => {
    const doc = buildEmomDoc([
      {
        type: "emomSlot",
        attrs: { minuteInRound: 0, sortOrder: 0 },
        content: [],
      },
    ]);

    const result = parseTiptapDoc(doc, buildLookup(), parserOpts);

    expect(result.blocks[0]?.sections[0]?.emomSlots).toHaveLength(1);
    expect(result.blocks[0]?.sections[0]?.emomSlots[0]?.exercises).toHaveLength(0);
  });

  it("rejects an EMOM section with zero slots in strict mode", () => {
    const doc = buildEmomDoc([]);

    try {
      parseTiptapDoc(doc, buildLookup(), { ...parserOpts, strict: true });
      expect.fail("expected parseTiptapDoc to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestError);

      if (error instanceof BadRequestError) {
        expect(error.details?.code).toBe("workout.section.emom.empty");
      }
    }
  });

  it("accepts an EMOM section with zero slots when strict is not set", () => {
    const doc = buildEmomDoc([]);

    const result = parseTiptapDoc(doc, buildLookup(), parserOpts);

    expect(result.blocks[0]?.sections[0]?.emomSlots).toHaveLength(0);
  });
});

describe("parseTiptapDoc complex grouping in scheme section", () => {
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
    const exercises = result.blocks[0]?.sections[0]?.exercises ?? [];

    expect(exercises).toHaveLength(2);
    expect(exercises[0]?.complexGroup).toBe("A");
    expect(exercises[0]?.complexOrder).toBe(0);
    expect(exercises[1]?.complexGroup).toBe("A");
    expect(exercises[1]?.complexOrder).toBe(1);
  });
});

describe("parseTiptapDoc sortOrder normalization", () => {
  it("normalizes exercise sortOrder within a section based on document order", () => {
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
    const exercises = result.blocks[0]?.sections[0]?.exercises ?? [];

    expect(exercises[0]?.sortOrder).toBe(0);
    expect(exercises[1]?.sortOrder).toBe(1);
  });
});
