"use client";

import { Grid, Stack } from "@mui/material";

import { IdentityCard } from "./identity-card";
import { ParamsCard } from "./params-card";
import { SideCards } from "./side-cards";

type SchemeTemplateLibraryFormProps = {
  isLoading?: boolean;
};

export const SchemeTemplateLibraryForm = ({
  isLoading = false,
}: SchemeTemplateLibraryFormProps) => (
  <Grid container spacing={3}>
    <Grid size={{ xs: 12, lg: 8 }}>
      <Stack spacing={3}>
        <IdentityCard isLoading={isLoading} />
        <ParamsCard isLoading={isLoading} />
      </Stack>
    </Grid>

    <Grid size={{ xs: 12, lg: 4 }}>
      <SideCards isLoading={isLoading} />
    </Grid>
  </Grid>
);
