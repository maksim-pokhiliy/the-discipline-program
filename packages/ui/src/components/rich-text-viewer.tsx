"use client";

import { Box, type BoxProps, type SxProps, type Theme } from "@mui/material";
import DOMPurify from "isomorphic-dompurify";

interface RichTextViewerProps extends BoxProps {
  content: string;
}

const defaultStyles: SxProps<Theme> = {
  "& h1": { typography: "h3", mt: 4, mb: 2, fontWeight: 700 },
  "& h2": { typography: "h4", mt: 4, mb: 2, fontWeight: 600 },
  "& h3": { typography: "h5", mt: 3, mb: 2, fontWeight: 600 },
  "& h4": { typography: "h6", mt: 3, mb: 2, fontWeight: 600 },

  "& p": {
    typography: "body1",
    mb: 2,
    lineHeight: 1.8,
    color: "text.primary",
  },

  "& a": {
    color: "primary.main",
    textDecoration: "underline",
    fontWeight: 500,
    cursor: "pointer",
    "&:hover": {
      color: "primary.dark",
    },
  },

  "& strong": { fontWeight: 600 },
  "& em": { fontStyle: "italic" },
  "& u": { textDecoration: "underline" },

  "& ul, & ol": {
    mb: 3,
    pl: 3,
    color: "text.primary",
  },

  "& li": {
    typography: "body1",
    mb: 0.5,
    pl: 0.5,
  },

  "& blockquote": {
    borderLeft: 4,
    borderColor: "primary.main",
    ml: 0,
    mr: 0,
    pl: 3,
    pr: 2,
    py: 1,
    bgcolor: "action.hover",
    fontStyle: "italic",
    my: 3,
    borderRadius: 1,
  },

  "& img": {
    maxWidth: "100%",
    height: "auto",
    borderRadius: 1,
    my: 2,
  },

  "& .ProseMirror": {
    outline: "none",
  },
};

export const RichTextViewer = ({ content, sx, ...props }: RichTextViewerProps) => {
  const sanitizedContent = DOMPurify.sanitize(content, { USE_PROFILES: { html: true } });

  return (
    <Box
      sx={[defaultStyles, ...(Array.isArray(sx) ? sx : [sx])]}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      {...props}
    />
  );
};
