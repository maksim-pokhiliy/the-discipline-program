"use client";

import { Stack, Typography } from "@mui/material";
import { useSearchParams } from "next/navigation";

export const InspectorPanel = () => {
  const searchParams = useSearchParams();
  const selected = searchParams.get("selected");

  return (
    <Stack
      spacing={2}
      sx={{
        height: "100%",
        p: 3,
        bgcolor: "background.paper",
        borderLeft: 1,
        borderColor: "divider",
      }}
    >
      <Typography variant="h6">Inspector</Typography>

      {selected ? (
        <Typography variant="body2" color="text.secondary">
          Selected: {selected}
        </Typography>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Select a node to inspect
        </Typography>
      )}
    </Stack>
  );
};
