"use client";

import { Stack, Typography } from "@mui/material";

import { type SchemeParamsBasePath } from "./scheme-params-field";

type SchemeParamsNoneFormProps = {
  basePath: SchemeParamsBasePath;
};

export const SchemeParamsNoneForm = ({ basePath: _basePath }: SchemeParamsNoneFormProps) => {
  return (
    <Stack spacing={3}>
      <Typography variant="body2" color="text.secondary">
        No parameters required for this archetype.
      </Typography>
    </Stack>
  );
};
