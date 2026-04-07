"use client";

import { useCallback } from "react";

import {
  FormatBold,
  FormatItalic,
  FormatListBulleted,
  FormatListNumbered,
  FormatQuote,
  FormatUnderlined,
  Link as LinkIcon,
  LinkOff,
  Redo,
  Undo,
} from "@mui/icons-material";
import { Box, Divider, IconButton, Stack, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { type Editor } from "@tiptap/react";

type EditorToolbarProps = {
  editor: Editor | null;
};

export const EditorToolbar = ({ editor }: EditorToolbarProps) => {
  const setLink = useCallback(() => {
    if (!editor) {
      return;
    }

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) {
      return;
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();

      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        p: 1,
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        zIndex: 1,
      }}
      flexWrap="wrap"
    >
      <ToggleButtonGroup size="small" exclusive aria-label="text formatting">
        <ToggleButton
          value="bold"
          selected={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
        >
          <FormatBold fontSize="small" />
        </ToggleButton>

        <ToggleButton
          value="italic"
          selected={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
        >
          <FormatItalic fontSize="small" />
        </ToggleButton>

        <ToggleButton
          value="underline"
          selected={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={!editor.can().chain().focus().toggleUnderline().run()}
        >
          <FormatUnderlined fontSize="small" />
        </ToggleButton>
      </ToggleButtonGroup>

      <Divider flexItem orientation="vertical" sx={{ mx: 0.5, my: 1 }} />

      <ToggleButtonGroup size="small" exclusive aria-label="lists">
        <ToggleButton
          value="bulletList"
          selected={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <FormatListBulleted fontSize="small" />
        </ToggleButton>

        <ToggleButton
          value="orderedList"
          selected={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <FormatListNumbered fontSize="small" />
        </ToggleButton>
      </ToggleButtonGroup>

      <Divider flexItem orientation="vertical" sx={{ mx: 0.5, my: 1 }} />

      <ToggleButtonGroup size="small" exclusive aria-label="inserts">
        <ToggleButton value="link" selected={editor.isActive("link")} onClick={setLink}>
          <LinkIcon fontSize="small" />
        </ToggleButton>

        <ToggleButton
          value="linkOff"
          disabled={!editor.isActive("link")}
          onClick={() => editor.chain().focus().unsetLink().run()}
        >
          <LinkOff fontSize="small" />
        </ToggleButton>
      </ToggleButtonGroup>

      <Divider flexItem orientation="vertical" sx={{ mx: 0.5, my: 1 }} />

      <ToggleButtonGroup size="small" exclusive aria-label="blocks">
        <ToggleButton
          value="blockquote"
          selected={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <FormatQuote fontSize="small" />
        </ToggleButton>
      </ToggleButtonGroup>

      <Box flexGrow={1} />

      <Stack direction="row" spacing={0.5}>
        <IconButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
        >
          <Undo fontSize="small" />
        </IconButton>

        <IconButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
        >
          <Redo fontSize="small" />
        </IconButton>
      </Stack>
    </Stack>
  );
};
