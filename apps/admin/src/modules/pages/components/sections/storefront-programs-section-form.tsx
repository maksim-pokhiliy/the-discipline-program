"use client";

import { type ReactElement } from "react";

import { type z } from "zod";

import { type homePageStorefrontProgramsSchema } from "@repo/contracts/cms/pages";

import { PROGRAM_LISTING_GROUP } from "../../config/listing-section-fields";
import { SectionTextField } from "../section-field";

import { FlatFieldGroup } from "./flat-field-group";
import { TitleSubtitleSectionForm } from "./title-subtitle-section-form";

type StorefrontProgramsSectionData = z.infer<typeof homePageStorefrontProgramsSchema>;

export const StorefrontProgramsSectionForm = (): ReactElement => (
  <TitleSubtitleSectionForm cardTitle="Programs Preview Settings">
    <SectionTextField<StorefrontProgramsSectionData> name="buttonText" label="Button Text" />
    <SectionTextField<StorefrontProgramsSectionData> name="buttonHref" label="Button Link" />

    <FlatFieldGroup group={PROGRAM_LISTING_GROUP} />
  </TitleSubtitleSectionForm>
);
