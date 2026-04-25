import { useEffect } from "react";

import { DndContext } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { EditorContent, useEditor } from "@tiptap/react";
import { afterEach, describe, expect, it } from "vitest";

import type { BlockType } from "@repo/contracts/library/block-type";
import { type Scheme, SchemeKind } from "@repo/contracts/library/scheme";

import { render } from "../../../test/render";
import { writeBlockTypes, BlockTypesExtension } from "../extensions/block-types";
import { writeSchemes, SchemesExtension } from "../extensions/schemes";
import { coreWorkoutExtensions } from "../registered-nodes";

const buildBlockType = (slug: string, name: string): BlockType => ({
  id: `bt-${slug}`,
  slug,
  name,
  description: null,
  iconKey: null,
  colorKey: null,
  sortOrder: 0,
  active: true,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
});

const buildScheme = (
  slug: string,
  name: string,
  kind: SchemeKind,
  paramDefaults: Record<string, number> = {},
): Scheme => ({
  id: `scheme-${slug}`,
  slug,
  name,
  kind,
  description: null,
  requiredParams: [],
  paramDefaults,
  active: true,
  sortOrder: 0,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
});

const SCHEMES: ReadonlyArray<Scheme> = [
  buildScheme("emom", "EMOM Default", SchemeKind.EMOM, { interval: 60, rounds: 10 }),
  buildScheme("amrap", "AMRAP Default", SchemeKind.AMRAP, { duration: 600 }),
  buildScheme("straight", "Straight Default", SchemeKind.STRAIGHT_SETS),
];

type Props = {
  schemeId: string | null;
  schemeKind: SchemeKind | null;
  schemeConfig: Record<string, number>;
  onReady: (editor: ReturnType<typeof useEditor>) => void;
};

const Harness = ({ schemeId, schemeKind, schemeConfig, onReady }: Props) => {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [...coreWorkoutExtensions, BlockTypesExtension, SchemesExtension],
    content: {
      type: "doc",
      content: [
        {
          type: "block",
          attrs: { blockTypeId: "bt-warm-up", title: null, sortOrder: 0 },
          content: [
            {
              type: "schemeSection",
              attrs: {
                schemeId,
                schemeKind,
                schemeConfig,
                effortPct: null,
                pace: null,
                note: null,
                sortOrder: 0,
              },
              content: [{ type: "exerciseLine", content: [] }],
            },
          ],
        },
      ],
    },
  });

  useEffect(() => {
    if (editor === null) {
      return;
    }

    writeBlockTypes(editor, [buildBlockType("warm-up", "Warmup")]);
    writeSchemes(editor, SCHEMES);
    editor.view.dispatch(
      editor.state.tr.setMeta("libraryStateSync", true).setMeta("addToHistory", false),
    );
  }, [editor]);

  useEffect(() => {
    if (editor !== null) {
      onReady(editor);
    }
  }, [editor, onReady]);

  if (editor === null) {
    return null;
  }

  return (
    <DndContext>
      <SortableContext items={["block:0"]}>
        <SortableContext items={["section:0:0"]}>
          <EditorContent editor={editor} />
        </SortableContext>
      </SortableContext>
    </DndContext>
  );
};

let editorRef: ReturnType<typeof useEditor> | null = null;

afterEach(() => {
  editorRef?.destroy();
  editorRef = null;
});

describe("SchemeSectionView", () => {
  it("renders reorder, delete, and a Scheme select", async () => {
    render(
      <Harness
        schemeId="scheme-emom"
        schemeKind={SchemeKind.EMOM}
        schemeConfig={{ interval: 60, rounds: 10 }}
        onReady={(editor) => {
          editorRef = editor;
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Reorder section")).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Delete section")).toBeInTheDocument();
    expect(screen.getByText("EMOM Default")).toBeInTheDocument();
  });

  it("removes the section from the doc when the trash is clicked", async () => {
    render(
      <Harness
        schemeId="scheme-emom"
        schemeKind={SchemeKind.EMOM}
        schemeConfig={{}}
        onReady={(editor) => {
          editorRef = editor;
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Delete section")).toBeInTheDocument();
    });

    expect(editorRef?.state.doc.firstChild?.childCount).toBe(1);

    fireEvent.click(screen.getByLabelText("Delete section"));

    await waitFor(() => {
      expect(editorRef?.state.doc.firstChild?.childCount).toBe(0);
    });
  });

  it("renders one MenuItem per scheme in the Scheme select", async () => {
    render(
      <Harness
        schemeId="scheme-emom"
        schemeKind={SchemeKind.EMOM}
        schemeConfig={{}}
        onReady={(editor) => {
          editorRef = editor;
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("EMOM Default")).toBeInTheDocument();
    });

    const select = screen
      .getAllByRole("combobox")
      .find((node) => (node.textContent ?? "").includes("EMOM Default"));

    expect(select).toBeDefined();

    if (select === undefined) {
      return;
    }

    fireEvent.mouseDown(select);

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    const options = screen.getAllByRole("option");

    expect(options.map((opt) => opt.textContent ?? "")).toEqual([
      "EMOM Default",
      "AMRAP Default",
      "Straight Default",
    ]);
  });

  it("atomically updates schemeId, schemeKind, and schemeConfig when a different scheme is picked", async () => {
    render(
      <Harness
        schemeId="scheme-emom"
        schemeKind={SchemeKind.EMOM}
        schemeConfig={{ interval: 60, rounds: 10 }}
        onReady={(editor) => {
          editorRef = editor;
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("EMOM Default")).toBeInTheDocument();
    });

    const select = screen
      .getAllByRole("combobox")
      .find((node) => (node.textContent ?? "").includes("EMOM Default"));

    expect(select).toBeDefined();

    if (select === undefined) {
      return;
    }

    fireEvent.mouseDown(select);

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("AMRAP Default"));

    await waitFor(() => {
      const block = editorRef?.state.doc.firstChild;
      const section = block?.firstChild;

      expect(section?.attrs.schemeId).toBe("scheme-amrap");
      expect(section?.attrs.schemeKind).toBe(SchemeKind.AMRAP);
      expect(section?.attrs.schemeConfig).toEqual({ duration: 600 });
    });
  });
});
