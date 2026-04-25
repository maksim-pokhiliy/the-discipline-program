import { describe, expect, it } from "vitest";

import { WORKOUT_DOC_LIMITS } from "../entities/lms/workout-block/workout-block.constants";

import { BLOCK_WRAPPER_NODE_TYPE, tiptapDocSchema } from "./tiptap-doc";

const exampleDoc = {
  type: "doc",
  content: [
    {
      type: "block",
      attrs: { blockTypeId: "<warmup-id>", title: null, sortOrder: 0 },
      content: [
        {
          type: "schemeSection",
          attrs: {
            schemeId: "<emom-scheme-id>",
            schemeKind: "EMOM",
            schemeConfig: { interval: 60, rounds: 10 },
            effortPct: null,
            pace: null,
            note: null,
            sortOrder: 0,
          },
          content: [
            {
              type: "exerciseLine",
              content: [
                {
                  type: "exerciseMention",
                  attrs: {
                    exerciseId: "<air-squat-id>",
                    canonicalName: "Air Squat",
                    repScheme: "STRAIGHT",
                    repValues: [15],
                    sets: null,
                    prescription: null,
                    restSec: null,
                    note: null,
                    complexGroup: null,
                    complexOrder: null,
                    sortOrder: 0,
                    emomSlotId: "<client-nonce>",
                  },
                },
              ],
            },
          ],
        },
        {
          type: "schemeSection",
          attrs: {
            schemeId: "<straight-sets-scheme-id>",
            schemeKind: "STRAIGHT_SETS",
            schemeConfig: {},
            effortPct: null,
            pace: null,
            note: null,
            sortOrder: 1,
          },
          content: [
            {
              type: "exerciseLine",
              content: [
                { type: "text", text: "3x10 " },
                {
                  type: "exerciseMention",
                  attrs: {
                    exerciseId: "<push-up-id>",
                    canonicalName: "Push-up",
                    repScheme: "STRAIGHT",
                    repValues: [10, 10, 10],
                    sets: 3,
                    prescription: null,
                    restSec: 60,
                    note: null,
                    complexGroup: null,
                    complexOrder: null,
                    sortOrder: 0,
                    emomSlotId: null,
                  },
                },
              ],
            },
          ],
        },
        {
          type: "notesSection",
          attrs: { note: "keep RPE low", sortOrder: 2 },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Warmup is easy — RPE 5-6 max." }],
            },
          ],
        },
      ],
    },
    {
      type: "block",
      attrs: { blockTypeId: "<strength-id>", title: null, sortOrder: 1 },
      content: [
        {
          type: "schemeSection",
          attrs: {
            schemeId: "<intervals-scheme-id>",
            schemeKind: "INTERVALS",
            schemeConfig: { work: 40, rest: 20, rounds: 6 },
            effortPct: 80,
            pace: null,
            note: null,
            sortOrder: 0,
          },
          content: [
            {
              type: "exerciseLine",
              content: [
                {
                  type: "exerciseMention",
                  attrs: {
                    exerciseId: "<front-squat-id>",
                    canonicalName: "Front Squat",
                    repScheme: "STRAIGHT",
                    repValues: [],
                    sets: null,
                    prescription: null,
                    restSec: null,
                    note: null,
                    complexGroup: null,
                    complexOrder: null,
                    sortOrder: 0,
                    emomSlotId: null,
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

describe("tiptapDocSchema", () => {
  it("accepts the feature request example doc with two block wrappers and nested sections", () => {
    const result = tiptapDocSchema.safeParse(exampleDoc);

    expect(result.success).toBe(true);
  });

  it("accepts an empty doc (draft tolerance)", () => {
    const result = tiptapDocSchema.safeParse({ type: "doc", content: [] });

    expect(result.success).toBe(true);
  });

  it("accepts a doc with a single block wrapper containing no sections", () => {
    const result = tiptapDocSchema.safeParse({
      type: "doc",
      content: [
        {
          type: BLOCK_WRAPPER_NODE_TYPE,
          attrs: { blockTypeId: "<id>", title: null, sortOrder: 0 },
        },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe("tiptapDocSchema rejection cases", () => {
  it("rejects a legacy doc with a section node at the root", () => {
    const legacyDoc = {
      type: "doc",
      content: [
        {
          type: "straightSets",
          attrs: {
            schemeId: "<scheme-id>",
            schemeKind: "STRAIGHT_SETS",
            schemeConfig: {},
            sortOrder: 0,
          },
        },
      ],
    };
    const result = tiptapDocSchema.safeParse(legacyDoc);

    expect(result.success).toBe(false);

    if (!result.success) {
      const refineIssue = result.error.issues.find(
        (i) => i.message === "Doc root accepts only block wrapper nodes",
      );

      expect(refineIssue).toBeDefined();
      expect(refineIssue?.path).toEqual(["content"]);
    }
  });

  it("rejects a doc with a paragraph node at the root", () => {
    const result = tiptapDocSchema.safeParse({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "stray text" }],
        },
      ],
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const refineIssue = result.error.issues.find(
        (i) => i.message === "Doc root accepts only block wrapper nodes",
      );

      expect(refineIssue).toBeDefined();
    }
  });

  it("rejects a doc with type other than 'doc'", () => {
    const result = tiptapDocSchema.safeParse({ type: "fragment", content: [] });

    expect(result.success).toBe(false);
  });

  it("rejects a doc missing the type field", () => {
    const result = tiptapDocSchema.safeParse({ content: [] });

    expect(result.success).toBe(false);
  });

  it("rejects a doc missing the content field", () => {
    const result = tiptapDocSchema.safeParse({ type: "doc" });

    expect(result.success).toBe(false);
  });

  it(`rejects a doc with more than ${WORKOUT_DOC_LIMITS.MAX_ROOT_BLOCKS} root blocks`, () => {
    const tooManyBlocks = Array.from(
      { length: WORKOUT_DOC_LIMITS.MAX_ROOT_BLOCKS + 1 },
      (_, i) => ({
        type: BLOCK_WRAPPER_NODE_TYPE,
        attrs: { blockTypeId: "<id>", title: null, sortOrder: i },
      }),
    );
    const result = tiptapDocSchema.safeParse({ type: "doc", content: tooManyBlocks });

    expect(result.success).toBe(false);

    if (!result.success) {
      const tooBigIssue = result.error.issues.find((i) => i.code === "too_big");

      expect(tooBigIssue).toBeDefined();
      expect(tooBigIssue?.path).toEqual(["content"]);
    }
  });

  it(`accepts a doc at exactly ${WORKOUT_DOC_LIMITS.MAX_ROOT_BLOCKS} root blocks`, () => {
    const exactlyMaxBlocks = Array.from({ length: WORKOUT_DOC_LIMITS.MAX_ROOT_BLOCKS }, (_, i) => ({
      type: BLOCK_WRAPPER_NODE_TYPE,
      attrs: { blockTypeId: "<id>", title: null, sortOrder: i },
    }));
    const result = tiptapDocSchema.safeParse({ type: "doc", content: exactlyMaxBlocks });

    expect(result.success).toBe(true);
  });
});
