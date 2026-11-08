"use client";

import { type ReactElement } from "react";

import { type z } from "zod";

import { type homePageContactSchema } from "@repo/contracts/cms/pages";

import { SectionTextField } from "../section-field";

import { TitleSubtitleSectionForm } from "./title-subtitle-section-form";

type ContactSectionData = z.infer<typeof homePageContactSchema>;

export const ContactSectionForm = (): ReactElement => (
  <TitleSubtitleSectionForm cardTitle="Final CTA Settings">
    <SectionTextField<ContactSectionData> name="buttonText" label="Button Text" />
    <SectionTextField<ContactSectionData> name="buttonHref" label="Button Link" />
  </TitleSubtitleSectionForm>
);
