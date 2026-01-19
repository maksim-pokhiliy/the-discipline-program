"use client";

import { Box, FormHelperText, Typography, useTheme } from "@mui/material";
import { EditorContent } from "@tiptap/react";

import { EditorToolbar } from "./editor-toolbar";
import { useEditor } from "./use-editor";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  minRows?: number;
}

export const RichTextEditor = ({
  value,
  onChange,
  placeholder = "Write something...",
  label,
  error,
  helperText,
  disabled = false,
  minRows = 10,
}: RichTextEditorProps) => {
  const theme = useTheme();
  const editor = useEditor({ value, onChange, placeholder, disabled });

  const handleContainerClick = () => {
    if (editor && !editor.isFocused) {
      editor.chain().focus().run();
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      {label && (
        <Typography
          variant="caption"
          color={error ? "error" : "text.secondary"}
          sx={{ mb: 0.5, ml: 1, display: "block" }}
        >
          {label}
        </Typography>
      )}

      <Box
        sx={{
          border: 1,
          borderColor: error ? "error.main" : "divider",
          borderRadius: 1,
          bgcolor: "background.paper",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          transition: "border-color 0.2s",
          "&:focus-within": {
            borderColor: error ? "error.main" : "primary.main",
            boxShadow: error ? "none" : `0 0 0 1px ${theme.palette.primary.main}`,
          },
          opacity: disabled ? 0.6 : 1,
          pointerEvents: disabled ? "none" : "auto",
        }}
      >
        <EditorToolbar editor={editor} />

        <Box
          onClick={handleContainerClick}
          sx={{
            p: 2,
            minHeight: minRows * 20,
            cursor: "text",
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            "& .ProseMirror": {
              outline: "none",
              flexGrow: 1,
              height: "100%",
            },
            "& .ProseMirror p.is-editor-empty:first-child::before": {
              color: "text.disabled",
              content: "attr(data-placeholder)",
              float: "left",
              height: 0,
              pointerEvents: "none",
            },
            "& ul": { pl: 3 },
            "& ol": { pl: 3 },
            "& blockquote": {
              borderLeft: `3px solid ${theme.palette.divider}`,
              pl: 2,
              color: "text.secondary",
            },
            "& a": {
              color: "primary.main",
              textDecoration: "underline",
              cursor: "pointer",
            },
          }}
        >
          <EditorContent editor={editor} style={{ flexGrow: 1 }} />
        </Box>
      </Box>

      {helperText && (
        <FormHelperText error={error} sx={{ ml: 1 }}>
          {helperText}
        </FormHelperText>
      )}
    </Box>
  );
};
