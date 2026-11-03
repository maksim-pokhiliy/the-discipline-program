"use client";

import { type ReactElement } from "react";

import { FormCard } from "@app/lib/components/form-card";

import { FlatFieldGroup } from "./flat-field-group";
import { type FieldGroup } from "./flat-fields-section-form.types";

type FlatFieldsSectionFormProps = { cardTitle: string; groups: readonly FieldGroup[] };

export const FlatFieldsSectionForm = ({
  cardTitle,
  groups,
}: FlatFieldsSectionFormProps): ReactElement => (
  <FormCard title={cardTitle}>
    {groups.map((group, index) => (
      <FlatFieldGroup key={group.heading ?? index} group={group} />
    ))}
  </FormCard>
);
