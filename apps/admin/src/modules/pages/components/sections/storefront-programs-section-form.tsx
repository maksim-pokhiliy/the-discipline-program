"use client";

import { type ReactElement } from "react";

import { TextField } from "@mui/material";
import { useFormContext } from "react-hook-form";
import { type z } from "zod";

import { type homePageStorefrontProgramsSchema } from "@repo/contracts/cms/pages";

import { PROGRAM_LISTING_GROUP } from "../../config/listing-section-fields";

import { FlatFieldGroup } from "./flat-field-group";
import { TitleSubtitleSectionForm } from "./title-subtitle-section-form";

type StorefrontProgramsSectionData = z.infer<typeof homePageStorefrontProgramsSchema>;

export const StorefrontProgramsSectionForm = (): ReactElement => {
  const {
    register,
    formState: { errors },
  } = useFormContext<StorefrontProgramsSectionData>();

  return (
    <TitleSubtitleSectionForm cardTitle="Programs Preview Settings">
      <TextField
        label="Button Text"
        fullWidth
        error={!!errors.buttonText}
        helperText={errors.buttonText?.message}
        {...register("buttonText")}
      />

      <TextField
        label="Button Link"
        fullWidth
        error={!!errors.buttonHref}
        helperText={errors.buttonHref?.message}
        {...register("buttonHref")}
      />

      <FlatFieldGroup group={PROGRAM_LISTING_GROUP} />
    </TitleSubtitleSectionForm>
  );
};
