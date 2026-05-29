"use client";

import type { FieldErrors } from "react-hook-form";

import type { ArchetypeName } from "@repo/contracts/lms/schema";

import { EmptyParamsForm } from "./no-params-notice";
import { SCHEMA_PARAM_FORM_REGISTRY } from "./schema-param-form-registry";

type SchemaParamFormDispatchProps = {
  archetype: ArchetypeName;
  value: unknown;
  onChange: (next: unknown) => void;
  error?: FieldErrors | undefined;
  disabled?: boolean;
};

type ErasedParamFormProps = {
  value: unknown;
  onChange: (next: unknown) => void;
  error?: FieldErrors | undefined;
  disabled?: boolean | undefined;
};

type RegistryEntry = NonNullable<(typeof SCHEMA_PARAM_FORM_REGISTRY)[ArchetypeName]>;

const eraseEntryForm = (entry: RegistryEntry): React.FC<ErasedParamFormProps> =>
  entry.Form as React.FC<ErasedParamFormProps>;

export const SchemaParamFormDispatch: React.FC<SchemaParamFormDispatchProps> = ({
  archetype,
  value,
  onChange,
  error,
  disabled,
}) => {
  const entry = SCHEMA_PARAM_FORM_REGISTRY[archetype];

  if (entry === undefined) {
    return <EmptyParamsForm archetype={archetype} />;
  }

  const Form = eraseEntryForm(entry);

  return <Form value={value} onChange={onChange} error={error} disabled={disabled} />;
};
