import { describe, expect, it } from "vitest";

import { type TiptapDoc, type TiptapNode } from "@repo/contracts/common/tiptap-doc";
import { SchemeKind } from "@repo/contracts/library/scheme";
import { WORKOUT_DOC_LIMITS } from "@repo/contracts/lms/workout-block";
import { BadRequestError } from "@repo/errors";

import { parseTiptapDoc } from "./parser";
import {
  BLOCK_TYPE_ID,
  EXERCISE_ID_A,
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
} from "./parser-fixtures";

describe("parseTiptapDoc strict mode empty guards", () => {
  it("rejects an empty block (no sections) under strict mode", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [blockNode(BLOCK_TYPE_ID, [])],
    };

    try {
      parseTiptapDoc(doc, buildLookup(), { ...parserOpts, strict: true });
      expect.fail("expected parseTiptapDoc to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestError);

      if (error instanceof BadRequestError) {
        expect(error.details?.code).toBe("workout.block.empty");
      }
    }
  });

  it("rejects an empty schemeSection (no exerciseLines) under strict mode", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [
        blockNode(BLOCK_TYPE_ID, [
          schemeSectionNode(SchemeKind.STRAIGHT_SETS, SCHEME_ID_STRAIGHT, []),
        ]),
      ],
    };

    try {
      parseTiptapDoc(doc, buildLookup(), { ...parserOpts, strict: true });
      expect.fail("expected parseTiptapDoc to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestError);

      if (error instanceof BadRequestError) {
        expect(error.details?.code).toBe("workout.section.empty");
      }
    }
  });

  it("rejects an empty EMOM slot (no mentions) under strict mode", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [
        blockNode(BLOCK_TYPE_ID, [
          schemeSectionNode(SchemeKind.EMOM, SCHEME_ID_EMOM, [
            { type: "emomSlot", attrs: { minuteInRound: 0, sortOrder: 0 }, content: [] },
          ]),
        ]),
      ],
    };

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

  it("tolerates empty doc/block/section/slot in default non-strict mode", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [
        blockNode(BLOCK_TYPE_ID, [
          schemeSectionNode(SchemeKind.STRAIGHT_SETS, SCHEME_ID_STRAIGHT, []),
          schemeSectionNode(SchemeKind.EMOM, SCHEME_ID_EMOM, [
            { type: "emomSlot", attrs: { minuteInRound: 0, sortOrder: 0 }, content: [] },
          ]),
        ]),
      ],
    };
    const result = parseTiptapDoc(doc, buildLookup(), parserOpts);

    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]?.sections).toHaveLength(2);
    expect(result.blocks[0]?.sections[0]?.exercises).toHaveLength(0);
    expect(result.blocks[0]?.sections[1]?.emomSlots[0]?.exercises).toHaveLength(0);
  });

  it("tolerates an empty exerciseLine (no mentions) in default non-strict mode", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [
        blockNode(BLOCK_TYPE_ID, [
          schemeSectionNode(SchemeKind.STRAIGHT_SETS, SCHEME_ID_STRAIGHT, [exerciseLineNode([])]),
        ]),
      ],
    };
    const result = parseTiptapDoc(doc, buildLookup(), parserOpts);

    expect(result.blocks[0]?.sections[0]?.exercises).toHaveLength(0);
  });
});

describe("parseTiptapDoc doc limits", () => {
  it("rejects a doc whose serialized byte size exceeds MAX_DOC_BYTES", () => {
    const hugeNote = "x".repeat(WORKOUT_DOC_LIMITS.MAX_DOC_BYTES + 1);
    const doc: TiptapDoc = {
      type: "doc",
      content: [
        blockNode(BLOCK_TYPE_ID, [notesSectionNode([{ type: "paragraph", text: hugeNote }])]),
      ],
    };

    try {
      parseTiptapDoc(doc, buildLookup(), parserOpts);
      expect.fail("expected parseTiptapDoc to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestError);

      if (error instanceof BadRequestError) {
        expect(error.details?.code).toBe("workout.doc.too_large");
        expect(error.details?.limit).toBe(WORKOUT_DOC_LIMITS.MAX_DOC_BYTES);
      }
    }
  });

  it("rejects a doc whose recursive node count exceeds MAX_NODES_PER_DOC", () => {
    const paragraphs: TiptapNode[] = Array.from(
      { length: WORKOUT_DOC_LIMITS.MAX_NODES_PER_DOC + 1 },
      () => ({ type: "paragraph" }),
    );
    const doc: TiptapDoc = {
      type: "doc",
      content: [blockNode(BLOCK_TYPE_ID, [notesSectionNode(paragraphs)])],
    };

    try {
      parseTiptapDoc(doc, buildLookup(), parserOpts);
      expect.fail("expected parseTiptapDoc to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestError);

      if (error instanceof BadRequestError) {
        expect(error.details?.code).toBe("workout.doc.too_many_nodes");
      }
    }
  });

  it("rejects a doc whose root block count exceeds MAX_ROOT_BLOCKS", () => {
    const blocks: TiptapNode[] = Array.from(
      { length: WORKOUT_DOC_LIMITS.MAX_ROOT_BLOCKS + 1 },
      () => blockNode(BLOCK_TYPE_ID, []),
    );
    const doc: TiptapDoc = { type: "doc", content: blocks };

    try {
      parseTiptapDoc(doc, buildLookup(), parserOpts);
      expect.fail("expected parseTiptapDoc to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestError);

      if (error instanceof BadRequestError) {
        expect(error.details?.code).toBe("workout.doc.too_many_root_blocks");
      }
    }
  });

  it("accepts a small valid doc well below all limits", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [straightSetsBlock([mentionNode(EXERCISE_ID_A)])],
    };
    const result = parseTiptapDoc(doc, buildLookup(), parserOpts);

    expect(result.blocks).toHaveLength(1);
  });
});
