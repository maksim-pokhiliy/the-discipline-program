"use client";

import { Box, FormHelperText, Stack, Typography, useTheme } from "@mui/material";
import { EditorContent } from "@tiptap/react";

import { EditorToolbar } from "./editor-toolbar";
import { useEditor } from "./use-editor";

const EDITOR_LINE_HEIGHT_PX = 20;

type RichTextEditorVariant = "default" | "inline";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  label?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  minRows?: number;
  variant?: RichTextEditorVariant;
}

export const RichTextEditor = ({
  value,
  onChange,
  onBlur,
  placeholder = "Write something...",
  label,
  error,
  helperText,
  disabled = false,
  minRows,
  variant = "default",
}: RichTextEditorProps) => {
  const theme = useTheme();
  const editor = useEditor({ value, onChange, onBlur, placeholder, disabled });
  const isInline = variant === "inline";
  const resolvedMinRows = minRows ?? (isInline ? 3 : 10);

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
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          opacity: disabled ? 0.6 : 1,
          pointerEvents: disabled ? "none" : "auto",
          ...(isInline
            ? {}
            : {
                border: 1,
                borderColor: error ? "error.main" : "divider",
                borderRadius: 1,
                bgcolor: "background.paper",
                transition: theme.transitions.create("border-color"),
                "&:focus-within": {
                  borderColor: error ? "error.main" : "primary.main",
                  boxShadow: error ? "none" : `0 0 0 1px ${theme.palette.primary.main}`,
                },
              }),
        }}
      >
        <EditorToolbar editor={editor} />

        <Stack
          onClick={handleContainerClick}
          sx={{
            p: isInline ? 1.5 : 2,
            minHeight: resolvedMinRows * EDITOR_LINE_HEIGHT_PX,
            cursor: "text",
            flexGrow: 1,
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
        </Stack>
      </Box>

      {helperText && (
        <FormHelperText error={error} sx={{ ml: 1 }}>
          {helperText}
        </FormHelperText>
      )}
    </Box>
  );
};
