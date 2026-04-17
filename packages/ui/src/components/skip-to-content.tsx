import { Box } from "@mui/material";

const visuallyHiddenSx = {
  border: 0,
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: "1px",
  margin: "-1px",
  overflow: "hidden",
  padding: 0,
  position: "absolute",
  whiteSpace: "nowrap",
  width: "1px",
} as const;

export type SkipToContentProps = {
  href?: string;
  label?: string;
};

export const SkipToContent = ({
  href = "#main-content",
  label = "Skip to content",
}: SkipToContentProps) => (
  <Box
    component="a"
    href={href}
    sx={{
      ...visuallyHiddenSx,
      "&:focus-visible": {
        clip: "auto",
        clipPath: "none",
        height: "auto",
        margin: 0,
        overflow: "visible",
        p: 2,
        position: "fixed",
        top: 2,
        left: 2,
        width: "auto",
        zIndex: "tooltip",
        bgcolor: "background.paper",
        color: "text.primary",
        borderRadius: 1,
        outline: 2,
        outlineColor: "primary.main",
        outlineOffset: 2,
      },
    }}
  >
    {label}
  </Box>
);
