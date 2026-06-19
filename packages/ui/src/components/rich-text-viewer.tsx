"use client";

import { Box, type BoxProps, type SxProps, type Theme } from "@mui/material";
import DOMPurify from "isomorphic-dompurify";

export type RichTextViewerProps = BoxProps & {
  content: string;
};

const SANITIZER_CONFIG = {
  ALLOWED_TAGS: [
    "p",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "strong",
    "em",
    "u",
    "ul",
    "ol",
    "li",
    "blockquote",
    "code",
    "pre",
    "br",
    "a",
    "img",
  ],
  ALLOWED_ATTR: ["href", "title", "target", "rel", "src", "alt"],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
};

const defaultStyles: SxProps<Theme> = {
  "& h1": { typography: "h3", mt: 4, mb: 2 },
  "& h2": { typography: "h4", mt: 4, mb: 2 },
  "& h3": { typography: "h5", mt: 3, mb: 2 },
  "& h4": { typography: "h6", mt: 3, mb: 2 },

  "& p": {
    typography: "body1",
    mb: 2,
    color: "text.primary",
  },

  "& a": {
    color: "primary.main",
    textDecoration: "underline",

    cursor: "pointer",
    "&:hover": {
      color: "primary.dark",
    },
  },

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
  const sanitized = DOMPurify.sanitize(content, SANITIZER_CONFIG);

  return (
    <Box
      sx={[defaultStyles, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
      dangerouslySetInnerHTML={{ __html: sanitized }}
      {...props}
    />
  );
};
