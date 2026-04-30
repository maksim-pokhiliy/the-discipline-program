"use client";

import { Grid, Stack } from "@mui/material";

import { IdentityCard } from "./identity-card";
import { PayloadBuilderCard } from "./payload-builder-card";
import { PayloadCard } from "./payload-card";
import { SideCards } from "./side-cards";

type BlockTemplateLibraryFormProps = {
  isLoading?: boolean;
  mode?: "create" | "edit";
};

export const BlockTemplateLibraryForm = ({
  isLoading = false,
  mode = "edit",
}: BlockTemplateLibraryFormProps) => (
  <Grid container spacing={3}>
    <Grid size={{ xs: 12, lg: 8 }}>
      <Stack spacing={3}>
        <IdentityCard isLoading={isLoading} />
        {mode === "create" ? <PayloadBuilderCard isLoading={isLoading} /> : <PayloadCard />}
      </Stack>
    </Grid>

    <Grid size={{ xs: 12, lg: 4 }}>
      <SideCards isLoading={isLoading} />
    </Grid>
  </Grid>
);
