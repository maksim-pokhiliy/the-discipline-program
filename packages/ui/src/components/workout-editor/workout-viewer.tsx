"use client";

import { useEffect } from "react";

import { Box, Typography } from "@mui/material";
import { EditorContent, useEditor } from "@tiptap/react";

import { coreWorkoutExtensions } from "./registered-nodes";
import type { WorkoutViewerProps } from "./types";

export const WorkoutViewer = ({
  value,
  placeholder = "No workout content",
}: WorkoutViewerProps) => {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: coreWorkoutExtensions,
    content: value ?? undefined,
    editable: false,
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    if (value === null) {
      editor.commands.setContent({ type: "doc", content: [] }, { emitUpdate: false });

      return;
    }

    editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  if (value === null || value.content.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {placeholder}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        "& .ProseMirror": {
          outline: "none",
        },
      }}
    >
      <EditorContent editor={editor} />
    </Box>
  );
};
