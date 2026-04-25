import type { Scheme } from "@repo/contracts/library/scheme";
import { SCHEME_KIND_LABELS } from "@repo/contracts/library/scheme";

import type {
  AddNotesSectionSlashItem,
  AddSchemeSectionSlashItem,
  AddTextCalloutSectionSlashItem,
  SlashCommandItem,
} from "./slash-items-types";

const matches = (query: string, value: string): boolean =>
  query.length === 0 || value.toLowerCase().includes(query);

const toConfigShape = (value: unknown): Record<string, number> => {
  if (value === null || typeof value !== "object") {
    return {};
  }

  const result: Record<string, number> = {};

  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "number" && Number.isFinite(entry)) {
      result[key] = entry;
    }
  }

  return result;
};

export const buildSlashItemsBlock = (
  query: string,
  schemes: ReadonlyArray<Scheme>,
): SlashCommandItem[] => {
  const normalized = query.trim().toLowerCase();

  const schemeItems: AddSchemeSectionSlashItem[] = schemes
    .filter((scheme) => {
      const kindLabel = SCHEME_KIND_LABELS[scheme.kind] ?? scheme.kind;

      return (
        matches(normalized, scheme.name) ||
        matches(normalized, scheme.slug) ||
        matches(normalized, scheme.kind) ||
        matches(normalized, kindLabel) ||
        (scheme.description !== null && matches(normalized, scheme.description))
      );
    })
    .map((scheme) => ({
      kind: "add-scheme-section",
      id: `add-scheme-${scheme.id}`,
      schemeId: scheme.id,
      schemeKind: scheme.kind,
      schemeConfig: toConfigShape(scheme.paramDefaults),
      label: SCHEME_KIND_LABELS[scheme.kind] ?? scheme.name,
      description: scheme.description ?? undefined,
    }));

  const notesMatches = matches(normalized, "Notes") || matches(normalized, "note");
  const calloutMatches =
    matches(normalized, "Text callout") ||
    matches(normalized, "callout") ||
    matches(normalized, "text");

  const notesItem: AddNotesSectionSlashItem | null = notesMatches
    ? {
        kind: "add-notes-section",
        id: "add-notes",
        label: "Notes",
        description: "Free-form coach note",
      }
    : null;

  const calloutItem: AddTextCalloutSectionSlashItem | null = calloutMatches
    ? {
        kind: "add-text-callout-section",
        id: "add-text-callout",
        label: "Text callout",
        description: "Highlighted prose section",
      }
    : null;

  const items: SlashCommandItem[] = [...schemeItems];

  if (notesItem !== null) {
    items.push(notesItem);
  }

  if (calloutItem !== null) {
    items.push(calloutItem);
  }

  return items;
};
