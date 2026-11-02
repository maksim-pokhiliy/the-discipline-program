export type FieldDescriptor = { label: string; isMultiline?: boolean };

export type FieldGroup = {
  heading?: string;
  fields: Readonly<Record<string, FieldDescriptor>>;
};
