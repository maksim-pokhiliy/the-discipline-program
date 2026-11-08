"use client";

import { type ReactElement } from "react";

import { type FieldPath } from "react-hook-form";
import { type z } from "zod";

import { type contactPageFormSchema } from "@repo/contracts/cms/pages";

import { FormCard } from "@app/lib/components/form-card";

import { SectionTextField } from "../section-field";

import { TitleSubtitleSectionForm } from "./title-subtitle-section-form";

type ContactFormSectionData = z.infer<typeof contactPageFormSchema>;

type ContactField = {
  name: FieldPath<ContactFormSectionData>;
  label: string;
  minRows?: number;
};

const GENERAL_FIELDS: readonly ContactField[] = [
  { name: "successTitle", label: "Success Title" },
  { name: "successMessage", label: "Success Message", minRows: 2 },
  { name: "sendAnotherLabel", label: "Send Another Button Label" },
  { name: "submitLabel", label: "Submit Button Label" },
  { name: "sendingLabel", label: "Sending Label" },
  { name: "errorMessage", label: "Error Message" },
];
const LABEL_FIELDS: readonly ContactField[] = [
  { name: "fieldLabels.name", label: "Name Field Label" },
  { name: "fieldLabels.contact", label: "Contact Field Label" },
  { name: "fieldLabels.program", label: "Program Field Label" },
  { name: "fieldLabels.message", label: "Message Field Label" },
];
const PLACEHOLDER_FIELDS: readonly ContactField[] = [
  { name: "fieldPlaceholders.contact", label: "Contact Field Placeholder" },
  { name: "fieldPlaceholders.message", label: "Message Field Placeholder" },
];

export const ContactFormSectionForm = (): ReactElement => (
  <TitleSubtitleSectionForm cardTitle="Contact Form Settings">
    {GENERAL_FIELDS.map((field) => (
      <SectionTextField<ContactFormSectionData> key={field.name} {...field} />
    ))}

    <FormCard title="Field Labels">
      {LABEL_FIELDS.map((field) => (
        <SectionTextField<ContactFormSectionData> key={field.name} {...field} />
      ))}
    </FormCard>

    <FormCard title="Field Placeholders">
      {PLACEHOLDER_FIELDS.map((field) => (
        <SectionTextField<ContactFormSectionData> key={field.name} {...field} />
      ))}
    </FormCard>
  </TitleSubtitleSectionForm>
);
