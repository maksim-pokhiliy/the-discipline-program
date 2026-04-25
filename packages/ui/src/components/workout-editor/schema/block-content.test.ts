import { Editor, getSchema } from "@tiptap/core";
import { describe, expect, it } from "vitest";

import { coreWorkoutExtensions } from "../registered-nodes";

const schema = getSchema(coreWorkoutExtensions);

describe("workout-editor block node schemas", () => {
  describe("doc root", () => {
    it("accepts an empty doc with no children", () => {
      const node = schema.nodeFromJSON({ type: "doc", content: [] });

      expect(node.check.bind(node)).not.toThrow();
    });

    it("accepts a single block at the root", () => {
      const node = schema.nodeFromJSON({
        type: "doc",
        content: [
          {
            type: "block",
            attrs: { blockTypeId: "bt-1", title: null, sortOrder: 0 },
          },
        ],
      });

      expect(node.check.bind(node)).not.toThrow();
    });

    it("rejects a paragraph at the root", () => {
      const doc = schema.nodeFromJSON({
        type: "doc",
        content: [{ type: "paragraph" }],
      });

      expect(() => doc.check()).toThrow();
    });

    it("rejects the legacy straightSets node at the root", () => {
      expect(() =>
        schema.nodeFromJSON({
          type: "doc",
          content: [{ type: "straightSets" }],
        }),
      ).toThrow();
    });

    it("renders an empty doc through a live editor without auto-filling a block", () => {
      const element = document.createElement("div");

      document.body.appendChild(element);

      const editor = new Editor({
        element,
        extensions: coreWorkoutExtensions,
        content: { type: "doc", content: [] },
      });

      try {
        const json = editor.getJSON();

        expect(json.type).toBe("doc");
        expect(json.content ?? []).toHaveLength(0);
      } finally {
        editor.destroy();
      }
    });
  });

  describe("block", () => {
    it("accepts an empty block (zero sections)", () => {
      const blockType = schema.nodes["block"];

      expect(blockType).toBeDefined();

      if (!blockType) {
        return;
      }

      const block = blockType.create({ blockTypeId: "bt-1", title: null, sortOrder: 0 });

      expect(block.childCount).toBe(0);
    });

    it("accepts schemeSection / notesSection / textCalloutSection as children", () => {
      const blockType = schema.nodes["block"];
      const schemeSection = schema.nodes["schemeSection"];
      const notesSection = schema.nodes["notesSection"];
      const textCalloutSection = schema.nodes["textCalloutSection"];
      const exerciseLine = schema.nodes["exerciseLine"];
      const paragraph = schema.nodes["paragraph"];

      if (
        !blockType ||
        !schemeSection ||
        !notesSection ||
        !textCalloutSection ||
        !exerciseLine ||
        !paragraph
      ) {
        return;
      }

      const scheme = schemeSection.create(
        {
          schemeId: null,
          schemeKind: null,
          schemeConfig: {},
          effortPct: null,
          pace: null,
          note: null,
          sortOrder: 0,
        },
        exerciseLine.create({ sortOrder: 0 }),
      );
      const notes = notesSection.create({ note: null, sortOrder: 1 }, paragraph.create());
      const callout = textCalloutSection.create(
        { tone: "info", note: null, sortOrder: 2 },
        paragraph.create(),
      );

      const block = blockType.create({ blockTypeId: "bt-1", title: null, sortOrder: 0 }, [
        scheme,
        notes,
        callout,
      ]);

      expect(block.childCount).toBe(3);
    });

    it("rejects a paragraph as a direct block child", () => {
      const blockType = schema.nodes["block"];
      const paragraph = schema.nodes["paragraph"];

      if (!blockType || !paragraph) {
        return;
      }

      expect(() =>
        blockType.createChecked(
          { blockTypeId: "bt-1", title: null, sortOrder: 0 },
          paragraph.create(),
        ),
      ).toThrow();
    });

    it("rejects an exerciseLine as a direct block child", () => {
      const blockType = schema.nodes["block"];
      const exerciseLine = schema.nodes["exerciseLine"];

      if (!blockType || !exerciseLine) {
        return;
      }

      expect(() =>
        blockType.createChecked(
          { blockTypeId: "bt-1", title: null, sortOrder: 0 },
          exerciseLine.create({ sortOrder: 0 }),
        ),
      ).toThrow();
    });
  });

  describe("schemeSection", () => {
    it("accepts an empty section", () => {
      const sectionType = schema.nodes["schemeSection"];

      if (!sectionType) {
        return;
      }

      const section = sectionType.create({
        schemeId: null,
        schemeKind: null,
        schemeConfig: {},
        effortPct: null,
        pace: null,
        note: null,
        sortOrder: 0,
      });

      expect(section.childCount).toBe(0);
    });

    it("accepts exerciseLine and emomSlot children", () => {
      const sectionType = schema.nodes["schemeSection"];
      const exerciseLine = schema.nodes["exerciseLine"];
      const emomSlot = schema.nodes["emomSlot"];

      if (!sectionType || !exerciseLine || !emomSlot) {
        return;
      }

      const section = sectionType.create(
        {
          schemeId: null,
          schemeKind: null,
          schemeConfig: {},
          effortPct: null,
          pace: null,
          note: null,
          sortOrder: 0,
        },
        [
          exerciseLine.create({ sortOrder: 0 }),
          emomSlot.create({ minuteInRound: 0, note: null, sortOrder: 0 }),
        ],
      );

      expect(section.childCount).toBe(2);
    });

    it("rejects a paragraph as a direct schemeSection child", () => {
      const sectionType = schema.nodes["schemeSection"];
      const paragraph = schema.nodes["paragraph"];

      if (!sectionType || !paragraph) {
        return;
      }

      expect(() =>
        sectionType.createChecked(
          {
            schemeId: null,
            schemeKind: null,
            schemeConfig: {},
            effortPct: null,
            pace: null,
            note: null,
            sortOrder: 0,
          },
          paragraph.create(),
        ),
      ).toThrow();
    });
  });

  describe("notesSection", () => {
    it("accepts a single paragraph child", () => {
      const sectionType = schema.nodes["notesSection"];
      const paragraph = schema.nodes["paragraph"];

      if (!sectionType || !paragraph) {
        return;
      }

      const section = sectionType.create({ note: null, sortOrder: 0 }, paragraph.create());

      expect(section.childCount).toBe(1);
    });

    it("rejects an exerciseLine as a notesSection child", () => {
      const sectionType = schema.nodes["notesSection"];
      const exerciseLine = schema.nodes["exerciseLine"];

      if (!sectionType || !exerciseLine) {
        return;
      }

      expect(() =>
        sectionType.createChecked(
          { note: null, sortOrder: 0 },
          exerciseLine.create({ sortOrder: 0 }),
        ),
      ).toThrow();
    });

    it("requires at least one paragraph child", () => {
      const sectionType = schema.nodes["notesSection"];

      if (!sectionType) {
        return;
      }

      expect(() => sectionType.createChecked({ note: null, sortOrder: 0 }, null)).toThrow();
    });
  });

  describe("textCalloutSection", () => {
    it("accepts a single paragraph child", () => {
      const sectionType = schema.nodes["textCalloutSection"];
      const paragraph = schema.nodes["paragraph"];

      if (!sectionType || !paragraph) {
        return;
      }

      const section = sectionType.create(
        { tone: "info", note: null, sortOrder: 0 },
        paragraph.create(),
      );

      expect(section.childCount).toBe(1);
    });

    it("rejects an exerciseLine as a textCalloutSection child", () => {
      const sectionType = schema.nodes["textCalloutSection"];
      const exerciseLine = schema.nodes["exerciseLine"];

      if (!sectionType || !exerciseLine) {
        return;
      }

      expect(() =>
        sectionType.createChecked(
          { tone: "info", note: null, sortOrder: 0 },
          exerciseLine.create({ sortOrder: 0 }),
        ),
      ).toThrow();
    });
  });

  describe("exerciseLine", () => {
    it("accepts text and exerciseMention as children", () => {
      const lineType = schema.nodes["exerciseLine"];
      const mentionType = schema.nodes["exerciseMention"];

      if (!lineType || !mentionType) {
        return;
      }

      const text = schema.text("3x10 ");
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

      const line = lineType.create({ sortOrder: 0 }, [text, mention]);

      expect(line.childCount).toBe(2);
    });

    it("rejects a paragraph nested inside exerciseLine", () => {
      const lineType = schema.nodes["exerciseLine"];
      const paragraph = schema.nodes["paragraph"];

      if (!lineType || !paragraph) {
        return;
      }

      expect(() => lineType.createChecked({ sortOrder: 0 }, paragraph.create())).toThrow();
    });
  });
});
