import { Editor, getSchema } from "@tiptap/core";
import { afterEach, describe, expect, it } from "vitest";

import { coreWorkoutExtensions } from "../registered-nodes";

const schema = getSchema(coreWorkoutExtensions);

describe("workout-editor block node schemas", () => {
  describe("doc root", () => {
    it("accepts a block-kind child", () => {
      const node = schema.nodeFromJSON({
        type: "doc",
        content: [
          {
            type: "straightSets",
            attrs: {
              blockTypeId: "bt-1",
              schemeId: null,
              schemeKind: null,
              schemeConfig: {},
              effortPct: null,
              pace: null,
              note: null,
              sortOrder: 0,
            },
          },
        ],
      });

      expect(node.check.bind(node)).not.toThrow();
    });

    it("refuses an inline-only doc (paragraph at root)", () => {
      const doc = schema.nodeFromJSON({
        type: "doc",
        content: [{ type: "paragraph" }],
      });

      expect(() => doc.check()).toThrow();
    });
  });

  describe.each([
    "straightSets",
    "forTime",
    "amrap",
    "everyXMin",
    "intervals",
    "timeBlocks",
  ] as const)("%s scheme block", (blockName) => {
    it("accepts an empty block (no exerciseMention children)", () => {
      const node = schema.nodes[blockName];

      expect(node).toBeDefined();

      if (!node) {
        return;
      }

      const created = node.create({
        blockTypeId: "bt-1",
        schemeId: null,
        schemeKind: null,
        schemeConfig: {},
        effortPct: null,
        pace: null,
        note: null,
        sortOrder: 0,
      });

      expect(created.type.name).toBe(blockName);
      expect(created.childCount).toBe(0);
    });

    it("accepts one or more exerciseMention children", () => {
      const node = schema.nodes[blockName];

      if (!node) {
        return;
      }

      const mentionType = schema.nodes["exerciseMention"];

      if (!mentionType) {
        return;
      }

      const mention = mentionType.create({
        exerciseId: "ex-1",
        canonicalName: "Squat",
        repScheme: null,
        repValues: [],
        sets: null,
        prescription: null,
        restSec: null,
        note: null,
        complexGroup: null,
        complexOrder: null,
        sortOrder: 0,
        emomSlotId: null,
      });

      const created = node.create(
        {
          blockTypeId: "bt-1",
          schemeId: null,
          schemeKind: null,
          schemeConfig: {},
          effortPct: null,
          pace: null,
          note: null,
          sortOrder: 0,
        },
        mention,
      );

      expect(created.childCount).toBe(1);
    });
  });

  describe("emom block", () => {
    it("requires at least one emomSlot child", () => {
      const emomType = schema.nodes["emom"];

      expect(emomType).toBeDefined();

      if (!emomType) {
        return;
      }

      expect(() =>
        emomType.createChecked(
          {
            blockTypeId: "bt-1",
            schemeId: null,
            schemeKind: null,
            schemeConfig: {},
            effortPct: null,
            pace: null,
            note: null,
            sortOrder: 0,
          },
          null,
        ),
      ).toThrow();
    });

    it("accepts an emom with one empty slot", () => {
      const emomType = schema.nodes["emom"];
      const slotType = schema.nodes["emomSlot"];

      if (!emomType || !slotType) {
        return;
      }

      const slot = slotType.create({ minuteInRound: 0, note: null, sortOrder: 0 });

      const emom = emomType.create(
        {
          blockTypeId: "bt-1",
          schemeId: null,
          schemeKind: null,
          schemeConfig: {},
          effortPct: null,
          pace: null,
          note: null,
          sortOrder: 0,
        },
        slot,
      );

      expect(emom.childCount).toBe(1);
      expect(emom.firstChild?.type.name).toBe("emomSlot");
    });
  });

  describe("emomSlot", () => {
    it("accepts an empty slot (no mentions)", () => {
      const slotType = schema.nodes["emomSlot"];

      expect(slotType).toBeDefined();

      if (!slotType) {
        return;
      }

      const slot = slotType.create({ minuteInRound: 0, note: null, sortOrder: 0 });

      expect(slot.childCount).toBe(0);
    });
  });

  describe("schemeless blockTypeId round-trip", () => {
    let editor: Editor | null = null;

    afterEach(() => {
      editor?.destroy();
      editor = null;
    });

    it("preserves blockTypeId on notes nodes through insert and getJSON", () => {
      const element = document.createElement("div");

      document.body.appendChild(element);

      editor = new Editor({
        element,
        extensions: coreWorkoutExtensions,
        content: undefined,
      });

      editor
        .chain()
        .insertContent({
          type: "notes",
          attrs: { blockTypeId: "test-block-type-id", note: null, sortOrder: 0 },
          content: [{ type: "paragraph" }],
        })
        .run();

      const json = editor.getJSON();
      const notesNode = json.content?.find((node) => node.type === "notes");

      expect(notesNode).toBeDefined();
      expect(notesNode?.attrs?.blockTypeId).toBe("test-block-type-id");
    });

    it("preserves blockTypeId on textCallout nodes through insert and getJSON", () => {
      const element = document.createElement("div");

      document.body.appendChild(element);

      editor = new Editor({
        element,
        extensions: coreWorkoutExtensions,
        content: undefined,
      });

      editor
        .chain()
        .insertContent({
          type: "textCallout",
          attrs: {
            blockTypeId: "test-block-type-id",
            tone: "info",
            note: null,
            sortOrder: 0,
          },
          content: [{ type: "paragraph" }],
        })
        .run();

      const json = editor.getJSON();
      const calloutNode = json.content?.find((node) => node.type === "textCallout");

      expect(calloutNode).toBeDefined();
      expect(calloutNode?.attrs?.blockTypeId).toBe("test-block-type-id");
      expect(calloutNode?.attrs?.tone).toBe("info");
    });
  });
});
