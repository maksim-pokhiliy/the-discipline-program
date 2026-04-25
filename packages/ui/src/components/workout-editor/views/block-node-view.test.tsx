import { useEffect, type ReactNode } from "react";

import { DndContext } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { EditorContent, useEditor } from "@tiptap/react";
import { afterEach, describe, expect, it } from "vitest";

import type { BlockType } from "@repo/contracts/library/block-type";
import { type Scheme, SchemeKind } from "@repo/contracts/library/scheme";

import { render } from "../../../test/render";
import { writeBlockTypes, BlockTypesExtension } from "../extensions/block-types";
import { writeSchemes, SchemesExtension } from "../extensions/schemes";
import { coreWorkoutExtensions } from "../registered-nodes";

const buildBlockType = (
  overrides: Partial<BlockType> & { slug: string; name: string },
): BlockType => ({
  id: `bt-${overrides.slug}`,
  description: null,
  iconKey: null,
  colorKey: null,
  sortOrder: 0,
  active: true,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

const buildScheme = (
  overrides: Partial<Scheme> & { slug: string; name: string; kind: SchemeKind },
): Scheme => ({
  id: `scheme-${overrides.slug}`,
  description: null,
  requiredParams: [],
  paramDefaults: {},
  active: true,
  sortOrder: 0,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

const SEVEN_SCHEMES: ReadonlyArray<Scheme> = [
  buildScheme({ slug: "straight", name: "Straight", kind: SchemeKind.STRAIGHT_SETS }),
  buildScheme({ slug: "for-time", name: "For Time", kind: SchemeKind.FOR_TIME }),
  buildScheme({ slug: "amrap", name: "AMRAP", kind: SchemeKind.AMRAP }),
  buildScheme({ slug: "emom", name: "EMOM", kind: SchemeKind.EMOM }),
  buildScheme({ slug: "every-x-min", name: "Every X Min", kind: SchemeKind.EVERY_X_MIN }),
  buildScheme({ slug: "intervals", name: "Intervals", kind: SchemeKind.INTERVALS }),
  buildScheme({ slug: "time-blocks", name: "Time Blocks", kind: SchemeKind.TIME_BLOCKS }),
];

type HarnessProps = {
  blockTypes: ReadonlyArray<BlockType>;
  schemes: ReadonlyArray<Scheme>;
  initialDoc: { type: "doc"; content: Array<Record<string, unknown>> };
  onReady?: (editorReady: ReturnType<typeof useEditor>) => void;
  children?: ReactNode;
};

const EditorHarness = ({ blockTypes, schemes, initialDoc, onReady }: HarnessProps) => {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [...coreWorkoutExtensions, BlockTypesExtension, SchemesExtension],
    content: initialDoc,
  });

  useEffect(() => {
    if (editor === null) {
      return;
    }

    writeBlockTypes(editor, blockTypes);
    writeSchemes(editor, schemes);
    editor.view.dispatch(
      editor.state.tr.setMeta("libraryStateSync", true).setMeta("addToHistory", false),
    );
  }, [editor, blockTypes, schemes]);

  useEffect(() => {
    if (editor !== null && onReady !== undefined) {
      onReady(editor);
    }
  }, [editor, onReady]);

  if (editor === null) {
    return null;
  }

  return (
    <DndContext>
      <SortableContext items={["block:0"]}>
        <EditorContent editor={editor} />
      </SortableContext>
    </DndContext>
  );
};

const blockDoc = (blockTypeId: string | null, content: Array<Record<string, unknown>> = []) => ({
  type: "doc" as const,
  content: [
    {
      type: "block",
      attrs: { blockTypeId, title: null, sortOrder: 0 },
      content,
    },
  ],
});

let editorRef: ReturnType<typeof useEditor> | null = null;

afterEach(() => {
  editorRef?.destroy();
  editorRef = null;
});

describe("BlockNodeView", () => {
  it("renders the block container with reorder, delete, and add-section affordances", async () => {
    const blockTypes = [buildBlockType({ slug: "warm-up", name: "Warmup" })];

    render(
      <EditorHarness
        blockTypes={blockTypes}
        schemes={SEVEN_SCHEMES}
        initialDoc={blockDoc("bt-warm-up")}
        onReady={(editor) => {
          editorRef = editor;
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Reorder block")).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Delete block")).toBeInTheDocument();
    expect(screen.getByLabelText("Add section")).toBeInTheDocument();
  });

  it("renders the BlockType select with options that come from the reactive storage", async () => {
    const initialBlockTypes = [
      buildBlockType({ slug: "warm-up", name: "Warmup" }),
      buildBlockType({ slug: "strength", name: "Strength" }),
    ];

    render(
      <EditorHarness
        blockTypes={initialBlockTypes}
        schemes={SEVEN_SCHEMES}
        initialDoc={blockDoc("bt-warm-up")}
        onReady={(editor) => {
          editorRef = editor;
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Warmup")).toBeInTheDocument();
    });

    expect(editorRef).not.toBeNull();

    if (editorRef !== null) {
      const editor = editorRef;

      act(() => {
        writeBlockTypes(editor, [
          ...initialBlockTypes,
          buildBlockType({ slug: "cooldown", name: "Cooldown" }),
        ]);
        editor.view.dispatch(
          editor.state.tr.setMeta("libraryStateSync", true).setMeta("addToHistory", false),
        );
      });

      await waitFor(() => {
        const select = screen.getByText("Warmup");

        expect(select).toBeInTheDocument();
      });
    }
  });

  it("removes the block from the doc when the trash button is clicked", async () => {
    render(
      <EditorHarness
        blockTypes={[buildBlockType({ slug: "warm-up", name: "Warmup" })]}
        schemes={SEVEN_SCHEMES}
        initialDoc={blockDoc("bt-warm-up")}
        onReady={(editor) => {
          editorRef = editor;
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Delete block")).toBeInTheDocument();
    });

    expect(editorRef?.state.doc.childCount).toBe(1);

    fireEvent.click(screen.getByLabelText("Delete block"));

    await waitFor(() => {
      expect(editorRef?.state.doc.childCount).toBe(0);
    });
  });

  it("opens the Add section menu and shows one item per scheme plus Notes and Text callout", async () => {
    render(
      <EditorHarness
        blockTypes={[buildBlockType({ slug: "warm-up", name: "Warmup" })]}
        schemes={SEVEN_SCHEMES}
        initialDoc={blockDoc("bt-warm-up")}
        onReady={(editor) => {
          editorRef = editor;
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Add section")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText("Add section"));

    await waitFor(() => {
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });

    const menuItems = screen.getAllByRole("menuitem");

    expect(menuItems).toHaveLength(SEVEN_SCHEMES.length + 2);

    const labels = menuItems.map((item) => item.textContent ?? "");

    expect(labels).toContain("Notes");
    expect(labels).toContain("Text callout");
  });

  it("inserts a notesSection when the Add section menu's Notes item is clicked", async () => {
    render(
      <EditorHarness
        blockTypes={[buildBlockType({ slug: "warm-up", name: "Warmup" })]}
        schemes={SEVEN_SCHEMES}
        initialDoc={blockDoc("bt-warm-up")}
        onReady={(editor) => {
          editorRef = editor;
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Add section")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText("Add section"));

    await waitFor(() => {
      expect(screen.getByText("Notes")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Notes"));

    await waitFor(() => {
      const block = editorRef?.state.doc.firstChild;

      expect(block?.childCount).toBe(1);
      expect(block?.firstChild?.type.name).toBe("notesSection");
    });
  });
});
