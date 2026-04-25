import type { SchemeKind } from "@repo/contracts/library/scheme";

export type AddBlockSlashItem = {
  kind: "add-block";
  id: string;
  blockTypeId: string;
  blockTypeSlug: string;
  label: string;
  description?: string;
};

export type AddSchemeSectionSlashItem = {
  kind: "add-scheme-section";
  id: string;
  schemeId: string;
  schemeKind: SchemeKind;
  schemeConfig: Record<string, number>;
  label: string;
  description?: string;
};

export type AddNotesSectionSlashItem = {
  kind: "add-notes-section";
  id: string;
  label: string;
  description?: string;
};

export type AddTextCalloutSectionSlashItem = {
  kind: "add-text-callout-section";
  id: string;
  label: string;
  description?: string;
};

export type SlashCommandItem =
  | AddBlockSlashItem
  | AddSchemeSectionSlashItem
  | AddNotesSectionSlashItem
  | AddTextCalloutSectionSlashItem;
