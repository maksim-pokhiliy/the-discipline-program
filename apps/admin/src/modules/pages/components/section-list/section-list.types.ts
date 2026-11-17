export type ListRowField = { label: string; minRows?: number; columns?: number };

export type SectionList = {
  name: string;
  countLabel: string;
  addLabel: string;
  itemName: string;
  fields: Readonly<Record<string, ListRowField>>;
};

export type ListRowValues = Record<string, string>;
export type ListFormValues = Record<string, ListRowValues[]>;
