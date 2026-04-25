import { useEffect } from "react";

import { DndContext } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { EditorContent, useEditor } from "@tiptap/react";
import { afterEach, describe, expect, it } from "vitest";

import { render } from "../../../test/render";
import { BlockTypesExtension, writeBlockTypes } from "../extensions/block-types";
import { SchemesExtension, writeSchemes } from "../extensions/schemes";
import { coreWorkoutExtensions } from "../registered-nodes";

const Harness = ({
  tone,
  text,
  onReady,
}: {
  tone: string;
  text: string;
  onReady: (editor: ReturnType<typeof useEditor>) => void;
}) => {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [...coreWorkoutExtensions, BlockTypesExtension, SchemesExtension],
    content: {
      type: "doc",
      content: [
        {
          type: "block",
          attrs: { blockTypeId: "bt-1", title: null, sortOrder: 0 },
          content: [
            {
              type: "textCalloutSection",
              attrs: { tone, note: null, sortOrder: 0 },
              content: [{ type: "paragraph", content: [{ type: "text", text }] }],
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

    writeBlockTypes(editor, []);
    writeSchemes(editor, []);
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

describe("TextCalloutSectionView", () => {
  it("renders reorder, delete, and the tone chip", async () => {
    render(
      <Harness
        tone="warning"
        text="watch the form"
        onReady={(editor) => {
          editorRef = editor;
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Reorder section")).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Delete section")).toBeInTheDocument();
    expect(screen.getByText("warning")).toBeInTheDocument();
  });

  it("renders the paragraph child content", async () => {
    render(
      <Harness
        tone="info"
        text="rest 60 seconds"
        onReady={(editor) => {
          editorRef = editor;
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("rest 60 seconds")).toBeInTheDocument();
    });
  });

  it("removes the section when delete is clicked", async () => {
    render(
      <Harness
        tone="info"
        text="rest"
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
});
