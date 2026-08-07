export type LegacyCatalogEntry = { id: number; name: string };

export const LEGACY_TRAINING_LEVELS: readonly LegacyCatalogEntry[] = [
  { id: 1, name: "Scaled" },
  { id: 2, name: "Pro" },
  { id: 3, name: "Advanced" },
  { id: 4, name: "Functional Bodybuilding" },
];

export const LEGACY_USER_PLANS: readonly LegacyCatalogEntry[] = [
  { id: 1, name: "General" },
  { id: 2, name: "Individual" },
];

export const LEGACY_USER_ROLES: readonly LegacyCatalogEntry[] = [
  { id: 1, name: "USER" },
  { id: 2, name: "ADMIN" },
];

export const findLegacyCatalogEntry = (
  catalog: readonly LegacyCatalogEntry[],
  id: number,
): LegacyCatalogEntry | null => catalog.find((entry) => entry.id === id) ?? null;
