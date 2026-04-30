"use client";

import { Grid, Stack } from "@mui/material";

import { IdentityCard } from "./identity-card";
import { PayloadCard } from "./payload-card";
import { SideCards } from "./side-cards";

type WeekTemplateLibraryFormProps = {
  isLoading?: boolean;
};

export const WeekTemplateLibraryForm = ({ isLoading = false }: WeekTemplateLibraryFormProps) => (
  <Grid container spacing={3}>
    <Grid size={{ xs: 12, lg: 8 }}>
      <Stack spacing={3}>
        <IdentityCard isLoading={isLoading} />
        <PayloadCard />
      </Stack>
    </Grid>

    <Grid size={{ xs: 12, lg: 4 }}>
      <SideCards isLoading={isLoading} />
    </Grid>
  </Grid>
);
