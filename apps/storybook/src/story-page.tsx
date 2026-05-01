import { type ReactNode } from "react";

import { Stack } from "@mui/material";

type StoryPageProps = {
  children: ReactNode;
};

export const StoryPage = ({ children }: StoryPageProps) => (
  <Stack spacing={5} sx={{ p: 4, maxWidth: 900 }}>
    {children}
  </Stack>
);
