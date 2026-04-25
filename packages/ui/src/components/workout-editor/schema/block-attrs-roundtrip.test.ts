import { Editor } from "@tiptap/core";
import { afterEach, describe, expect, it } from "vitest";

import { coreWorkoutExtensions } from "../registered-nodes";

type ChildLike = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: ChildLike[];
};

const asChildren = (value: unknown): ChildLike[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value as ChildLike[];
};

describe("workout-editor attribute round-trip", () => {
  let editor: Editor | null = null;

  afterEach(() => {
    editor?.destroy();
    editor = null;
  });

  const buildEditor = (): Editor => {
    const element = document.createElement("div");

    document.body.appendChild(element);

    return new Editor({
      element,
      extensions: coreWorkoutExtensions,
      content: { type: "doc", content: [] },
    });
  };

  it("preserves block attrs through insert and getJSON", () => {
    editor = buildEditor();

    editor
      .chain()
      .insertContent({
        type: "block",
        attrs: { blockTypeId: "bt-warmup", title: "Warmup", sortOrder: 4 },
        content: [],
      })
      .run();

    const json = editor.getJSON();
    const block = asChildren(json.content)[0];

    expect(block?.type).toBe("block");
    expect(block?.attrs?.blockTypeId).toBe("bt-warmup");
    expect(block?.attrs?.title).toBe("Warmup");
    expect(block?.attrs?.sortOrder).toBe(4);
  });

  it("preserves schemeSection attrs through insert and getJSON", () => {
    editor = buildEditor();

    editor
      .chain()
      .insertContent({
        type: "block",
        attrs: { blockTypeId: "bt-1", title: null, sortOrder: 0 },
        content: [
          {
            type: "schemeSection",
            attrs: {
              schemeId: "scheme-emom",
              schemeKind: "EMOM",
              schemeConfig: { interval: 60, rounds: 10 },
              effortPct: 80,
              pace: "moderate",
              note: "keep RPE low",
              sortOrder: 2,
            },
            content: [{ type: "exerciseLine", content: [] }],
          },
        ],
      })
      .run();

    const json = editor.getJSON();
    const block = asChildren(json.content)[0];
    const section = asChildren(block?.content)[0];

    expect(section?.type).toBe("schemeSection");
    expect(section?.attrs?.schemeId).toBe("scheme-emom");
    expect(section?.attrs?.schemeKind).toBe("EMOM");
    expect(section?.attrs?.schemeConfig).toEqual({ interval: 60, rounds: 10 });
    expect(section?.attrs?.effortPct).toBe(80);
    expect(section?.attrs?.pace).toBe("moderate");
    expect(section?.attrs?.note).toBe("keep RPE low");
    expect(section?.attrs?.sortOrder).toBe(2);
  });

  it("preserves textCalloutSection attrs through insert and getJSON", () => {
    editor = buildEditor();

    editor
      .chain()
      .insertContent({
        type: "block",
        attrs: { blockTypeId: "bt-1", title: null, sortOrder: 0 },
        content: [
          {
            type: "textCalloutSection",
            attrs: { tone: "warning", note: "watch your back", sortOrder: 1 },
            content: [{ type: "paragraph" }],
          },
        ],
      })
      .run();

    const json = editor.getJSON();
    const block = asChildren(json.content)[0];
    const section = asChildren(block?.content)[0];

    expect(section?.type).toBe("textCalloutSection");
    expect(section?.attrs?.tone).toBe("warning");
    expect(section?.attrs?.note).toBe("watch your back");
    expect(section?.attrs?.sortOrder).toBe(1);
  });

  it("preserves notesSection attrs through insert and getJSON", () => {
    editor = buildEditor();

    editor
      .chain()
      .insertContent({
        type: "block",
        attrs: { blockTypeId: "bt-1", title: null, sortOrder: 0 },
        content: [
          {
            type: "notesSection",
            attrs: { note: "a brief note", sortOrder: 3 },
            content: [{ type: "paragraph" }],
          },
        ],
      })
      .run();

    const json = editor.getJSON();
    const block = asChildren(json.content)[0];
    const section = asChildren(block?.content)[0];

    expect(section?.type).toBe("notesSection");
    expect(section?.attrs?.note).toBe("a brief note");
    expect(section?.attrs?.sortOrder).toBe(3);
  });
});
