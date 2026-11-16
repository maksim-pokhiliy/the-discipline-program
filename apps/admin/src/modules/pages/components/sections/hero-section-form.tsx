"use client";

import { type ReactElement } from "react";

import { Stack } from "@mui/material";
import { type z } from "zod";

import { type homePageHeroSchema } from "@repo/contracts/cms/pages";

import { FormCard } from "@app/lib/components/form-card";

import { SECTION_FEATURES, type HeroSectionType } from "../../config/section-features";
import { SectionImageField, SectionTextField } from "../section-field";

type HeroSectionData = z.infer<typeof homePageHeroSchema>;

type HeroSectionFormProps = {
  sectionType: HeroSectionType;
};

export const HeroSectionForm = ({ sectionType }: HeroSectionFormProps): ReactElement => {
  const features = SECTION_FEATURES[sectionType];

  return (
    <FormCard title="Hero Section Settings">
      <Stack spacing={3}>
        <SectionTextField<HeroSectionData> name="title" label="Title" />
        <SectionTextField<HeroSectionData> name="subtitle" label="Subtitle" minRows={3} />

        {features.hasButton && (
          <>
            <SectionTextField<HeroSectionData> name="buttonText" label="Button Text" />
            <SectionTextField<HeroSectionData> name="buttonHref" label="Button Link" />
          </>
        )}

        {features.hasBackground && <SectionImageField name="backgroundImage" />}
      </Stack>
    </FormCard>
  );
};
