import { describe, expect, it } from "vitest";

import { type TiptapDoc } from "@repo/contracts/common/tiptap-doc";

import { remapMentionNodeIds } from "./clone";

describe("remapMentionNodeIds", () => {
  it("returns a new doc with empty content when source content is empty", () => {
    const doc: TiptapDoc = { type: "doc", content: [] };
    const result = remapMentionNodeIds(doc, new Map(), new Map(), new Map());

    expect(result).toEqual({ type: "doc", content: [] });
    expect(result).not.toBe(doc);
  });

  it("remaps blockId attr when present in blockIdMap", () => {
    const blockIdMap = new Map([["old-block", "new-block"]]);

    const doc: TiptapDoc = {
      type: "doc",
      content: [
        {
          type: "block",
          attrs: { blockId: "old-block", sortOrder: 0 },
          content: [
            {
              type: "exerciseMention",
              attrs: { exerciseId: "ex-1", blockId: "old-block" },
            },
          ],
        },
      ],
    };

    const result = remapMentionNodeIds(doc, blockIdMap, new Map(), new Map());
    const firstBlock = result.content[0];

    expect(firstBlock?.attrs?.blockId).toBe("new-block");
    expect(firstBlock?.content?.[0]?.attrs?.blockId).toBe("new-block");
    expect(firstBlock?.content?.[0]?.attrs?.exerciseId).toBe("ex-1");
  });

  it("remaps sectionId attr when present in sectionIdMap", () => {
    const sectionIdMap = new Map([["old-section", "new-section"]]);

    const doc: TiptapDoc = {
      type: "doc",
      content: [
        {
          type: "block",
          attrs: { sortOrder: 0 },
          content: [
            {
              type: "schemeSection",
              attrs: { sectionId: "old-section", sortOrder: 0 },
              content: [
                {
                  type: "exerciseLine",
                  attrs: { sortOrder: 0 },
                  content: [
                    {
                      type: "exerciseMention",
                      attrs: { exerciseId: "ex-1", sectionId: "old-section" },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const result = remapMentionNodeIds(doc, new Map(), sectionIdMap, new Map());
    const section = result.content[0]?.content?.[0];
    const mention = section?.content?.[0]?.content?.[0];

    expect(section?.attrs?.sectionId).toBe("new-section");
    expect(mention?.attrs?.sectionId).toBe("new-section");
  });

  it("remaps emomSlotId on mention within an EMOM slot", () => {
    const slotIdMap = new Map([["old-slot", "new-slot"]]);

    const doc: TiptapDoc = {
      type: "doc",
      content: [
        {
          type: "block",
          attrs: { sortOrder: 0 },
          content: [
            {
              type: "schemeSection",
              attrs: { schemeKind: "EMOM", sortOrder: 0 },
              content: [
                {
                  type: "emomSlot",
                  attrs: { emomSlotId: "old-slot", minuteInRound: 0, sortOrder: 0 },
                  content: [
                    {
                      type: "exerciseMention",
                      attrs: { exerciseId: "ex-1", emomSlotId: "old-slot" },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const result = remapMentionNodeIds(doc, new Map(), new Map(), slotIdMap);
    const slot = result.content[0]?.content?.[0]?.content?.[0];

    expect(slot?.attrs?.emomSlotId).toBe("new-slot");
    expect(slot?.content?.[0]?.attrs?.emomSlotId).toBe("new-slot");
  });

  it("leaves attr values untouched when the id is not in the map", () => {
    const blockIdMap = new Map([["other-block", "mapped"]]);

    const doc: TiptapDoc = {
      type: "doc",
      content: [{ type: "block", attrs: { blockId: "still-old" } }],
    };

    const result = remapMentionNodeIds(doc, blockIdMap, new Map(), new Map());

    expect(result.content[0]?.attrs?.blockId).toBe("still-old");
  });

  it("preserves exerciseMention exerciseId attribute across remap", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [
        {
          type: "block",
          attrs: { blockId: "old-block" },
          content: [
            {
              type: "exerciseMention",
              attrs: { exerciseId: "ex-42", blockId: "old-block" },
            },
          ],
        },
      ],
    };

    const result = remapMentionNodeIds(
      doc,
      new Map([["old-block", "new-block"]]),
      new Map(),
      new Map(),
    );

    expect(result.content[0]?.content?.[0]?.attrs?.exerciseId).toBe("ex-42");
  });

  it("is idempotent: a second pass on the already-remapped doc with empty maps is a no-op", () => {
    const blockIdMap = new Map([["old-block", "new-block"]]);
    const sectionIdMap = new Map([["old-section", "new-section"]]);
    const slotIdMap = new Map([["old-slot", "new-slot"]]);

    const doc: TiptapDoc = {
      type: "doc",
      content: [
        {
          type: "block",
          attrs: { blockId: "old-block" },
          content: [
            {
              type: "schemeSection",
              attrs: { sectionId: "old-section", schemeKind: "EMOM" },
              content: [
                {
                  type: "emomSlot",
                  attrs: { emomSlotId: "old-slot", minuteInRound: 0 },
                  content: [
                    {
                      type: "exerciseMention",
                      attrs: {
                        exerciseId: "ex-1",
                        blockId: "old-block",
                        sectionId: "old-section",
                        emomSlotId: "old-slot",
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

    const once = remapMentionNodeIds(doc, blockIdMap, sectionIdMap, slotIdMap);
    const twice = remapMentionNodeIds(once, new Map(), new Map(), new Map());

    expect(twice).toEqual(once);
  });
});
