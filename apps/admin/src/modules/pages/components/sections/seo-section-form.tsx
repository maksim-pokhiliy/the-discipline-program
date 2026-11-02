"use client";

import { type ReactElement } from "react";

import { Stack, TextField } from "@mui/material";
import { useFormContext, useWatch } from "react-hook-form";
import { type z } from "zod";

import { type seoSectionSchema } from "@repo/contracts/cms/pages";

import { FormCard } from "@app/lib/components/form-card";

import {
  formatLengthHint,
  SEO_DESCRIPTION_LENGTH_HINT,
  SEO_TITLE_LENGTH_HINT,
} from "./seo-length-hint";

type SeoSectionData = z.infer<typeof seoSectionSchema>;

export const SeoSectionForm = (): ReactElement => {
  const { register, control } = useFormContext<SeoSectionData>();
  const [title, description] = useWatch({ control, name: ["title", "description"] });

  return (
    <FormCard
      title="Search Engine Listing"
      subtitle="Shown in search results; the counters are recommendations, not limits."
    >
      <Stack spacing={3}>
        <TextField
          label="Search Result Title"
          fullWidth
          helperText={formatLengthHint(title, SEO_TITLE_LENGTH_HINT)}
          {...register("title")}
        />

        <TextField
          label="Search Result Description"
          fullWidth
          multiline
          minRows={3}
          helperText={formatLengthHint(description, SEO_DESCRIPTION_LENGTH_HINT)}
          {...register("description")}
        />
      </Stack>
    </FormCard>
  );
};
