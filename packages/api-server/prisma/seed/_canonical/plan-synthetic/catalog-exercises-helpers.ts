import type { ExerciseCatalogEntry } from "../canonical-schema";

type ExerciseSeed = Omit<ExerciseCatalogEntry, "defaultDemoUrls" | "aliases" | "notes"> & {
  defaultDemoUrls?: string[];
  aliases?: string[];
  notes?: string | null;
};

const buildExercise = (seed: ExerciseSeed): ExerciseCatalogEntry => ({
  ref: seed.ref,
  canonicalName: seed.canonicalName,
  primaryEquipment: seed.primaryEquipment,
  movementTypeTagPrimary: seed.movementTypeTagPrimary,
  movementTypeTagSecondary: seed.movementTypeTagSecondary,
  defaultDemoUrls: seed.defaultDemoUrls ?? [],
  canonicalCompoundType: seed.canonicalCompoundType,
  placeholderFlag: seed.placeholderFlag,
  movementFamily: seed.movementFamily,
  aliases: seed.aliases ?? [],
  notes: seed.notes ?? null,
});

export const atomic = (
  ref: string,
  canonicalName: string,
  primaryEquipment: ExerciseCatalogEntry["primaryEquipment"],
  movementTypeTagPrimary: ExerciseCatalogEntry["movementTypeTagPrimary"],
  movementFamily: string,
  extras?: { secondary?: ExerciseCatalogEntry["movementTypeTagSecondary"]; demo?: string },
): ExerciseCatalogEntry =>
  buildExercise({
    ref,
    canonicalName,
    primaryEquipment,
    movementTypeTagPrimary,
    movementTypeTagSecondary: extras?.secondary ?? null,
    canonicalCompoundType: "ATOMIC",
    placeholderFlag: false,
    movementFamily,
    defaultDemoUrls: extras?.demo === undefined ? [] : [extras.demo],
  });

export const compound = (
  ref: string,
  canonicalName: string,
  primaryEquipment: ExerciseCatalogEntry["primaryEquipment"],
  movementTypeTagPrimary: ExerciseCatalogEntry["movementTypeTagPrimary"],
  movementFamily: string,
  compoundKind: "COMPOUND_PLUS" | "COMPOSITE_NAMED" | "ALTERNATIVE_OR",
): ExerciseCatalogEntry =>
  buildExercise({
    ref,
    canonicalName,
    primaryEquipment,
    movementTypeTagPrimary,
    movementTypeTagSecondary: null,
    canonicalCompoundType: compoundKind,
    placeholderFlag: false,
    movementFamily,
  });

export const placeholder = (
  ref: string,
  canonicalName: string,
  movementFamily: string | null,
): ExerciseCatalogEntry =>
  buildExercise({
    ref,
    canonicalName,
    primaryEquipment: "UNKNOWN",
    movementTypeTagPrimary: "UNKNOWN",
    movementTypeTagSecondary: null,
    canonicalCompoundType: "PLACEHOLDER",
    placeholderFlag: true,
    movementFamily,
  });
