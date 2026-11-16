"use client";

import { type ReactElement } from "react";

import { FormCard } from "@app/lib/components/form-card";

import { SectionTextField } from "../section-field";

import { type FieldGroup } from "./flat-fields-section-form.types";

type FlatFieldGroupProps = { group: FieldGroup };

export const FlatFieldGroup = ({ group }: FlatFieldGroupProps): ReactElement => {
  const inputs = Object.entries(group.fields).map(([name, field]) => (
    <SectionTextField<Record<string, string>>
      key={name}
      label={field.label}
      name={name}
      {...(field.isMultiline && { minRows: 2 })}
    />
  ));

  if (!group.heading) {
    return <>{inputs}</>;
  }

  return <FormCard title={group.heading}>{inputs}</FormCard>;
};
