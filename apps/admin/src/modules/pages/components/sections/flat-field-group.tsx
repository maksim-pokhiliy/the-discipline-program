"use client";

import { type ReactElement } from "react";

import { TextField } from "@mui/material";
import { useFormContext } from "react-hook-form";

import { FormCard } from "@app/lib/components/form-card";

import { type FieldGroup } from "./flat-fields-section-form.types";

type FlatFieldGroupProps = { group: FieldGroup };

export const FlatFieldGroup = ({ group }: FlatFieldGroupProps): ReactElement => {
  const { register } = useFormContext<Record<string, string>>();
  const inputs = Object.entries(group.fields).map(([name, field]) => (
    <TextField
      key={name}
      label={field.label}
      fullWidth
      {...(field.isMultiline && { multiline: true, minRows: 2 })}
      {...register(name)}
    />
  ));

  if (!group.heading) {
    return <>{inputs}</>;
  }

  return <FormCard title={group.heading}>{inputs}</FormCard>;
};
