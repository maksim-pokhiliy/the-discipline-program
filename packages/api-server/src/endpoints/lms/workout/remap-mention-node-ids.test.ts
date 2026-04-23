import { describe, expect, it } from "vitest";

import { type TiptapDoc } from "@repo/contracts/common/tiptap-doc";

import { remapMentionNodeIds } from "./clone";

describe("remapMentionNodeIds", () => {
  it("returns a new doc with empty content when source content is empty", () => {
    const doc: TiptapDoc = { type: "doc", content: [] };
    const result = remapMentionNodeIds(doc, new Map(), new Map());

    expect(result).toEqual({ type: "doc", content: [] });
    expect(result).not.toBe(doc);
  });

  it("remaps blockId inside exerciseMention attrs", () => {
    const blockIdMap = new Map([["old-block", "new-block"]]);
    const slotIdMap = new Map<string, string>();

    const doc: TiptapDoc = {
      type: "doc",
      content: [
        {
          type: "straightSets",
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

    const result = remapMentionNodeIds(doc, blockIdMap, slotIdMap);
    const firstBlock = result.content[0];

    expect(firstBlock?.attrs?.blockId).toBe("new-block");
    expect(firstBlock?.content?.[0]?.attrs?.blockId).toBe("new-block");
    expect(firstBlock?.content?.[0]?.attrs?.exerciseId).toBe("ex-1");
  });

  it("remaps emomSlotId on mention within an EMOM slot", () => {
    const blockIdMap = new Map<string, string>();
    const slotIdMap = new Map([["old-slot", "new-slot"]]);

    const doc: TiptapDoc = {
      type: "doc",
      content: [
        {
          type: "emom",
          attrs: { sortOrder: 0 },
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
    };

    const result = remapMentionNodeIds(doc, blockIdMap, slotIdMap);
    const slot = result.content[0]?.content?.[0];

    expect(slot?.attrs?.emomSlotId).toBe("new-slot");
    expect(slot?.content?.[0]?.attrs?.emomSlotId).toBe("new-slot");
  });

  it("leaves unknown blockId values untouched (not in the map)", () => {
    const blockIdMap = new Map([["other-block", "mapped"]]);
    const slotIdMap = new Map<string, string>();

    const doc: TiptapDoc = {
      type: "doc",
      content: [
        {
          type: "straightSets",
          attrs: { blockId: "still-old" },
        },
      ],
    };

    const result = remapMentionNodeIds(doc, blockIdMap, slotIdMap);

    expect(result.content[0]?.attrs?.blockId).toBe("still-old");
  });

  it("preserves exerciseMention exerciseId attribute across remap", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [
        {
          type: "straightSets",
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

    const result = remapMentionNodeIds(doc, new Map([["old-block", "new-block"]]), new Map());

    expect(result.content[0]?.content?.[0]?.attrs?.exerciseId).toBe("ex-42");
  });
});
