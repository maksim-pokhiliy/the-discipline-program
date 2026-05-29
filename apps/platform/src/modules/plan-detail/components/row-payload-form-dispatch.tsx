"use client";

import type { FieldErrors } from "react-hook-form";

import type { RowKind } from "@repo/contracts/lms/schema-row";

import { ROW_PAYLOAD_FORM_REGISTRY } from "./row-payload-form-registry";

type RowPayloadFormDispatchProps = {
  rowKind: RowKind;
  value: unknown;
  onChange: (next: unknown) => void;
  error?: FieldErrors | undefined;
  disabled?: boolean;
};

export const RowPayloadFormDispatch: React.FC<RowPayloadFormDispatchProps> = ({
  rowKind,
  value,
  onChange,
  error,
  disabled,
}) => {
  const entry = ROW_PAYLOAD_FORM_REGISTRY[rowKind];

  if (entry === undefined) {
    return null;
  }

  const { Form } = entry;

  return <Form value={value} onChange={onChange} error={error} disabled={disabled} />;
};
