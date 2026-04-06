import { type ReactNode } from "react";

import { Stack, Typography } from "@mui/material";

type StorySectionProps = {
  title: string;
  children: ReactNode;
  direction?: "row" | "column";
};

export const StorySection = ({ title, children, direction = "row" }: StorySectionProps) => (
  <Stack spacing={1.5}>
    <Typography variant="caption" sx={{ opacity: 0.5, textTransform: "uppercase" }}>
      {title}
    </Typography>
    <Stack
      direction={direction}
      spacing={2}
      sx={{ alignItems: direction === "row" ? "center" : "stretch", flexWrap: "wrap" }}
    >
      {children}
    </Stack>
  </Stack>
);

type StoryPageProps = {
  children: ReactNode;
};

export const StoryPage = ({ children }: StoryPageProps) => (
  <Stack spacing={5} sx={{ p: 4, maxWidth: 900 }}>
    {children}
  </Stack>
);
