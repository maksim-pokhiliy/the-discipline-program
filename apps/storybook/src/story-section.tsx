import { type ReactNode } from "react";

import { Stack, Typography } from "@mui/material";

type StorySectionProps = {
  title: string;
  children: ReactNode;
  direction?: "row" | "column";
};

export const StorySection = ({ title, children, direction = "row" }: StorySectionProps) => (
  <Stack spacing={1.5}>
    <Typography variant="overline" sx={{ opacity: 0.5 }}>
      {title}
    </Typography>
    <Stack
      direction={direction}
      spacing={2}
      alignItems={direction === "row" ? "center" : "stretch"}
      flexWrap="wrap"
    >
      {children}
    </Stack>
  </Stack>
);
